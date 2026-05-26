export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

async function getAdmin(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token ? await verifyToken(token) : null
}

// List all users
export async function GET(req: NextRequest) {
  const session = await getAdmin(req)
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('admins')
    .select('id, username, display_name, role, permissions, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Create user
export async function POST(req: NextRequest) {
  const session = await getAdmin(req)
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { username, password, displayName, role, permissions } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Identifiant et mot de passe requis' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Mot de passe trop court (min 6 caractères)' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)
  const { data, error } = await supabase
    .from('admins')
    .insert({
      username: username.trim().toLowerCase(),
      password_hash: hash,
      display_name: displayName?.trim() || null,
      role: role || 'admin',
      permissions: permissions ?? ['chine', 'lome'],
    })
    .select('id, username, display_name, role, permissions, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cet identifiant existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// Update user (role, display_name, password)
export async function PUT(req: NextRequest) {
  const session = await getAdmin(req)
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { id, displayName, role, newPassword, permissions } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

  // Cannot demote yourself
  if (id === session.id && role && role !== 'superadmin') {
    return NextResponse.json({ error: 'Vous ne pouvez pas changer votre propre rôle' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (displayName !== undefined) updates.display_name = displayName?.trim() || null
  if (role !== undefined) updates.role = role
  if (permissions !== undefined) updates.permissions = permissions
  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (min 6 caractères)' }, { status: 400 })
    }
    updates.password_hash = await bcrypt.hash(newPassword, 12)
  }

  const { data, error } = await supabase
    .from('admins')
    .update(updates)
    .eq('id', id)
    .select('id, username, display_name, role, permissions, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Delete user
export async function DELETE(req: NextRequest) {
  const session = await getAdmin(req)
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

  if (id === session.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 })
  }

  const { error } = await supabase.from('admins').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
