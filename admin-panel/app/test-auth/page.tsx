'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const [email, setEmail] = useState('thegurtoy@gmail.com')
  const [password, setPassword] = useState('Toys123@')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testDirectAuth = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Testing direct authentication...')
      
      // Clear any existing session
      await supabase.auth.signOut()
      
      // Test login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) {
        setResult({ error: authError.message })
        return
      }
      
      console.log('Login successful')
      
      // Test is_admin function
      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin')
      
      // Test session persistence
      const { data: sessionData } = await supabase.auth.getSession()
      
      setResult({
        success: true,
        user: authData.user?.email,
        session: !!authData.session,
        isAdmin: isAdminData,
        sessionPersisted: !!sessionData.session,
        adminError: isAdminError?.message
      })
      
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentSession = async () => {
    setLoading(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin')
      
      setResult({
        currentSession: !!session,
        currentUser: session?.user?.email,
        isAdmin: isAdminData,
        adminError: isAdminError?.message,
        sessionError: error?.message
      })
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button onClick={testDirectAuth} disabled={loading}>
                {loading ? 'Testing...' : 'Test Login'}
              </Button>
              <Button onClick={checkCurrentSession} disabled={loading} variant="outline">
                Check Current Session
              </Button>
            </div>
            
            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
