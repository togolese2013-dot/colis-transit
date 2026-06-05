export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { notifyClientArriveLome, notifyClientEnTransit } from '@/lib/whatsapp'

export async function PUT(req: NextRequest) {
  try {
    // Auth check
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const session = token ? await verifyToken(token) : null
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'id et status requis' }, { status: 400 })
    }

    // Fetch package before update (need phone/name for notification)
    const { data: pkg, error: fetchError } = await supabase
      .from('packages')
      .select('id, tracking_number, customer_name, customer_phone, weight_kg, shipping_type, status')
      .eq('id', id)
      .single()

    if (fetchError || !pkg) {
      return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 })
    }

    // Update status
    const { error: updateError } = await supabase
      .from('packages')
      .update({ status })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // WhatsApp notification
    let waResult = null
    if (pkg.customer_phone && pkg.customer_name) {
      if (status === 'EN_TRANSIT') {
        waResult = await notifyClientEnTransit({
          phone: pkg.customer_phone,
          customerName: pkg.customer_name,
          trackingNumber: pkg.tracking_number,
        }).catch(err => ({ ok: false, error: String(err) }))
      }
      if (status === 'ARRIVE_LOME') {
        waResult = await notifyClientArriveLome({
          phone: pkg.customer_phone,
          customerName: pkg.customer_name,
          trackingNumber: pkg.tracking_number,
        }).catch(err => ({ ok: false, error: String(err) }))
      }
    }

    return NextResponse.json({ success: true, wa: waResult })
  } catch (err) {
    console.error('[PUT /api/packages/status]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
