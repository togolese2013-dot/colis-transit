import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback_dev_secret')

export const COOKIE_NAME = 'hc_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface AdminPayload {
  id: string
  username: string
  [key: string]: unknown
}

export async function signToken(payload: AdminPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as AdminPayload
  } catch {
    return null
  }
}
