import { supabase } from './client'
import type { Profile } from './types'

// Create a profile row if it doesn't exist yet
export async function ensureUserProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  // Try to select existing profile
  const { data: existing, error: selErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (selErr) {
    console.error('Failed to fetch profile', selErr)
  }

  if (existing) return existing as Profile

  // Create new row from user metadata
  const { full_name, phone } = (user.user_metadata ?? {}) as {
    full_name?: string
    phone?: string
  }

  const { data: created, error: insErr } = await supabase
    .from('users')
    .insert({
      id: user.id,
      full_name: full_name ?? '',
      phone: phone ?? '',
      kyc_status: 'pending',
      referral_code: null,
      wallet_balance: 0,
      aadhaar_url: null,
      selfie_url: null,
    })
    .select('*')
    .single()

  if (insErr) {
    console.error('Failed to create profile', insErr)
    return null
  }

  return created as Profile
}