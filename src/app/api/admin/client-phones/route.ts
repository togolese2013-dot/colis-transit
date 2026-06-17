export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const session = token ? await verifyToken(token) : null
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data, error } = await supabaseServer
      .from('client_accounts')
      .select('phone')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ phones: (data || []).map((r: any) => r.phone).filter(Boolean) })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
