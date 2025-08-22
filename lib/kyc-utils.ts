// KYC document utilities
import { supabase } from './supabase/client'

// Standard KYC document URL patterns
export const KYC_DOCUMENT_PATHS = {
  aadhaar: (userId: string) => `kyc-documents/aadhaar-${userId}.jpg`,
  selfie: (userId: string) => `kyc-documents/selfie-${userId}.jpg`,
  profile: (userId: string) => `profile-images/${userId}.jpg`
}

// Validate KYC document URLs
export async function validateKycDocuments(userId: string): Promise<{
  isValid: boolean
  missingDocuments: string[]
}> {
  try {
    // Get user's KYC document URLs
    const { data: user, error } = await supabase
      .from('users')
      .select('aadhaar_url, selfie_url')
      .eq('id', userId)
      .single()

    if (error) throw error

    const missingDocuments = []

    // Check if Aadhaar document exists
    if (!user.aadhaar_url) {
      missingDocuments.push('Aadhaar card')
    } else {
      // Verify the file exists in storage
      const { data: aadhaarExists } = await supabase
        .storage
        .from('public')
        .getPublicUrl(user.aadhaar_url)

      if (!aadhaarExists) {
        missingDocuments.push('Aadhaar card (file not found)')
      }
    }

    // Check if selfie document exists
    if (!user.selfie_url) {
      missingDocuments.push('Selfie')
    } else {
      // Verify the file exists in storage
      const { data: selfieExists } = await supabase
        .storage
        .from('public')
        .getPublicUrl(user.selfie_url)

      if (!selfieExists) {
        missingDocuments.push('Selfie (file not found)')
      }
    }

    return {
      isValid: missingDocuments.length === 0,
      missingDocuments
    }
  } catch (error) {
    console.error('Error validating KYC documents:', error)
    return {
      isValid: false,
      missingDocuments: ['Error validating documents']
    }
  }
}

// Standardize KYC document URLs
export async function standardizeKycDocumentUrls(userId: string): Promise<boolean> {
  try {
    // Get current user data
    const { data: user, error } = await supabase
      .from('users')
      .select('aadhaar_url, selfie_url')
      .eq('id', userId)
      .single()

    if (error) throw error

    // Generate standard URLs
    const standardAadhaarUrl = KYC_DOCUMENT_PATHS.aadhaar(userId)
    const standardSelfieUrl = KYC_DOCUMENT_PATHS.selfie(userId)

    // Only update if URLs don't match the standard pattern
    if (
      (user.aadhaar_url && !user.aadhaar_url.includes(`aadhaar-${userId}`)) ||
      (user.selfie_url && !user.selfie_url.includes(`selfie-${userId}`))
    ) {
      // Update user with standardized URLs
      const { error: updateError } = await supabase
        .from('users')
        .update({
          aadhaar_url: standardAadhaarUrl,
          selfie_url: standardSelfieUrl
        })
        .eq('id', userId)

      if (updateError) throw updateError
    }

    return true
  } catch (error) {
    console.error('Error standardizing KYC document URLs:', error)
    return false
  }
}

// Fix KYC document URLs for all users
export async function fixAllKycDocumentUrls(): Promise<{
  success: number
  failed: number
}> {
  let success = 0
  let failed = 0

  try {
    // Get all users with KYC documents
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .not('aadhaar_url', 'is', null)

    if (error) throw error

    // Update each user's document URLs
    for (const user of users) {
      const result = await standardizeKycDocumentUrls(user.id)
      if (result) {
        success++
      } else {
        failed++
      }
    }

    return { success, failed }
  } catch (error) {
    console.error('Error fixing KYC document URLs:', error)
    return { success, failed }
  }
}