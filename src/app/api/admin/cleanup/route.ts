export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cleanupOldDeliveredPackages } from '@/lib/package-cleanup'

async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token ? await verifyToken(token) : null
}

export async function GET() {
  const session = await getAdminSession()
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const result = await cleanupOldDeliveredPackages({ dryRun: true })
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const days = Number(body.days ?? process.env.AUTO_DELETE_DELIVERED_DAYS ?? 60)
    const dryRun = Boolean(body.dryRun)
    const maxRecords = Number(body.maxRecords ?? 2000)

    const result = await cleanupOldDeliveredPackages({
      days,
      dryRun,
      maxRecords,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
