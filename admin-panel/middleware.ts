import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Simplified middleware - only handle root redirects
  // Let AdminLayout component handle all authentication logic
  console.log('Middleware - Simplified mode for path:', request.nextUrl.pathname)

  // Only redirect from root to login
  if (request.nextUrl.pathname === '/') {
    console.log('Middleware - Redirecting root to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Allow all other requests through - AdminLayout will handle auth
  console.log('Middleware - Allowing request to proceed')
  return NextResponse.next()
}



export const config = {
  matcher: [
    // Enable middleware protection for all routes except static files, API routes, and test pages
    '/((?!api|_next/static|_next/image|favicon.ico|test-auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}