import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_PATHS = ['/track', '/login']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'

  if (isPublic) return NextResponse.next()

  try {
    const token = req.cookies.get(COOKIE_NAME)?.value
    const session = token ? await verifyToken(token) : null

    if (!session) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Old token without role — force re-login to get fresh token
    if (!session.role) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    // /admin reserved for superadmin only
    if (pathname.startsWith('/admin') && session.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // /api/admin reserved for superadmin only
    if (pathname.startsWith('/api/admin') && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Section-level access control (superadmin bypasses)
    if (session.role !== 'superadmin') {
      const perms: string[] = Array.isArray(session.permissions) ? session.permissions : ['chine', 'lome']
      if (pathname.startsWith('/chine') && !perms.includes('chine')) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      if (pathname.startsWith('/lome') && !perms.includes('lome')) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  } catch {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
