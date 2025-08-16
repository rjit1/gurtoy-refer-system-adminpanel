import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Basic edge protection can be added later with Supabase SSR helpers
export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/kyc'],
}