import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting configuration
const API_RATE_LIMIT = 60 // requests per minute
const API_RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

// Rate limiting storage (in-memory)
// Note: In production, you should use Redis or another external store for rate limiting
const rateLimitCache: Record<string, { count: number; timestamp: number }> = {}

// Clean up expired entries during each request instead of using setInterval
function cleanupRateLimitCache() {
  const now = Date.now()
  Object.keys(rateLimitCache).forEach(key => {
    if (now - rateLimitCache[key].timestamp > API_RATE_LIMIT_WINDOW) {
      delete rateLimitCache[key]
    }
  })
}

export async function middleware(request: NextRequest) {
  // Clean up expired rate limit entries
  cleanupRateLimitCache()
  
  // Skip middleware for static assets
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.ip || 'unknown'
    const key = `${ip}:${request.nextUrl.pathname}`
    
    // Initialize or reset if window expired
    const now = Date.now()
    if (!rateLimitCache[key] || now - rateLimitCache[key].timestamp > API_RATE_LIMIT_WINDOW) {
      rateLimitCache[key] = { count: 1, timestamp: now }
    } else {
      // Increment count
      rateLimitCache[key].count++
      
      // Check if limit exceeded
      if (rateLimitCache[key].count > API_RATE_LIMIT) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests', 
            message: 'Rate limit exceeded. Please try again later.' 
          }),
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': '60'
            } 
          }
        )
      }
    }
  }

  // Authentication check for protected routes is now handled by client-side redirects
  // and server components instead of middleware to avoid Edge Runtime issues with Supabase

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy - different for dev and production
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    // More permissive CSP for development (includes unsafe-eval for hot reloading)
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://mknxaioosbktcyfokvfw.supabase.co blob:; connect-src 'self' https://mknxaioosbktcyfokvfw.supabase.co ws: wss:;"
    )
  } else {
    // Strict CSP for production
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://mknxaioosbktcyfokvfw.supabase.co blob:; connect-src 'self' https://mknxaioosbktcyfokvfw.supabase.co;"
    )
  }

  return response
}

// Configure which paths should run the middleware
export const config = {
  matcher: [
    // Apply to all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}