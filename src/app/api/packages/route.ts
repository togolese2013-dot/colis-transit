export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { notifyClientColisRecu } from '@/lib/whatsapp'

function normalizePhone(phone: string | null) {
  if (!phone) return null
  const compact = phone.trim().replace(/\s+/g, '')
  return compact || null
}

function sameName(a: string | null, b: string | null) {
  return (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()
}

async function findKnownCustomerName(phone: string) {
  const { data: customer } = await supabaseServer
    .from('customers')
    .select('name')
    .eq('phone', phone)
    .not('name', 'is', null)
    .limit(1)
    .maybeSingle()

  if (customer?.name) return customer.name

  const { data: pkg } = await supabaseServer
    .from('packages')
    .select('customer_name')
    .eq('customer_phone', phone)
    .not('customer_name', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return pkg?.customer_name ?? null
}

export async function POST(req: NextRequest) {
  try {
    // Auth check — must be logged-in admin
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const session = token ? await verifyToken(token) : null
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const {
      tracking_number,
      customer_name,
      customer_phone,
      weight_kg,
      shipping_type,
      photo_url,
      photo_urls,
      notes,
      unknown_client,
    } = body

    if (!tracking_number) {
      return NextResponse.json({ error: 'Numéro de tracking requis' }, { status: 400 })
    }

    const finalCustomerName = unknown_client ? null : (customer_name?.trim() || null)
    const finalCustomerPhone = unknown_client ? null : normalizePhone(customer_phone)
    const finalWeight = weight_kg ? parseFloat(weight_kg) : null

    if (finalCustomerPhone && finalCustomerName) {
      const knownName = await findKnownCustomerName(finalCustomerPhone)
      if (knownName && !sameName(knownName, finalCustomerName)) {
        return NextResponse.json({
          error: `Ce numéro est déjà associé à ${knownName}. Utilisez ce nom ou vérifiez le numéro.`,
          existingName: knownName,
        }, { status: 409 })
      }
    }

    // Insert package
    const { data: pkg, error } = await supabaseServer
      .from('packages')
      .insert([{
        tracking_number,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        weight_kg: finalWeight,
        shipping_type: shipping_type || 'ORDINAIRE',
        photo_url: photo_url || null,
        photo_urls: photo_urls || [],
        notes: notes || null,
        status: 'RECU_CHINE',
      }])
      .select('id, tracking_number')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ce numéro de tracking existe déjà' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Upsert customer
    if (finalCustomerName) {
      await supabaseServer.from('customers').upsert(
        { name: finalCustomerName, phone: finalCustomerPhone },
        { onConflict: 'name' }
      )
    }

    // WhatsApp notification — fire and forget (don't block response)
    if (finalCustomerPhone && finalCustomerName && finalWeight) {
      notifyClientColisRecu({
        phone: finalCustomerPhone,
        customerName: finalCustomerName,
        trackingNumber: tracking_number,
        weightKg: finalWeight,
        shippingType: shipping_type || 'ORDINAIRE',
      }).catch(err => console.error('[whatsapp] notify failed:', err))
    }

    return NextResponse.json({ success: true, id: pkg.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/packages]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
