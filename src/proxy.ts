import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

const publicPaths = ['/login', '/reports/new', '/api/auth/login']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/teams') ||
    pathname.startsWith('/resources') ||
    pathname.startsWith('/hospitals') ||
    pathname.startsWith('/financial') ||
    pathname.startsWith('/approvals') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/audit')
  ) {
    const token = req.cookies.get('auth_token')?.value
    if (!token || !verifyToken(token)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/reports/:path*',
    '/teams/:path*',
    '/resources/:path*',
    '/hospitals/:path*',
    '/financial/:path*',
    '/approvals/:path*',
    '/analytics/:path*',
    '/audit/:path*',
    '/api/:path*',
  ],
}
