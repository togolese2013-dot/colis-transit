export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

async function getAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token ? await verifyToken(token) : null
}

export async function GET() {
  const session = await getAdmin()
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const [packages, customers, clientAccounts] = await Promise.all([
    supabaseServer.from('packages').select('*').order('created_at', { ascending: false }),
    supabaseServer.from('customers').select('*').order('created_at', { ascending: false }),
    supabaseServer.from('client_accounts').select('id, name, phone, created_at').order('created_at', { ascending: false }),
  ])

  const backup = {
    exported_at: new Date().toISOString(),
    exported_by: session.username ?? session.sub,
    tables: {
      packages: {
        count: packages.data?.length ?? 0,
        rows: packages.data ?? [],
      },
      customers: {
        count: customers.data?.length ?? 0,
        rows: customers.data ?? [],
      },
      client_accounts: {
        count: clientAccounts.data?.length ?? 0,
        rows: clientAccounts.data ?? [],
      },
    },
  }

  const date = new Date().toISOString().slice(0, 10)
  const json = JSON.stringify(backup, null, 2)

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="hamidcargo_backup_${date}.json"`,
    },
  })
}
