export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { verifyClientToken, CLIENT_COOKIE_NAME } from '@/lib/clientAuth'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(CLIENT_COOKIE_NAME)?.value
    const session = token ? await verifyClientToken(token) : null

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('packages')
      .select('id, tracking_number, status, weight_kg, shipping_type, photo_urls, photo_url, created_at, notes')
      .eq('customer_phone', session.phone)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ packages: data ?? [], name: session.name })
  } catch (err) {
    console.error('[client/packages]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
