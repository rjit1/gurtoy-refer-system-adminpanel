"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { supabase } from '../../lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return setError(error.message)
    setDone(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow">
          <h1 className="text-2xl font-bold mb-2">Reset password</h1>
          <p className="text-gray-600 mb-6">Enter your new password below.</p>
          <form className="space-y-4" onSubmit={onSubmit}>
            {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>}
            {done && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200 text-sm">Password updated. You can close this tab and login again.</div>}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <Button type="submit" className="w-full">Update password</Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}