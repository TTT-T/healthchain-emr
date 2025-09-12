import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes for each user type
// const protectedRoutes = {
//   admin: ['/admin'],
//   external: ['/external-requesters'],
//   user: ['/emr', '/accounts']
// }

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/admin/login',
  '/doctor/login',
  '/nurse/login',
  '/medical-staff/register',
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
  if (pathname.startsWith('/admin') && 
      pathname !== '/admin/login') {
    const accessToken = request.cookies.get('access_token')?.value
    console.log('🔍 Middleware - Checking access token for admin path:', pathname, 'Token exists:', !!accessToken)
    if (!accessToken) {
      console.log('🔍 Middleware - No access token, redirecting to admin login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    // Additional validation: check if token is valid JWT format
    if (accessToken && !accessToken.startsWith('eyJ')) {
      console.log('🔍 Middleware - Invalid token format, redirecting to admin login')
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

  // Check for doctor routes (but not doctor/login)
  if (pathname.startsWith('/doctor') && pathname !== '/doctor/login') {
    const userToken = request.cookies.get('access_token')?.value
    console.log('🔍 Middleware - Checking doctor token for path:', pathname, 'Token exists:', !!userToken)
    if (!userToken) {
      console.log('🔍 Middleware - No doctor token, redirecting to doctor login')
      return NextResponse.redirect(new URL('/doctor/login', request.url))
    }
  }

  // Check for nurse routes (but not nurse/login)
  if (pathname.startsWith('/nurse') && pathname !== '/nurse/login') {
    const userToken = request.cookies.get('access_token')?.value
    console.log('🔍 Middleware - Checking nurse token for path:', pathname, 'Token exists:', !!userToken)
    if (!userToken) {
      console.log('🔍 Middleware - No nurse token, redirecting to nurse login')
      return NextResponse.redirect(new URL('/nurse/login', request.url))
    }
  }

  // Check for medical-staff routes (but not register)
  if (pathname.startsWith('/medical-staff') && 
      !pathname.startsWith('/medical-staff/register')) {
    const userToken = request.cookies.get('access_token')?.value
    console.log('🔍 Middleware - Checking medical-staff token for path:', pathname, 'Token exists:', !!userToken)
    if (!userToken) {
      console.log('🔍 Middleware - No medical-staff token, redirecting to doctor login')
      return NextResponse.redirect(new URL('/doctor/login', request.url))
    }
  }

  // Check for EMR routes (for doctors and medical staff)
  if (pathname.startsWith('/emr')) {
    const userToken = request.cookies.get('access_token')?.value
    console.log('🔍 Middleware - Checking EMR token for path:', pathname, 'Token exists:', !!userToken)
    if (!userToken) {
      console.log('🔍 Middleware - No EMR token, redirecting to doctor login')
      return NextResponse.redirect(new URL('/doctor/login', request.url))
    }
    
    // Additional validation: check if token is valid JWT format
    if (userToken && !userToken.startsWith('eyJ')) {
      console.log('🔍 Middleware - Invalid token format, redirecting to doctor login')
      return NextResponse.redirect(new URL('/doctor/login', request.url))
    }
  }

  // Check for general user routes (patients)
  if (pathname.startsWith('/accounts')) {
    const userToken = request.cookies.get('access_token')?.value
    console.log('🔍 Middleware - Checking patient token for path:', pathname, 'Token exists:', !!userToken)
    if (!userToken) {
      console.log('🔍 Middleware - No patient token, redirecting to login')
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
