export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

// POST /api/packages/upload — body: FormData, field "files" (1..n)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const session = token ? await verifyToken(token) : null
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files').filter((f): f is File => f instanceof File)
    if (files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
    }

    const urls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      const { error: uploadError } = await supabaseServer.storage.from('packages').upload(fileName, file)
      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }
      const { data } = supabaseServer.storage.from('packages').getPublicUrl(fileName)
      urls.push(data.publicUrl)
    }

    return NextResponse.json({ success: true, urls })
  } catch (err) {
    console.error('[POST /api/packages/upload]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
