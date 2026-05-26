import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback_dev_secret')

export const CLIENT_COOKIE_NAME = 'hc_client'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export interface ClientPayload {
  id: string
  name: string
  phone: string
  [key: string]: unknown
}

export async function signClientToken(payload: ClientPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)
}

export async function verifyClientToken(token: string): Promise<ClientPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as ClientPayload
  } catch {
    return null
  }
}
