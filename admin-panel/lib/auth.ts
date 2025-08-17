import { supabase } from './supabase/client'
import { AdminUser } from './supabase/types'

export async function signInAdmin(email: string, password: string) {
  try {
    console.log('Starting admin sign in process...')

    // Clear any existing session first
    await supabase.auth.signOut()

    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100))

    // Sign in with Supabase client
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      throw new Error(authError.message || 'Authentication failed')
    }

    console.log('Auth successful, session created:', !!authData.session)

    // Check if user is admin using RPC with fallback
    let isAdminData = false

    try {
      const { data: rpcResult, error: isAdminError } = await supabase.rpc('is_admin')

      if (isAdminError) {
        console.warn('RPC function error, using email fallback:', isAdminError.message)
        // Fallback: Check if email matches admin email
        isAdminData = authData.user.email === 'thegurtoy@gmail.com'
      } else {
        isAdminData = rpcResult
      }
    } catch (rpcError) {
      console.warn('RPC function not available, using email fallback:', rpcError)
      // Fallback: Check if email matches admin email
      isAdminData = authData.user.email === 'thegurtoy@gmail.com'
    }

    if (!isAdminData) {
      console.error('Admin check failed - user is not admin')
      await supabase.auth.signOut()
      throw new Error('Access denied - Admin privileges required')
    }

    console.log('Admin verification successful')

    // Store admin flag in localStorage for quick access
    if (typeof window !== 'undefined') {
      localStorage.setItem('gurtoy-admin-verified', 'true')
      localStorage.setItem('gurtoy-admin-email', authData.user.email!)
    }

    return {
      user: authData.user,
      session: authData.session
    }
  } catch (error) {
    console.error('Admin sign in error:', error)
    throw error
  }
}

export async function signOutAdmin() {
  // Clear localStorage flags
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gurtoy-admin-verified')
    localStorage.removeItem('gurtoy-admin-email')
  }

  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    // Check current session directly with Supabase client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return null
    }

    if (!session || !session.user) {
      console.log('No active session found')

      // Check if we have admin verification in localStorage
      if (typeof window !== 'undefined') {
        const isAdminVerified = localStorage.getItem('gurtoy-admin-verified')
        const adminEmail = localStorage.getItem('gurtoy-admin-email')

        if (isAdminVerified && adminEmail) {
          console.log('Found admin verification in localStorage, but no session')
          // Clear stale localStorage data
          localStorage.removeItem('gurtoy-admin-verified')
          localStorage.removeItem('gurtoy-admin-email')
        }
      }

      return null
    }

    // Verify admin status with fallback logic
    let isAdminData = false

    try {
      const { data: rpcResult, error: isAdminError } = await supabase.rpc('is_admin')

      if (isAdminError) {
        console.warn('getCurrentAdmin: RPC function error, using email fallback:', isAdminError.message)
        // Fallback: Check if email matches admin email
        isAdminData = session.user.email === 'thegurtoy@gmail.com'
      } else {
        isAdminData = rpcResult
      }
    } catch (rpcError) {
      console.warn('getCurrentAdmin: RPC function not available, using email fallback:', rpcError)
      // Fallback: Check if email matches admin email
      isAdminData = session.user.email === 'thegurtoy@gmail.com'
    }

    if (!isAdminData) {
      console.log('getCurrentAdmin: Admin check failed - user is not admin')
      return null
    }

    // Update localStorage verification
    if (typeof window !== 'undefined') {
      localStorage.setItem('gurtoy-admin-verified', 'true')
      localStorage.setItem('gurtoy-admin-email', session.user.email!)
    }

    return {
      id: session.user.id,
      email: session.user.email!,
      role: 'admin'
    }
  } catch (error) {
    console.error('Get current admin error:', error)
    return null
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const admin = await getCurrentAdmin()
  return admin !== null
}

// Check if current session belongs to admin
export async function isValidAdminSession(userEmail?: string): Promise<boolean> {
  try {
    const admin = await getCurrentAdmin()
    return admin !== null && admin.email === userEmail
  } catch (error) {
    console.error('Admin session validation error:', error)
    return false
  }
}