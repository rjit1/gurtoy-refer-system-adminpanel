import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/security-utils'

// Force this route to be dynamic since it reads cookies
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Create server client to check auth status
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // For admin routes, check if user has admin role
    if (request.nextUrl.pathname.startsWith('/admin')) {
      try {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        if (!userRoles || userRoles.role !== 'admin') {
          return NextResponse.json({ authenticated: true, isAdmin: false }, { status: 403 })
        }
        
        return NextResponse.json({ authenticated: true, isAdmin: true }, { status: 200 })
      } catch (error) {
        console.error('Error checking admin role:', error)
        return NextResponse.json({ authenticated: true, isAdmin: false, error: 'Error checking admin role' }, { status: 500 })
      }
    }

    return NextResponse.json({ authenticated: true }, { status: 200 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ authenticated: false, error: 'Authentication error' }, { status: 500 })
  }
}