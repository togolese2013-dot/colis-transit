export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

async function getAdmin(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token ? await verifyToken(token) : null
}

export async function GET(req: NextRequest) {
  const session = await getAdmin(req)
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('settings')
    .select('key, value')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const map: Record<string, string> = {}
  data?.forEach(row => { map[row.key] = row.value })
  return NextResponse.json(map)
}

export async function PUT(req: NextRequest) {
  const session = await getAdmin(req)
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body: Record<string, string> = await req.json()

  const upserts = Object.entries(body).map(([key, value]) => ({ key, value }))
  const { error } = await supabase
    .from('settings')
    .upsert(upserts, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
