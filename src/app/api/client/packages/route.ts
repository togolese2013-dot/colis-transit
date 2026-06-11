export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyClientToken, CLIENT_COOKIE_NAME } from '@/lib/clientAuth'

function buildPhoneVariants(phone: string): string[] {
  const digits = phone.replace(/\D/g, '')
  const last8 = digits.slice(-8)
  return [...new Set([phone, last8, `+228${last8}`, `228${last8}`])]
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(CLIENT_COOKIE_NAME)?.value
    const session = token ? await verifyClientToken(token) : null

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const phoneVariants = buildPhoneVariants(session.phone)
    const { data, error } = await supabaseServer
      .from('packages')
      .select('id, tracking_number, status, weight_kg, shipping_type, photo_urls, photo_url, created_at, notes')
      .in('customer_phone', phoneVariants)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ packages: data ?? [], name: session.name })
  } catch (err) {
    console.error('[client/packages]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
