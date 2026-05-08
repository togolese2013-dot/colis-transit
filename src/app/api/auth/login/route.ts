import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, username, password_hash, role, display_name')
      .eq('username', username.trim().toLowerCase())
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    if (admin.role === 'disabled') {
      return NextResponse.json({ error: 'Ce compte a été désactivé' }, { status: 403 })
    }

    const token = await signToken({ id: admin.id, username: admin.username, role: admin.role || 'admin' })

    const res = NextResponse.json({
      success: true,
      displayName: admin.display_name || admin.username,
    })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return res
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
