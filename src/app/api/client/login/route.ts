export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseServer } from '@/lib/supabase-server'
import { signClientToken, CLIENT_COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/clientAuth'

function normalizePhone(raw: string): string | null {
  const digits = raw.trim().replace(/\D/g, '')
  if (digits.length === 8) return `+228${digits}`
  if (digits.length === 11 && digits.startsWith('228')) return `+${digits}`
  if (digits.length === 12 && digits.startsWith('228')) return `+${digits}`
  if (raw.trim().startsWith('+') && digits.length >= 10) return `+${digits}`
  if (digits.length < 8) return null
  return `+${digits}`
}

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'Téléphone et mot de passe requis' }, { status: 400 })
    }

    const cleanPhone = normalizePhone(phone)
    if (!cleanPhone) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
    }

    // Try exact match first, then fallback to suffix match for legacy data
    let { data: account, error } = await supabaseServer
      .from('client_accounts')
      .select('id, name, phone, password_hash')
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (!account) {
      const digits = cleanPhone.replace(/\D/g, '').slice(-8)
      const { data: fallback } = await supabaseServer
        .from('client_accounts')
        .select('id, name, phone, password_hash')
        .ilike('phone', `%${digits}`)
        .maybeSingle()
      if (fallback) account = fallback
    }

    if (!account) {
      return NextResponse.json({ error: 'Numéro ou mot de passe incorrect' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, account.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Numéro ou mot de passe incorrect' }, { status: 401 })
    }

    const token = await signClientToken({ id: account.id, name: account.name, phone: account.phone })
    const res = NextResponse.json({ success: true, name: account.name })
    res.cookies.set(CLIENT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[client/login]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
