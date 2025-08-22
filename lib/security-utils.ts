// Security utilities
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Create a server-side Supabase client with admin privileges
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Create a server-side Supabase client with user's session
export function createServerClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false
    },
    // @ts-ignore - The cookies option is not in the type but it works
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options })
      }
    }
  })
}

// Sanitize user input to prevent XSS attacks
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Validate phone number format
export function validatePhoneNumber(phone: string): boolean {
  // Indian phone number validation (10 digits, optionally with +91 prefix)
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/
  return phoneRegex.test(phone)
}

// Validate Aadhaar number format
export function validateAadhaarNumber(aadhaar: string): boolean {
  // Aadhaar is 12 digits
  const aadhaarRegex = /^\d{12}$/
  return aadhaarRegex.test(aadhaar)
}

// Validate IFSC code format
export function validateIFSC(ifsc: string): boolean {
  // IFSC is 11 characters: first 4 are letters (bank code), 5th is 0 (reserved), last 6 can be alphanumeric
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return ifscRegex.test(ifsc)
}

// Validate UPI ID format
export function validateUPI(upi: string): boolean {
  // UPI ID format: username@provider
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/
  return upiRegex.test(upi)
}

// Validate bank account number
export function validateBankAccount(accountNumber: string): boolean {
  // Bank account numbers in India are typically between 9 and 18 digits
  const accountRegex = /^\d{9,18}$/
  return accountRegex.test(accountNumber)
}

// Generate a secure random string (for referral codes, etc.)
export function generateSecureRandomString(length: number = 8): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  
  // Use crypto API for better randomness if available
  if (typeof window !== 'undefined' && window.crypto) {
    const randomValues = new Uint32Array(length)
    window.crypto.getRandomValues(randomValues)
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(randomValues[i] % characters.length)
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
  }
  
  return result
}

// Rate limiting helper
const rateLimits: Record<string, { count: number, timestamp: number }> = {}

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  
  // Initialize or reset expired entries
  if (!rateLimits[key] || now - rateLimits[key].timestamp > windowMs) {
    rateLimits[key] = { count: 1, timestamp: now }
    return true
  }
  
  // Increment count
  rateLimits[key].count++
  
  // Check if limit exceeded
  return rateLimits[key].count <= maxRequests
}

// Clear expired rate limit entries (call periodically)
export function clearExpiredRateLimits(windowMs: number = 60000): void {
  const now = Date.now()
  
  Object.keys(rateLimits).forEach(key => {
    if (now - rateLimits[key].timestamp > windowMs) {
      delete rateLimits[key]
    }
  })
}