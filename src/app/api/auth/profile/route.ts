export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyToken, signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const session = token ? await verifyToken(token) : null

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { type } = body

    const { data: admin, error: fetchError } = await supabaseServer
      .from('admins')
      .select('id, username, password_hash, display_name, role')
      .eq('id', session.id)
      .single()

    if (fetchError || !admin) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Display name — no password required
    if (type === 'displayname') {
      const trimmed = body.displayName?.trim()
      if (!trimmed || trimmed.length < 2) {
        return NextResponse.json({ error: 'Le nom doit contenir au moins 2 caractères' }, { status: 400 })
      }

      const { error } = await supabaseServer
        .from('admins')
        .update({ display_name: trimmed })
        .eq('id', admin.id)

      if (error) throw error

      return NextResponse.json({ success: true, displayName: trimmed })
    }

    // Username and password changes require current password
    const passwordValid = await bcrypt.compare(body.currentPassword, admin.password_hash)
    if (!passwordValid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 })
    }

    if (type === 'username') {
      const trimmed = body.newUsername?.trim().toLowerCase()
      if (!trimmed || trimmed.length < 3) {
        return NextResponse.json({ error: 'L\'identifiant doit contenir au moins 3 caractères' }, { status: 400 })
      }

      const { error } = await supabaseServer
        .from('admins')
        .update({ username: trimmed })
        .eq('id', admin.id)

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Cet identifiant est déjà utilisé' }, { status: 409 })
        }
        throw error
      }

      const newToken = await signToken({ id: admin.id, username: trimmed, role: admin.role || 'admin' })
      const res = NextResponse.json({ success: true })
      res.cookies.set(COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      })
      return res
    }

    if (type === 'password') {
      if (!body.newPassword || body.newPassword.length < 6) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
      }

      const hash = await bcrypt.hash(body.newPassword, 12)
      const { error } = await supabaseServer
        .from('admins')
        .update({ password_hash: hash })
        .eq('id', admin.id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  } catch (err) {
    console.error('[profile PUT]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Returns current display_name for the logged-in admin
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const session = token ? await verifyToken(token) : null

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: admin, error } = await supabaseServer
      .from('admins')
      .select('username, display_name, role, permissions')
      .eq('id', session.id)
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    }

    const permissions: string[] = admin.role === 'superadmin'
      ? ['chine', 'lome']
      : (admin.permissions ?? ['chine', 'lome'])

    return NextResponse.json({
      username: admin.username,
      displayName: admin.display_name || admin.username,
      role: admin.role || 'admin',
      permissions,
    })
  } catch (err) {
    console.error('[profile GET]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
