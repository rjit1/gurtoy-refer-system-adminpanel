"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, FileText, Camera } from 'lucide-react'
import Button from '../../components/ui/Button'
import { supabase } from '../../lib/supabase/client'
import { validateFile, sanitizeInput } from '../../lib/validation'

export default function KycPage() {
  const router = useRouter()
  const [aadhaar, setAadhaar] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Ensure user is logged in
    const check = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.replace('/login')
    }
    check()
  }, [router])

  const onFileAadhaar = (file: File | null) => {
    setError(null)
    if (!file) return setAadhaar(null)

    // Enhanced validation using the validation utility
    const validation = validateFile(file, 'aadhaar')
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setAadhaar(file)
  }

  const onFileSelfie = (file: File | null) => {
    setError(null)
    if (!file) return setSelfie(null)

    // Enhanced validation using the validation utility
    const validation = validateFile(file, 'selfie')
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setSelfie(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!aadhaar || !selfie) {
      setError('Please upload both Aadhaar and Selfie.')
      return
    }

    setLoading(true)

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) {
      setError('You must be logged in to submit KYC.')
      setLoading(false)
      return
    }

    // Build file paths (relative to bucket root; do NOT prefix with bucket name)
    const aadhaarExt = aadhaar.type === 'application/pdf' ? 'pdf' : aadhaar.type === 'image/png' ? 'png' : 'jpg'
    const selfieExt = selfie.type === 'image/png' ? 'png' : 'jpg'
    const aadhaarPath = `${user.id}/aadhaar.${aadhaarExt}`
    const selfiePath = `${user.id}/selfie.${selfieExt}`

    // Upload to private bucket "aadhaar" (owner-based RLS; no metadata needed)
    const { error: up1 } = await supabase.storage
      .from('aadhaar')
      .upload(aadhaarPath, aadhaar, { upsert: true, contentType: aadhaar.type as string })

    if (up1) {
      setError(`Failed to upload Aadhaar: ${up1.message}`)
      setLoading(false)
      return
    }

    const { error: up2 } = await supabase.storage
      .from('aadhaar')
      .upload(selfiePath, selfie, { upsert: true, contentType: selfie.type as string })

    if (up2) {
      setError(`Failed to upload Selfie: ${up2.message}`)
      setLoading(false)
      return
    }

    // Update user profile row
    const { error: updErr } = await supabase
      .from('users')
      .update({
        aadhaar_url: aadhaarPath,
        selfie_url: selfiePath,
        kyc_status: 'pending',
      })
      .eq('id', user.id)

    if (updErr) {
      setError(`Failed to update KYC status: ${updErr.message}`)
      setLoading(false)
      return
    }

    // Done
    setLoading(false)
    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-white to-blue-50">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-gray-800 mb-6">
          Complete KYC
        </motion.h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow space-y-6">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Aadhaar Document (PDF/JPG/PNG, max 5MB)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Click to upload Aadhaar</p>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => onFileAadhaar(e.target.files?.[0] ?? null)}
                className="mx-auto block"
                required
              />
              {aadhaar && <div className="text-xs text-gray-500 mt-2">Selected: {aadhaar.name}</div>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Selfie Photo (JPG/PNG, max 5MB)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Click to upload selfie</p>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => onFileSelfie(e.target.files?.[0] ?? null)}
                className="mx-auto block"
                required
              />
              {selfie && <div className="text-xs text-gray-500 mt-2">Selected: {selfie.name}</div>}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit KYC'}
          </Button>
        </form>

        <div className="text-xs text-gray-500 mt-4">
          Note: KYC is manually verified by admin. You will be notified once approved.
        </div>
      </div>
    </div>
  )
}