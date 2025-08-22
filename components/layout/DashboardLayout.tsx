'use client'

import { useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Wallet,
  Users,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '../ui/Toast'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const toast = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('')

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single()
          
        if (profile) {
          setUserName(profile.full_name)
          setUserInitial(profile.full_name.charAt(0).toUpperCase())
        }
      }
    }
    
    getUserProfile()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: 'Signed out successfully',
        status: 'success',
        duration: 3000
      })
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: 'Failed to sign out',
        status: 'error',
        duration: 3000
      })
    }
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Wallet',
      href: '/dashboard/wallet',
      icon: Wallet
    },
    {
      name: 'Referrals',
      href: '/dashboard/referrals',
      icon: Users
    },
    {
      name: 'Notices',
      href: '/dashboard/notices',
      icon: FileText
    },
    {
      name: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            Gurtoy Referral
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-20 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                    {userInitial}
                  </div>
                  <div>
                    <p className="font-medium">{userName}</p>
                    <p className="text-xs text-gray-500">Referral Partner</p>
                  </div>
                </div>
              </div>
              
              <nav className="p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center space-x-3 p-2 rounded-md ${
                          pathname === item.href
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </div>
      
      {/* Desktop layout */}
      <div className="hidden lg:flex">
        <div className="fixed inset-y-0 left-0 w-64 bg-white border-r">
          <div className="p-6 border-b">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Gurtoy Referral
            </Link>
          </div>
          
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {userInitial}
              </div>
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-gray-500">Referral Partner</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 p-2 rounded-md ${
                      pathname === item.href
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
              <li className="pt-4 mt-4 border-t">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="ml-64 flex-1">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
      
      {/* Mobile content */}
      <div className="lg:hidden pt-16 p-4">
        {children}
      </div>
    </div>
  )
}