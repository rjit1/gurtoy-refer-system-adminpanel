'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Settings, 
  LogOut, 
  Mail, 
  ChevronDown,
  UserCircle
} from 'lucide-react'
import Image from 'next/image'
import { supabase } from '../../lib/supabase/client'
import type { Profile } from '../../lib/supabase/types'

interface ProfileDropdownProps {
  profile: Profile
  onSignOut: () => void
  className?: string
}

export default function ProfileDropdown({ 
  profile, 
  onSignOut, 
  className = '' 
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      onSignOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const menuItems = [
    {
      icon: User,
      label: 'View Profile',
      action: () => {
        window.location.href = '/profile'
        setIsOpen(false)
      }
    },
    {
      icon: Settings,
      label: 'Edit Profile',
      action: () => {
        window.location.href = '/profile'
        setIsOpen(false)
      }
    },
    {
      icon: Mail,
      label: 'Contact Support',
      action: () => {
        window.location.href = 'mailto:thegurtoy@gmail.com'
        setIsOpen(false)
      }
    },
    {
      icon: LogOut,
      label: 'Logout',
      action: handleSignOut,
      danger: true
    }
  ]

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Profile Image or Initials */}
        <div className="relative">
          {profile.profile_image ? (
            <Image
              src={profile.profile_image}
              alt={profile.full_name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
              {getInitials(profile.full_name)}
            </div>
          )}
          
          {/* Online Status Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-white rounded-full"></div>
        </div>

        {/* Profile Info - Hidden on mobile */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 truncate max-w-32">
            {profile.full_name}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {profile.kyc_status}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
          >
            {/* Profile Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                {profile.profile_image ? (
                  <Image
                    src={profile.profile_image}
                    alt={profile.full_name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {getInitials(profile.full_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {profile.full_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {profile.phone}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                    profile.kyc_status === 'approved' 
                      ? 'bg-success/10 text-success' 
                      : profile.kyc_status === 'rejected'
                      ? 'bg-error/10 text-error'
                      : 'bg-warning/10 text-warning'
                  }`}>
                    KYC {profile.kyc_status}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.button
                    key={index}
                    onClick={item.action}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                      item.danger 
                        ? 'text-error hover:bg-error/5' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}