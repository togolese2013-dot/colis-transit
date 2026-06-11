export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyClientToken, signClientToken, CLIENT_COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/clientAuth'

function normalizePhone(raw: string): string | null {
  const digits = raw.trim().replace(/\D/g, '')
  if (digits.length === 8) return `+228${digits}`
  if (digits.length === 11 && digits.startsWith('228')) return `+${digits}`
  if (digits.length === 12 && digits.startsWith('228')) return `+${digits}`
  if (raw.trim().startsWith('+') && digits.length >= 10) return `+${digits}`
  if (digits.length < 8) return null
  return `+${digits}`
}

async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(CLIENT_COOKIE_NAME)?.value
  return token ? verifyClientToken(token) : null
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabaseServer
    .from('client_accounts')
    .select('id, name, phone, created_at')
    .eq('id', session.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, string> = {}

  if (body.name) updates.name = body.name.trim()

  if (body.phone) {
    const cleaned = normalizePhone(body.phone)
    if (!cleaned) return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 })
    updates.phone = cleaned
  }

  if (body.password) {
    if (body.password.length < 6) return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 })
    if (!body.currentPassword) return NextResponse.json({ error: 'Mot de passe actuel requis' }, { status: 400 })

    const { data: account } = await supabaseServer
      .from('client_accounts')
      .select('password_hash')
      .eq('id', session.id)
      .single()

    if (!account) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 })
    const valid = await bcrypt.compare(body.currentPassword, account.password_hash)
    if (!valid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 })
    updates.password_hash = await bcrypt.hash(body.password, 12)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucune modification' }, { status: 400 })
  }

  const { data, error } = await supabaseServer
    .from('client_accounts')
    .update(updates)
    .eq('id', session.id)
    .select('id, name, phone, created_at')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ce numéro est déjà utilisé' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Refresh JWT with new name/phone
  const token = await signClientToken({ id: data.id, name: data.name, phone: data.phone })
  const res = NextResponse.json({ success: true, ...data })
  res.cookies.set(CLIENT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
