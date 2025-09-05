import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes for each user type
const protectedRoutes = {
  admin: ['/admin'],
  external: ['/external-requesters'],
  user: ['/emr', '/accounts']
}

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/admin/login',
  '/external-requesters/login',
  '/external-requesters/register',
  '/api/health'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes (exact match or starts with)
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Check for admin routes (but not admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = request.cookies.get('admin-token')?.value
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Check for external requester routes (but not login/register)
  if (pathname.startsWith('/external-requesters') && 
      !pathname.startsWith('/external-requesters/login') && 
      !pathname.startsWith('/external-requesters/register')) {
    const externalToken = request.cookies.get('external-requester-token')?.value
    if (!externalToken) {
      return NextResponse.redirect(new URL('/external-requesters/login', request.url))
    }
  }

  // Check for general user routes
  if (pathname.startsWith('/emr') || pathname.startsWith('/accounts')) {
    const userToken = request.cookies.get('access_token')?.value
    if (!userToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
