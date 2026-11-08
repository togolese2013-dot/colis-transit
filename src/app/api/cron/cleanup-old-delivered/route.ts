export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cleanupOldDeliveredPackages } from '@/lib/package-cleanup'

const EXPECTED_HEADER = 'x-cron-secret'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || ''
  const requestSecret = req.headers.get(EXPECTED_HEADER) || req.headers.get('authorization') || ''

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET manquant dans l’environnement' }, { status: 500 })
  }

  const expectedToken = cronSecret.startsWith('Bearer ')
    ? cronSecret
    : `Bearer ${cronSecret}`

  if (requestSecret !== expectedToken) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const result = await cleanupOldDeliveredPackages({
      days: Number(process.env.AUTO_DELETE_DELIVERED_DAYS ?? 60),
      dryRun: false,
      maxRecords: Number(process.env.CLEANUP_MAX_RECORDS ?? 2000),
    })

    return NextResponse.json({
      success: true,
      ...result,
      source: 'cron',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
