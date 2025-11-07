import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production'

// Simple token verification for middleware (without database access)
const verifyTokenMiddleware = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

export async function middleware(request: NextRequest) {
  // Temporarily disable middleware to test client-side protection only
  return NextResponse.next()

  /*
  const { pathname } = request.nextUrl

  // Define route patterns that require authentication
  const protectedRoutePatterns = [
    /^\/student/,
    /^\/teacher/,
    /^\/admin/
  ]

  // Check if current path matches any protected route
  const isProtectedRoute = protectedRoutePatterns.some(pattern => pattern.test(pathname))
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get token from cookies or Authorization header
  let token: string | null = null
  
  // Check Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  // If no Authorization header, check cookies
  if (!token) {
    token = request.cookies.get('auth-token')?.value || null
  }

  // Debug logging (remove in production)
  console.log('Middleware - Path:', pathname, 'Token found:', !!token)

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token (basic JWT verification without database lookup)
  const decoded = verifyTokenMiddleware(token)
  if (!decoded) {
    console.log('Middleware - Token verification failed')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log('Middleware - Token verified, allowing access')
  // For role-based access control, we'll rely on the client-side RoleGuard components
  // since middleware runs on Edge Runtime and can't access the database
  return NextResponse.next()
  */
}

export const config = {
  matcher: [
    '/student/:path*',
    '/teacher/:path*', 
    '/admin/:path*'
  ]
}