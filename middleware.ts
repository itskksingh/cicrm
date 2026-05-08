import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const subdomain = isLocalhost ? null : hostname.split('.')[0]

  const requestHeaders = new Headers(request.headers)
  if (subdomain) requestHeaders.set('x-tenant-subdomain', subdomain)

  const explicitTenant = request.headers.get('x-tenant-id')
  if (explicitTenant) requestHeaders.set('x-tenant-id', explicitTenant)

  const { pathname } = request.nextUrl
  const secret = process.env.NEXTAUTH_SECRET

  // ─── Super Admin Routes ──────────────────────────────────────────────────
  if (pathname.startsWith('/super-admin')) {
    const token = await getToken({ req: request, secret })
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (token.role !== 'super_admin') {
      // Non-super-admins get bounced to their dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ─── Dashboard Routes ────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req: request, secret })
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Super admins shouldn't be in org dashboard
    if (token.role === 'super_admin') {
      return NextResponse.redirect(new URL('/super-admin', request.url))
    }

    // Admin-only routes
    const adminOnlyPaths = [
      '/dashboard/settings',
      '/dashboard/doctors',
      '/dashboard/integrations',
      '/dashboard/staff',
    ]
    const isAdminRoute = adminOnlyPaths.some((p) => pathname.startsWith(p))
    if (isAdminRoute && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
