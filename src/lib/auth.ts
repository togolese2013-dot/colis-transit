import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
export const COOKIE_NAME = 'hc_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface AdminPayload {
  id: string
  username: string
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload
  } catch {
    return null
  }
}
