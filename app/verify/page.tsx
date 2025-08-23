"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { supabase } from '../../lib/supabase/client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        
        if (!user) return
        setEmail(user.email || '')
        
        if (user?.email_confirmed_at) {
          // Before redirecting to dashboard, ensure user profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
            
          if (profileError) {
            console.error('Verify - Error checking profile:', profileError)
          }
          
          // If profile doesn't exist, create it before redirecting
          if (!profileData) {
            console.log('Verify - Creating profile before redirect for user:', user.id)
            const { error: createError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name ?? '',
                phone: user.user_metadata?.phone ?? '',
                kyc_status: 'pending',
              })
              
            if (createError) {
              console.error('Verify - Error creating profile:', createError)
            } else {
              console.log('Verify - Profile created successfully')
            }
          }
          
          // Add a small delay to ensure database operations complete
          setTimeout(() => {
            router.replace('/dashboard')
          }, 500)
        }
      } catch (err) {
        console.error('Verify - Unexpected error:', err)
      }
    }
    check()
  }, [router])

  const resend = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) return
    await supabase.auth.resend({ type: 'signup', email: user.email })
    setResent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <h1 className="text-3xl font-bold mb-2">Verify your email</h1>
          <p className="text-gray-600 mb-6">
            We sent a verification link to <span className="font-semibold">{email ?? 'your email'}</span>.
            Click the link in the email to continue.
          </p>
          <Button onClick={resend} className="w-full" variant="outline">
            {resent ? 'Verification email resent' : 'Resend verification email'}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}