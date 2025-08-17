'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestDBPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      // Test basic connection
      const { data, error } = await supabase.from('users').select('count').limit(1)
      if (error) {
        setResult(`Connection Error: ${error.message}`)
        return
      }
      
      setResult(`✅ Database connected successfully`)
    } catch (err: any) {
      setResult(`❌ Connection failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testIsAdminFunction = async () => {
    setLoading(true)
    try {
      // Test if is_admin function exists
      const { data, error } = await supabase.rpc('is_admin')
      if (error) {
        setResult(`❌ is_admin() function error: ${error.message}`)
        return
      }
      
      setResult(`✅ is_admin() function works. Result: ${data}`)
    } catch (err: any) {
      setResult(`❌ is_admin() function failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    setLoading(true)
    try {
      // Test authentication with admin credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'thegurtoy@gmail.com',
        password: 'Toys123@'
      })

      if (error) {
        setResult(`❌ Auth failed: ${error.message}`)
        return
      }

      setResult(`✅ Auth successful. User: ${data.user?.email}`)
    } catch (err: any) {
      setResult(`❌ Auth error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testFullAuthFlow = async () => {
    setLoading(true)
    try {
      // Test the complete auth flow like the login page does
      const { signInAdmin } = await import('@/lib/auth')
      const result = await signInAdmin('thegurtoy@gmail.com', 'Toys123@')

      if (result.success) {
        setResult(`✅ Full auth flow successful!`)
      } else {
        setResult(`❌ Full auth flow failed: ${result.error}`)
      }
    } catch (err: any) {
      setResult(`❌ Full auth flow error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testCurrentAdmin = async () => {
    setLoading(true)
    try {
      // Test getCurrentAdmin function
      const { getCurrentAdmin } = await import('@/lib/auth')
      const admin = await getCurrentAdmin()

      if (admin) {
        setResult(`✅ getCurrentAdmin successful: ${admin.email}`)
      } else {
        setResult(`❌ getCurrentAdmin failed: No admin found`)
      }
    } catch (err: any) {
      setResult(`❌ getCurrentAdmin error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Database & Auth Test</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Test DB Connection
        </button>
        
        <button 
          onClick={testIsAdminFunction}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded mr-4"
        >
          Test is_admin() Function
        </button>
        
        <button
          onClick={testAuth}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Authentication
        </button>

        <button
          onClick={testFullAuthFlow}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Full Auth Flow
        </button>

        <button
          onClick={testCurrentAdmin}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded mr-4"
        >
          Test getCurrentAdmin
        </button>
      </div>
      
      {loading && <p className="mt-4">Testing...</p>}
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  )
}
