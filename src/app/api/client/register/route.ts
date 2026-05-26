export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { signClientToken, CLIENT_COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/clientAuth'

export async function POST(req: NextRequest) {
  try {
    const { name, phone, password } = await req.json()

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (min 6 caractères)' }, { status: 400 })
    }
    const cleanPhone = phone.trim().replace(/\s+/g, '')
    if (cleanPhone.length < 8) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 12)

    const { data, error } = await supabase
      .from('client_accounts')
      .insert({ name: name.trim(), phone: cleanPhone, password_hash: hash })
      .select('id, name, phone, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const token = await signClientToken({ id: data.id, name: data.name, phone: data.phone })
    const res = NextResponse.json({ success: true, name: data.name })
    res.cookies.set(CLIENT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[client/register]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
