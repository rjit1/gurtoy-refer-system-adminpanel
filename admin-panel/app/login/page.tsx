'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signInAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('thegurtoy@gmail.com')
  const [password, setPassword] = useState('Toys123@')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Login: Attempting login with:', { email, password: '***' })
      const result = await signInAdmin(email, password)
      console.log('Login: Authentication successful:', !!result.session)

      if (!result.session) {
        throw new Error('No session created during login')
      }

      // Store session info for middleware
      if (typeof window !== 'undefined') {
        localStorage.setItem('gurtoy-admin-session', 'true')
        localStorage.setItem('gurtoy-admin-email', result.user.email!)
      }

      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Verify session one more time before redirect
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Login: Final session check:', !!session, 'User:', session?.user?.email)

      if (session && session.user.email === 'thegurtoy@gmail.com') {
        console.log('Login: Admin session confirmed, redirecting to dashboard')
        // Use window.location for a hard redirect to ensure middleware picks up the session
        window.location.href = '/dashboard'
      } else {
        console.error('Login: Session verification failed')
        setError('Session verification failed. Please try again.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Login: Authentication failed:', err)
      setError(err.message || 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative w-32 h-9">
            <Image
              src="/gurtoy-logo.png"
              alt="Gurtoy Admin Panel"
              fill
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@gurtoy.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}