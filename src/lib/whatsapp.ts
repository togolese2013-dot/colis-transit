const WHATSAPP_API = 'https://graph.facebook.com/v20.0'
const TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_ID = process.env.WHATSAPP_PHONE_ID

const RATE: Record<string, number> = {
  ORDINAIRE: 10000,
  EXPRESS: 13000,
}

export function calculatePrice(weightKg: number, shippingType: string): number {
  const rate = RATE[shippingType?.toUpperCase()] ?? 10000
  return Math.round(weightKg * rate)
}

export function formatPhone(phone: string): string {
  // Ensure E.164 format: remove spaces, ensure starts with +
  const cleaned = phone.replace(/\s+/g, '').replace(/[^+\d]/g, '')
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

/**
 * Send WhatsApp template message via Cloud API.
 * templateName must be approved in Meta Business Manager.
 * components: array of parameter values in order ({{1}}, {{2}}, ...)
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  components: string[],
  language = 'fr'
): Promise<{ ok: boolean; error?: string }> {
  if (!TOKEN || !PHONE_ID) {
    console.warn('[whatsapp] WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not set — skipping')
    return { ok: false, error: 'Missing env vars' }
  }

  const body = {
    messaging_product: 'whatsapp',
    to: formatPhone(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components: [
        {
          type: 'body',
          parameters: components.map(value => ({ type: 'text', text: value })),
        },
      ],
    },
  }

  try {
    const res = await fetch(`${WHATSAPP_API}/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('[whatsapp] API error:', JSON.stringify(err))
      return { ok: false, error: err?.error?.message ?? 'WhatsApp API error' }
    }

    return { ok: true }
  } catch (err) {
    console.error('[whatsapp] fetch error:', err)
    return { ok: false, error: 'Network error' }
  }
}

/**
 * Notify client: package arrived in Lomé.
 * Template "colis_arrive_lome":
 *   {{1}} = nom client
 *   {{2}} = numéro de tracking
 */
export async function notifyClientArriveLome(params: {
  phone: string
  customerName: string
  trackingNumber: string
}) {
  const templateName = process.env.WHATSAPP_TEMPLATE_ARRIVE_LOME ?? 'colis_arrive_lome'
  return sendWhatsAppTemplate(params.phone, templateName, [
    params.customerName,
    params.trackingNumber,
  ])
}

/**
 * Notify client: package received in China.
 * Template "colis_recu_chine":
 *   {{1}} = nom client
 *   {{2}} = numéro de tracking
 *   {{3}} = poids (kg)
 *   {{4}} = montant FCFA
 */
export async function notifyClientColisRecu(params: {
  phone: string
  customerName: string
  trackingNumber: string
  weightKg: number
  shippingType: string
}) {
  const price = calculatePrice(params.weightKg, params.shippingType)
  const priceFormatted = price.toLocaleString('fr-FR')
  const weightFormatted = params.weightKg.toString().replace('.', ',')
  const templateName = process.env.WHATSAPP_TEMPLATE_COLIS_RECU ?? 'colis_recu_chine'

  const typeLabel = params.shippingType?.toUpperCase() === 'EXPRESS' ? 'Express ⚡' : 'Ordinaire ✈️'

  return sendWhatsAppTemplate(params.phone, templateName, [
    params.customerName,
    params.trackingNumber,
    `${weightFormatted} kg`,
    `${priceFormatted} FCFA`,
    typeLabel,
  ])
}
