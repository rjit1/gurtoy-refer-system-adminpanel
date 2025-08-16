"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { supabase } from '../../lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return setError(error.message)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow">
          <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
          <p className="text-gray-600 mb-6">Enter your email to receive a reset link.</p>
          <form className="space-y-4" onSubmit={onSubmit}>
            {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>}
            {sent && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200 text-sm">Check your inbox for a reset link.</div>}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <Button type="submit" className="w-full">Send reset link</Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}