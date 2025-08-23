"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import Lottie from 'lottie-react'
import Image from 'next/image'

// Components
import TabNavigation from '../../components/ui/TabNavigation'
import NotificationDrawer from '../../components/ui/NotificationDrawer'
import ProfileDropdown from '../../components/ui/ProfileDropdown'
import KYCBanner from '../../components/ui/KYCBanner'

// Tab Components
import DashboardTab from '../../components/dashboard/DashboardTab'
import WalletTab from '../../components/dashboard/WalletTab'
import ReferralActivityTab from '../../components/dashboard/ReferralActivityTab'
import WithdrawalsTab from '../../components/dashboard/WithdrawalsTab'
import NoticesTab from '../../components/dashboard/NoticesTab'

// Utils
import { supabase } from '../../lib/supabase/client'
import type { Profile, Wallet, DashboardTab as TabType, Notification } from '../../lib/supabase/types'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingAnim, setLoadingAnim] = useState<any | null>(null)

  const hasKycFiles = useMemo(() => {
    if (!profile) return false
    return Boolean(profile.aadhaar_url && profile.selfie_url)
  }, [profile])

  useEffect(() => {
    let isMounted = true
    let channel: ReturnType<typeof supabase.channel> | null = null

    const load = async () => {
      // Lazy load Lottie JSON once on client
      if (!loadingAnim) {
        try {
          const res = await fetch('/animations/Loading%20Files.json')
          if (res.ok) {
            const json = await res.json()
            if (isMounted) setLoadingAnim(json)
          }
        } catch (e) {
          console.warn('Failed to load Lottie JSON', e)
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      // If email not verified, send to verify page
      if (!user.email_confirmed_at) {
        router.replace('/verify')
        return
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) console.error(profileError)

      let currentProfile = profileData as Profile | null
      // Create minimal profile if missing
      if (!currentProfile) {
        try {
          console.log('Dashboard - Creating profile for user:', user.id)
          const { error: insErr, data: created } = await supabase
            .from('users')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name ?? '',
              phone: user.user_metadata?.phone ?? '',
              kyc_status: 'pending',
            })
            .select('*')
            .single()
          
          if (insErr) {
            console.error('Dashboard - Error creating profile:', insErr)
            // Try to fetch again in case of race condition (profile might have been created by another process)
            const { data: retryProfile, error: retryError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .maybeSingle()
              
            if (retryError) {
              console.error('Dashboard - Error fetching profile after creation attempt:', retryError)
            } else if (retryProfile) {
              console.log('Dashboard - Profile found on retry:', retryProfile)
              currentProfile = retryProfile as Profile
            }
          } else {
            console.log('Dashboard - Profile created successfully:', created)
            currentProfile = (created as any) ?? null
          }
        } catch (err) {
          console.error('Dashboard - Unexpected error creating profile:', err)
        }
        
        // If profile creation failed, set a temporary profile to prevent "Profile Not Found" error
        // This will allow the page to load, and the user can refresh to try again
        if (!currentProfile) {
          console.log('Dashboard - Using temporary profile for rendering')
          currentProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name ?? 'User',
            phone: user.user_metadata?.phone ?? '',
            kyc_status: 'pending',
            referral_code: null,
            aadhaar_url: null,
            selfie_url: null,
            profile_image: null,
            created_at: new Date().toISOString()
          } as Profile
        }
      }

      // Load or create wallet with detailed logging
      console.log('Dashboard - Loading wallet for user:', user.id)
      let { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (walletError) {
        console.error('Dashboard - Error loading wallet:', walletError)
      } else {
        console.log('Dashboard - Wallet loaded:', walletData)
      }

      // Create wallet if it doesn't exist or update existing one
      if (!walletData && currentProfile) {
        console.log('Dashboard - Creating/updating wallet for user:', user.id)
        const { data: newWallet, error: createWalletError } = await supabase
          .from('wallets')
          .upsert({
            user_id: user.id,
            total_earnings: 0,
            pending_earnings: 0,
            available_balance: 0,
            bank_details_submitted: false,
            bank_account_holder: null,
            bank_account_number: null,
            bank_ifsc: null,
            upi_id: null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id' // Handle conflict on user_id
          })
          .select('*')
          .single()

        if (createWalletError) {
          console.error('Dashboard - Error creating/updating wallet:', createWalletError)
        } else {
          walletData = newWallet
          console.log('Dashboard - Wallet created/updated successfully:', newWallet)
        }
      }

      // Ensure wallet data is properly structured
      if (walletData) {
        // Ensure all numeric fields are properly typed
        const structuredWallet = {
          ...walletData,
          total_earnings: Number(walletData.total_earnings) || 0,
          pending_earnings: Number(walletData.pending_earnings) || 0,
          available_balance: Number(walletData.available_balance) || 0
        }
        console.log('Dashboard - Structured wallet data:', structuredWallet)
        walletData = structuredWallet
      }

      // Load unread notifications count
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false)

      if (!isMounted) return
      setProfile(currentProfile)
      setWallet(walletData)
      setUnreadCount(notificationsData?.length || 0)
      setLoading(false)

      // Subscribe to realtime changes
      channel = supabase
        .channel('dashboard-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
          (payload) => {
            if (!isMounted) return
            setProfile(payload.new as Profile)
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (!isMounted) return
            console.log('Dashboard - Wallet realtime update:', payload)
            const updatedWallet = payload.new as Wallet
            if (updatedWallet) {
              // Ensure numeric fields are properly typed
              const structuredWallet = {
                ...updatedWallet,
                total_earnings: Number(updatedWallet.total_earnings) || 0,
                pending_earnings: Number(updatedWallet.pending_earnings) || 0,
                available_balance: Number(updatedWallet.available_balance) || 0
              }
              console.log('Dashboard - Setting updated wallet:', structuredWallet)
              setWallet(structuredWallet)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (!isMounted) return
            const notification = payload.new as Notification
            if (!notification.read) {
              setUnreadCount(prev => prev + 1)
            }
          }
        )
        .subscribe()
    }

    load()

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [router, loadingAnim])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const handleWalletUpdate = (updatedWallet: Wallet) => {
    setWallet(updatedWallet)
  }

  const handleNavigateToWithdrawals = () => {
    setActiveTab('withdrawals')
  }

  const renderActiveTab = () => {
    if (!profile) return null

    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab profile={profile} wallet={wallet} />
      case 'wallet':
        return <WalletTab profile={profile} wallet={wallet} onWalletUpdate={handleWalletUpdate} onNavigateToWithdrawals={handleNavigateToWithdrawals} />
      case 'referral-activity':
        return <ReferralActivityTab userId={profile.id} />
      case 'withdrawals':
        return <WithdrawalsTab userId={profile.id} wallet={wallet} />
      case 'notices':
        return <NoticesTab kycStatus={profile.kyc_status} />
      default:
        return <DashboardTab profile={profile} wallet={wallet} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-light via-white to-blue-50">
        <div className="w-[320px] h-[160px]">
          {loadingAnim ? (
            <Lottie animationData={loadingAnim} loop autoplay style={{ width: '100%', height: '100%' }} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-light via-white to-blue-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">Unable to load your profile. This can happen after email verification.</p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
            <p className="text-sm text-gray-500">
              If the problem persists, try signing out and signing back in.
            </p>
            <button
              onClick={handleSignOut}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Image
                  src="/gurtoy-trademark-logo.png"
                  alt="Gurtoy"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(true)}
                  className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile Dropdown */}
              <ProfileDropdown profile={profile} onSignOut={handleSignOut} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KYC Banner - Show on all tabs except Notices */}
        {activeTab !== 'notices' && (
          <KYCBanner
            kycStatus={profile.kyc_status}
            hasKycFiles={hasKycFiles}
            className="mb-6"
          />
        )}

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-8"
        />

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        userId={profile.id}
      />
    </div>
  )
}