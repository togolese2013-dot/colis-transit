export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_ID = process.env.WHATSAPP_PHONE_ID
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

const AUTO_REPLY =
  'Merci pour votre message 🙏\n\nCe numéro est réservé aux notifications automatiques et n\'est pas surveillé. Merci de ne plus y écrire.\n\nPour toute question, contactez directement nos responsables :\n📞 Mouhamed : *+228 90 19 65 29*\n📞 Seyni : *+228 70 15 13 30*\n\n— Hamid Cargo'

// Meta webhook verification (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// Incoming message handler (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages?.length) {
      return NextResponse.json({ ok: true })
    }

    const msg = messages[0]
    const from = msg.from // sender phone in E.164 without +

    if (!TOKEN || !PHONE_ID || !from) {
      return NextResponse.json({ ok: false, error: 'Missing config' }, { status: 500 })
    }

    const sendRes = await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: from,
        type: 'text',
        text: { body: AUTO_REPLY },
      }),
    })

    if (!sendRes.ok) {
      const errBody = await sendRes.text()
      console.error('[whatsapp webhook] auto-reply failed:', from, sendRes.status, errBody)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[whatsapp webhook]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
