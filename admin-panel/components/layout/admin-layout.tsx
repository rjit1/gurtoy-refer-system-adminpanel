'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCurrentAdmin, signOutAdmin } from '@/lib/auth'
import { AdminUser } from '@/lib/supabase/types'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Wallet,
  Bell,
  Hash,
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users & KYC', href: '/users', icon: Users },
  { name: 'Referral Requests', href: '/referral-requests', icon: Hash },
  { name: 'Add Sale', href: '/sales', icon: ShoppingCart },
  { name: 'Manage Sales', href: '/sales/manage', icon: ShoppingCart },
  { name: 'Withdrawals', href: '/withdrawals', icon: Wallet },
  { name: 'Notices', href: '/notices', icon: Bell },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = useCallback(async () => {
    try {
      console.log('AdminLayout: Checking authentication...')

      // Check if we have a valid admin session
      const currentAdmin = await getCurrentAdmin()
      if (!currentAdmin) {
        console.log('AdminLayout: No admin found')

        // Check if we have localStorage verification (recent login)
        if (typeof window !== 'undefined') {
          const isAdminVerified = localStorage.getItem('gurtoy-admin-verified')
          const adminEmail = localStorage.getItem('gurtoy-admin-email')

          if (isAdminVerified && adminEmail === 'thegurtoy@gmail.com') {
            console.log('AdminLayout: Found recent admin verification, attempting session refresh...')

            // Try to refresh the session
            const { data: { session }, error } = await supabase.auth.getSession()
            if (session && session.user.email === adminEmail) {
              console.log('AdminLayout: Session refreshed successfully')
              setAdmin({
                id: session.user.id,
                email: session.user.email,
                role: 'admin'
              })
              return
            }
          }
        }

        console.log('AdminLayout: Redirecting to login')
        router.push('/login')
        return
      }

      console.log('AdminLayout: Admin authenticated:', currentAdmin.email)
      setAdmin(currentAdmin)
    } catch (error) {
      console.error('AdminLayout: Auth check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleSignOut = async () => {
    try {
      await signOutAdmin()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="relative w-24 h-7">
                <Image
                  src="/gurtoy-logo.png"
                  alt="Gurtoy Admin"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-sm font-medium text-gray-600">Admin</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-2">
              <div className="relative w-24 h-7">
                <Image
                  src="/gurtoy-logo.png"
                  alt="Gurtoy Admin"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-sm font-medium text-gray-600">Admin</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="flex-shrink-0 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {admin?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Admin</p>
                <p className="text-xs text-gray-500">{admin?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="ml-auto"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <span className="text-sm text-gray-500">Welcome back, Admin!</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}