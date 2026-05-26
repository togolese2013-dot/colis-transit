export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { signClientToken, CLIENT_COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/clientAuth'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'Téléphone et mot de passe requis' }, { status: 400 })
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '')

    const { data: account, error } = await supabase
      .from('client_accounts')
      .select('id, name, phone, password_hash')
      .eq('phone', cleanPhone)
      .single()

    if (error || !account) {
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
