import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Get admin email from environment variables (server-side only)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function middleware(request: NextRequest) {
  // In development mode, disable middleware auth and let AdminLayout handle it
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware - Development mode: Skipping auth check for path:', request.nextUrl.pathname)

    // Only redirect from root to login
    if (request.nextUrl.pathname === '/') {
      console.log('Middleware - Redirecting root to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Allow all other requests through
    return NextResponse.next()
  }

  // If ADMIN_EMAIL is not configured, disable middleware protection
  if (!ADMIN_EMAIL) {
    console.log('Middleware - ADMIN_EMAIL not configured, allowing all requests')

    // Only redirect from root to login
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }

  // Production middleware logic (keep original for production)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('Middleware - Path:', request.nextUrl.pathname)
  console.log('Middleware - User:', user?.email)
  console.log('Middleware - Error:', error?.message || 'none')
  console.log('Middleware - Admin Email:', ADMIN_EMAIL)

  // Handle root path redirect
  if (request.nextUrl.pathname === '/') {
    console.log('Middleware - Redirecting root to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Production authentication logic
  // If accessing login page and already authenticated as admin, redirect to dashboard
  const isAuthenticatedAdmin = user && (
    (ADMIN_EMAIL && user.email === ADMIN_EMAIL) ||
    (!ADMIN_EMAIL && user.email === 'thegurtoy@gmail.com')
  )

  if (request.nextUrl.pathname === '/login' && isAuthenticatedAdmin) {
    console.log('Redirecting authenticated admin from login to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If accessing protected routes without admin authentication, redirect to login
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/users') ||
      request.nextUrl.pathname.startsWith('/sales') ||
      request.nextUrl.pathname.startsWith('/withdrawals') ||
      request.nextUrl.pathname.startsWith('/notices') ||
      request.nextUrl.pathname.startsWith('/referral-requests')) {

    // Check if user is authenticated and is the admin
    const isAdmin = user && (
      (ADMIN_EMAIL && user.email === ADMIN_EMAIL) ||
      (!ADMIN_EMAIL && user.email === 'thegurtoy@gmail.com')
    )

    if (!isAdmin) {
      console.log('Redirecting unauthenticated user to login. User:', user?.email, 'Admin Email:', ADMIN_EMAIL)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log('Allowing access to protected route for admin')
  }

  return response
}

export const config = {
  matcher: [
    // Enable middleware protection for all routes except static files, API routes, and test pages
    '/((?!api|_next/static|_next/image|favicon.ico|test-auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}