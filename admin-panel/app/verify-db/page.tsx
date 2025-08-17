'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function VerifyDBPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const verifyTables = async () => {
    setLoading(true)
    try {
      const tables = ['users', 'wallets', 'orders', 'withdrawals', 'notices', 'referral_code_requests']
      const results = []
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1)
          if (error) {
            results.push(`❌ ${table}: ${error.message}`)
          } else {
            results.push(`✅ ${table}: OK`)
          }
        } catch (err: any) {
          results.push(`❌ ${table}: ${err.message}`)
        }
      }
      
      setResult(results.join('\n'))
    } catch (err: any) {
      setResult(`❌ Table verification error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const verifyViews = async () => {
    setLoading(true)
    try {
      const views = ['withdrawal_requests_detailed', 'referral_requests_detailed', 'admin_dashboard_stats']
      const results = []
      
      for (const view of views) {
        try {
          const { data, error } = await supabase.from(view).select('*').limit(1)
          if (error) {
            results.push(`❌ ${view}: ${error.message}`)
          } else {
            results.push(`✅ ${view}: OK`)
          }
        } catch (err: any) {
          results.push(`❌ ${view}: ${err.message}`)
        }
      }
      
      setResult(results.join('\n'))
    } catch (err: any) {
      setResult(`❌ View verification error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const verifyRPCFunctions = async () => {
    setLoading(true)
    try {
      const results = []
      
      // Test is_admin function
      try {
        const { data, error } = await supabase.rpc('is_admin')
        if (error) {
          results.push(`❌ is_admin(): ${error.message}`)
        } else {
          results.push(`✅ is_admin(): Returns ${data}`)
        }
      } catch (err: any) {
        results.push(`❌ is_admin(): ${err.message}`)
      }
      
      setResult(results.join('\n'))
    } catch (err: any) {
      setResult(`❌ RPC verification error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const verifyAdminUser = async () => {
    setLoading(true)
    try {
      // Check if admin user exists in auth.users
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setResult(`❌ Auth check failed: ${error.message}`)
        return
      }
      
      if (!user) {
        setResult(`❌ No authenticated user found`)
        return
      }
      
      setResult(`✅ Current user: ${user.email}
      ✅ User ID: ${user.id}
      ✅ Created: ${user.created_at}
      ✅ Is Admin: ${user.email === 'thegurtoy@gmail.com' ? 'Yes' : 'No'}`)
      
    } catch (err: any) {
      setResult(`❌ Admin user verification error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Database Schema Verification</h1>
      
      <div className="space-y-4">
        <button 
          onClick={verifyTables}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Verify Tables
        </button>
        
        <button 
          onClick={verifyViews}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded mr-4"
        >
          Verify Views
        </button>
        
        <button 
          onClick={verifyRPCFunctions}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded mr-4"
        >
          Verify RPC Functions
        </button>
        
        <button 
          onClick={verifyAdminUser}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded mr-4"
        >
          Verify Admin User
        </button>
      </div>
      
      {loading && <p className="mt-4">Verifying...</p>}
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  )
}
