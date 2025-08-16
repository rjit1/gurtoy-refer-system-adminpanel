'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, RefreshCw, TrendingUp, Wallet, Users } from 'lucide-react'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase/client'
import type { Profile, Wallet as WalletType, ReferralCodeRequest } from '../../lib/supabase/types'

interface DashboardTabProps {
  profile: Profile
  wallet: WalletType | null
}

export default function DashboardTab({ profile, wallet }: DashboardTabProps) {
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [referralRequest, setReferralRequest] = useState<ReferralCodeRequest | null>(null)
  const [loadingRequest, setLoadingRequest] = useState(true)

  const loadReferralRequest = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      setLoadingRequest(true)
      const { data, error } = await supabase
        .from('referral_code_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setReferralRequest(data)
    } catch (error) {
      console.error('Error loading referral request:', error)
    } finally {
      setLoadingRequest(false)
    }
  }, [profile?.id])

  useEffect(() => {
    if (profile?.id) {
      loadReferralRequest()
    }
  }, [profile?.id, loadReferralRequest])

  const copyReferralCode = async () => {
    if (!profile.referral_code) return
    
    try {
      await navigator.clipboard.writeText(profile.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy referral code:', error)
    }
  }

  const generateReferralCode = async () => {
    if (!profile?.id) return
    
    try {
      setIsGenerating(true)
      
      // Create referral code request
      const { error: requestError } = await supabase
        .from('referral_code_requests')
        .insert({
          user_id: profile.id
        })

      if (requestError) throw requestError

      // Create notification for user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: profile.id,
          type: 'referral_code_requested',
          title: 'Referral Code Request Submitted',
          message: 'Your referral code request has been submitted to admin for approval. You will be notified once processed.'
        })

      if (notificationError) console.error('Error creating notification:', notificationError)

      // Reload the request status
      await loadReferralRequest()
      
    } catch (error) {
      console.error('Error requesting referral code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    availableBalance: 0
  })
  const [loadingEarnings, setLoadingEarnings] = useState(true)

  // Calculate earnings based on order status - same logic as WalletTab
  const calculateEarnings = useCallback(async () => {
    if (!profile.id) return
    
    try {
      setLoadingEarnings(true)
      
      // Fetch all orders for the user
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', profile.id)

      if (error) {
        console.error('Error fetching orders:', error)
        // If there's an error, use wallet data as fallback
        if (wallet) {
          setEarningsData({
            totalEarnings: Number(wallet.total_earnings) || 0,
            pendingEarnings: Number(wallet.pending_earnings) || 0,
            availableBalance: Number(wallet.available_balance) || 0
          })
        }
        return
      }

      // Calculate earnings based on order status
      let totalEarnings = 0
      let pendingEarnings = 0
      let availableBalance = 0

      if (orders && orders.length > 0) {
        orders.forEach((order) => {
          const commission = order.price * 0.05 // 5% commission

          if (order.status === 'delivered') {
            // Delivered orders contribute to both total and available balance
            totalEarnings += commission
            availableBalance += commission
          } else if (order.status === 'pending' || order.status === 'processing') {
            // Pending/processing orders contribute to total and pending earnings
            totalEarnings += commission
            pendingEarnings += commission
          }
        })

        // Subtract any withdrawn amounts (both processed and pending) from available balance
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('amount, status')
          .eq('user_id', profile.id)
          .in('status', ['processed', 'pending'])

        if (withdrawals && withdrawals.length > 0) {
          const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0)
          availableBalance = Math.max(0, availableBalance - totalWithdrawn)
        }
      }

      setEarningsData({
        totalEarnings,
        pendingEarnings,
        availableBalance
      })

    } catch (error) {
      console.error('Error calculating earnings:', error)
      // Fallback to wallet data or zeros
      if (wallet) {
        setEarningsData({
          totalEarnings: Number(wallet.total_earnings) || 0,
          pendingEarnings: Number(wallet.pending_earnings) || 0,
          availableBalance: Number(wallet.available_balance) || 0
        })
      }
    } finally {
      setLoadingEarnings(false)
    }
  }, [profile.id, wallet])

  useEffect(() => {
    if (profile.id && wallet) {
      calculateEarnings()
    }
  }, [profile.id, wallet, calculateEarnings])

  const stats = [
    {
      title: 'Total Earnings',
      value: loadingEarnings ? '₹---.--' : `₹${earningsData.totalEarnings.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-success bg-success/10',
      description: 'All-time commission earned'
    },
    {
      title: 'Available Balance',
      value: loadingEarnings ? '₹---.--' : `₹${earningsData.availableBalance.toFixed(2)}`,
      icon: Wallet,
      color: 'text-primary bg-primary/10',
      description: 'Ready for withdrawal'
    },
    {
      title: 'Pending Earnings',
      value: loadingEarnings ? '₹---.--' : `₹${earningsData.pendingEarnings.toFixed(2)}`,
      icon: RefreshCw,
      color: 'text-warning bg-warning/10',
      description: 'Orders not yet delivered'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {profile.full_name.split(' ')[0]}! 👋
            </h1>
            <p className="text-primary-100 opacity-90">
              Track your referral performance and manage your earnings
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Referral Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h2>
        
        {profile.referral_code ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl font-bold text-primary tracking-wider">
                  {profile.referral_code}
                </div>
              </div>
              <Button
                onClick={copyReferralCode}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Share this code with friends to earn 5% commission on their purchases!
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className={`w-8 h-8 text-gray-400 ${isGenerating || loadingRequest ? 'animate-spin' : ''}`} />
            </div>
            
            {profile.kyc_status !== 'approved' ? (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Referral Code Pending
                </h3>
                <p className="text-gray-600 mb-4">
                  Complete your KYC verification to request your referral code from admin.
                </p>
              </div>
            ) : loadingRequest ? (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Loading...
                </h3>
                <p className="text-gray-600 mb-4">
                  Checking referral code request status...
                </p>
              </div>
            ) : referralRequest ? (
              <div>
                {referralRequest.status === 'pending' ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Referral Code Generation in Process
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Your referral code request is being processed by admin. You will be notified once your code is ready.
                    </p>
                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing Request
                    </div>
                  </>
                ) : referralRequest.status === 'rejected' ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Request Rejected
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {referralRequest.admin_notes || 'Your referral code request was rejected. Please contact support for more information.'}
                    </p>
                    <Button
                      onClick={generateReferralCode}
                      disabled={isGenerating}
                      className="flex items-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Requesting...</span>
                        </>
                      ) : (
                        <span>Request Again</span>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Code Approved - Updating Profile
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Your referral code has been approved and will appear shortly.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Request Referral Code
                </h3>
                <p className="text-gray-600 mb-4">
                  Request your referral code from admin. Once approved, you can start earning commissions!
                </p>
                <Button
                  onClick={generateReferralCode}
                  disabled={isGenerating}
                  className="flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <span>Request Referral Code</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">
                  {stat.title}
                </h3>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            disabled={!wallet || (Number(wallet.available_balance) || 0) < 500}
          >
            <div className="text-left">
              <div className="font-medium">Request Withdrawal</div>
              <div className="text-sm text-gray-500">
                {wallet && (Number(wallet.available_balance) || 0) >= 500
                  ? 'Minimum ₹500 available'
                  : 'Minimum ₹500 required'
                }
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            href="/kyc"
            disabled={profile.kyc_status === 'approved'}
          >
            <div className="text-left">
              <div className="font-medium">
                {profile.kyc_status === 'approved' ? 'KYC Verified' : 'Complete KYC'}
              </div>
              <div className="text-sm text-gray-500">
                {profile.kyc_status === 'approved' 
                  ? 'Your account is verified' 
                  : 'Verify your identity'
                }
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => window.location.href = 'mailto:thegurtoy@gmail.com'}
          >
            <div className="text-left">
              <div className="font-medium">Contact Support</div>
              <div className="text-sm text-gray-500">Get help & assistance</div>
            </div>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}