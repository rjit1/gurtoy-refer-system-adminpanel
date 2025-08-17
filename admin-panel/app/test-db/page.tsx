'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestDBPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [authResult, setAuthResult] = useState<any>(null)

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

      setAuthResult(result)

      if (result && result.session) {
        setResult(`✅ Full auth flow successful! User: ${result.user.email}, Session: ${!!result.session}`)
      } else {
        setResult(`❌ Full auth flow failed: No session returned`)
      }
    } catch (err: any) {
      setResult(`❌ Full auth flow error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testEnvironmentVars = async () => {
    setLoading(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      setResult(`Environment Check:
      ✅ Supabase URL: ${supabaseUrl ? 'Set' : 'Missing'}
      ✅ Supabase Key: ${supabaseKey ? 'Set (length: ' + supabaseKey.length + ')' : 'Missing'}
      ✅ URL: ${supabaseUrl}`)
    } catch (err: any) {
      setResult(`❌ Environment error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testDirectLogin = async () => {
    setLoading(true)
    try {
      // Test direct Supabase auth without our wrapper
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'thegurtoy@gmail.com',
        password: 'Toys123@'
      })

      if (error) {
        setResult(`❌ Direct login failed: ${error.message}`)
        return
      }

      // Test the RPC function
      try {
        const { data: isAdminData, error: rpcError } = await supabase.rpc('is_admin')

        if (rpcError) {
          setResult(`✅ Login successful, ❌ RPC failed: ${rpcError.message}
          User: ${data.user?.email}
          Fallback: ${data.user?.email === 'thegurtoy@gmail.com' ? 'Admin' : 'Not Admin'}`)
        } else {
          setResult(`✅ Complete success!
          User: ${data.user?.email}
          RPC Result: ${isAdminData}
          Session: ${!!data.session}`)
        }
      } catch (rpcErr: any) {
        setResult(`✅ Login successful, ❌ RPC function not available: ${rpcErr.message}
        User: ${data.user?.email}
        Fallback: ${data.user?.email === 'thegurtoy@gmail.com' ? 'Admin' : 'Not Admin'}`)
      }
    } catch (err: any) {
      setResult(`❌ Direct login error: ${err.message}`)
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

        <button
          onClick={testEnvironmentVars}
          disabled={loading}
          className="bg-indigo-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Environment
        </button>

        <button
          onClick={testDirectLogin}
          disabled={loading}
          className="bg-pink-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Direct Login + RPC
        </button>
      </div>
      
      {loading && <p className="mt-4">Testing...</p>}
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      {authResult && (
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <h3 className="font-bold mb-2">Auth Result Details:</h3>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(authResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
