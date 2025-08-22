'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  Clock,
  ArrowDownToLine,
  CreditCard,
  Building2,
  Smartphone,
  Edit3,
  Save,
  X,
  AlertCircle
} from 'lucide-react'
import { useToast } from '../ui/Toast'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase/client'
import type { Profile, Wallet as WalletType, BankDetails, Order } from '../../lib/supabase/types'
import { validateBankDetails, sanitizeInput } from '../../lib/validation'
import {
  calculateUserEarnings,
  validateWithdrawalRequest,
  processWithdrawalRequest,
  formatCurrency,
  MIN_WITHDRAWAL_AMOUNT
} from '../../lib/wallet-utils'

interface WalletTabProps {
  profile: Profile
  wallet: WalletType | null
  onWalletUpdate: (wallet: WalletType) => void
  onNavigateToWithdrawals?: () => void
}

interface EarningsData {
  totalEarnings: number
  pendingEarnings: number
  availableBalance: number
}

export default function WalletTab({ profile, wallet, onWalletUpdate, onNavigateToWithdrawals }: WalletTabProps) {
  const toast = useToast()
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [editingBankDetails, setEditingBankDetails] = useState(false)
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    account_holder: '',
    account_number: '',
    ifsc: '',
    upi_id: ''
  })
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    pendingEarnings: 0,
    availableBalance: 0
  })
  
  // Add state for withdrawals
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  
  // Function to fetch withdrawals
  const fetchWithdrawals = useCallback(async () => {
    if (!profile.id) return
    
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', profile.id)
        .order('requested_at', { ascending: false })
      
      if (error) throw error
      
      setWithdrawals(data || [])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }, [profile.id])
  const [loadingEarnings, setLoadingEarnings] = useState(true)

  // Update bank details state when wallet data changes
  useEffect(() => {
    if (wallet) {
      setBankDetails({
        account_holder: wallet.bank_account_holder || '',
        account_number: wallet.bank_account_number || '',
        ifsc: wallet.bank_ifsc || '',
        upi_id: wallet.upi_id || ''
      })
    }
  }, [wallet])

  // Debug logging to track wallet data changes
  useEffect(() => {
    console.log('WalletTab - Wallet data changed:', {
      walletId: wallet?.id,
      bankDetailsSubmitted: wallet?.bank_details_submitted,
      bankAccountHolder: wallet?.bank_account_holder,
      bankAccountNumber: wallet?.bank_account_number ? `****${wallet.bank_account_number.slice(-4)}` : null,
      bankIfsc: wallet?.bank_ifsc,
      upiId: wallet?.upi_id
    })
  }, [wallet])

  const canWithdraw = earningsData.availableBalance >= MIN_WITHDRAWAL_AMOUNT
  const hasBankDetails = wallet?.bank_details_submitted

  // Use the centralized calculation function from wallet-utils.ts
  const calculateEarnings = useCallback(async () => {
    if (!profile.id) return
    
    try {
      setLoadingEarnings(true)
      
      // Use the centralized calculation function
      const earnings = await calculateUserEarnings(profile.id)
      
      setEarningsData({
        totalEarnings: earnings.totalEarnings,
        pendingEarnings: earnings.pendingEarnings,
        availableBalance: earnings.availableBalance
      })

      // Update wallet in database with calculated values if wallet exists
      if (wallet && wallet.id) {
        const { error: updateError } = await supabase
          .from('wallets')
          .update({
            total_earnings: earnings.totalEarnings,
            pending_earnings: earnings.pendingEarnings,
            available_balance: earnings.availableBalance
          })
          .eq('user_id', profile.id)

        if (updateError) {
          console.error('Error updating wallet:', updateError)
        }
      }

    } catch (error) {
      console.error('Error calculating earnings:', error)
      // Fallback to wallet data or zeros
      if (wallet) {
        setEarningsData({
          totalEarnings: Number(wallet.total_earnings) || 0,
          pendingEarnings: Number(wallet.pending_earnings) || 0,
          availableBalance: Number(wallet.available_balance) || 0
        })
      } else {
        setEarningsData({
          totalEarnings: 0,
          pendingEarnings: 0,
          availableBalance: 0
        })
      }
    } finally {
      setLoadingEarnings(false)
    }
  }, [profile.id, wallet])

  useEffect(() => {
    if (profile.id && wallet) {
      // Fetch withdrawals first to ensure they're available for UI display
      fetchWithdrawals()
      // Then calculate earnings which will use the withdrawal data
      calculateEarnings()
    }
  }, [profile.id, wallet, calculateEarnings, fetchWithdrawals])

  const handleBankDetailsSubmit = async () => {
    if (!wallet || !profile.id) return

    // Prevent editing if bank details are already submitted
    if (wallet.bank_details_submitted && !editingBankDetails) {
      return
    }

    // Clear previous validation errors
    setValidationError('')

    // Sanitize input data
    const sanitizedDetails = {
      account_holder: sanitizeInput(bankDetails.account_holder),
      account_number: sanitizeInput(bankDetails.account_number),
      ifsc: sanitizeInput(bankDetails.ifsc).toUpperCase(),
      upi_id: bankDetails.upi_id ? sanitizeInput(bankDetails.upi_id) : ''
    }

    // Validate bank details
    const validation = validateBankDetails(sanitizedDetails)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid bank details')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('wallets')
        .update({
          bank_account_holder: sanitizedDetails.account_holder,
          bank_account_number: sanitizedDetails.account_number,
          bank_ifsc: sanitizedDetails.ifsc,
          upi_id: sanitizedDetails.upi_id || null,
          bank_details_submitted: true
        })
        .eq('user_id', profile.id)

      if (error) throw error

      // Update local wallet state
      const updatedWallet: WalletType = {
        ...wallet,
        bank_account_holder: sanitizedDetails.account_holder,
        bank_account_number: sanitizedDetails.account_number,
        bank_ifsc: sanitizedDetails.ifsc,
        upi_id: sanitizedDetails.upi_id || null,
        bank_details_submitted: true
      }
      onWalletUpdate(updatedWallet)
      setEditingBankDetails(false)
      setValidationError('')
    } catch (error) {
      console.error('Error updating bank details:', error)
      setValidationError('Failed to save bank details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawNowClick = () => {
    if (onNavigateToWithdrawals) {
      // Navigate to withdrawals tab if navigation callback is provided
      onNavigateToWithdrawals()
    } else {
      // Fallback to showing the withdraw modal
      setShowWithdrawModal(true)
    }
  }

  const handleWithdrawRequest = async () => {
    if (!wallet || !profile.id || !withdrawAmount) return

    const amount = parseFloat(withdrawAmount)

    // Enhanced validation using utility function
    const validation = validateWithdrawalRequest(
      amount,
      earningsData.availableBalance,
      wallet.bank_details_submitted
    )

    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid withdrawal request')
      return
    }

    try {
      setLoading(true)
      setValidationError('')

      const bankDetails = {
        account_holder: wallet.bank_account_holder,
        account_number: wallet.bank_account_number,
        ifsc: wallet.bank_ifsc,
        upi_id: wallet.upi_id
      }

      const result = await processWithdrawalRequest(profile.id, amount, bankDetails)

      if (!result.success) {
        setValidationError(result.error || 'Failed to process withdrawal request')
        return
      }

      // Close modal and reset form first
      setShowWithdrawModal(false)
      setWithdrawAmount('')

      // Fetch withdrawals to update the UI with the new pending withdrawal
      await fetchWithdrawals()
      
      // Recalculate earnings after withdrawal request
      // This ensures the available balance is updated to reflect the pending withdrawal
      await calculateEarnings()
      
      // Show toast notification to explain the balance change
      toast({
        title: "Balance Updated",
        description: "Your available balance has been updated to reflect the pending withdrawal.",
        status: "info",
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error requesting withdrawal:', error)
      setValidationError('Failed to process withdrawal request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const walletStats = [
    {
      title: 'Total Earnings',
      value: loadingEarnings ? '₹---.--' : `₹${earningsData.totalEarnings.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-success bg-success/10',
      description: 'All-time commission earned'
    },
    {
      title: 'Pending Earnings',
      value: loadingEarnings ? '₹---.--' : `₹${earningsData.pendingEarnings.toFixed(2)}`,
      icon: Clock,
      color: 'text-warning bg-warning/10',
      description: 'From pending/processing orders'
    },
    {
      title: 'Available Balance',
      value: loadingEarnings ? '₹---.--' : `₹${earningsData.availableBalance.toFixed(2)}`,
      icon: Wallet,
      color: 'text-primary bg-primary/10',
      description: 'Ready for withdrawal'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {walletStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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

      {/* Withdraw Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Withdraw Funds</h2>
          <Button
            onClick={handleWithdrawNowClick}
            disabled={!canWithdraw || !hasBankDetails}
            className="flex items-center space-x-2"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Withdraw Now</span>
          </Button>
        </div>

        {!canWithdraw && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-yellow-900 font-medium">Insufficient Balance</h4>
                <p className="text-yellow-800 text-sm mt-1">
                  Minimum withdrawal amount is ₹500. Current available balance: ₹{earningsData.availableBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {!hasBankDetails && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              Please add your bank details below to enable withdrawals.
            </p>
          </div>
        )}
      </motion.div>

      {/* Bank Details Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Bank Details</h2>
          {hasBankDetails && !editingBankDetails && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1">
              <span className="text-green-800 text-sm font-medium">✓ Verified</span>
            </div>
          )}
        </div>

        {hasBankDetails && !editingBankDetails && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-blue-900 font-medium">Bank Details Locked</h4>
                <p className="text-blue-800 text-sm mt-1">
                  For security reasons, bank details cannot be modified once submitted. Contact support if you need to make changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasBankDetails && !editingBankDetails ? (
          // Display saved bank details
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Account Holder</div>
                  <div className="font-medium">{wallet?.bank_account_holder}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Account Number</div>
                  <div className="font-medium">****{wallet?.bank_account_number?.slice(-4)}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">IFSC Code</div>
                  <div className="font-medium">{wallet?.bank_ifsc}</div>
                </div>
              </div>
              
              {wallet?.upi_id && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Smartphone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">UPI ID</div>
                    <div className="font-medium">{wallet.upi_id}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Bank details form
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={bankDetails.account_holder}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, account_holder: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="As per Aadhaar card"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter account number"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  value={bankDetails.ifsc}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., SBIN0001234"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  value={bankDetails.upi_id}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, upi_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="yourname@paytm"
                />
              </div>
            </div>

            {/* Validation Error Display */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-red-900 font-medium">Validation Error</h4>
                    <p className="text-red-800 text-sm mt-1">{validationError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 pt-4">
              <Button
                onClick={handleBankDetailsSubmit}
                disabled={loading || !bankDetails.account_holder || !bankDetails.account_number || !bankDetails.ifsc}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Details'}</span>
              </Button>
              
              {editingBankDetails && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingBankDetails(false)
                    setBankDetails({
                      account_holder: wallet?.bank_account_holder || '',
                      account_number: wallet?.bank_account_number || '',
                      ifsc: wallet?.bank_ifsc || '',
                      upi_id: wallet?.upi_id || ''
                    })
                  }}
                  className="flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Request Withdrawal
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter amount (min ₹500)"
                  min="500"
                  max={wallet?.available_balance || 0}
                />
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div>Available balance: ₹{earningsData.availableBalance.toFixed(2)}</div>
                
                {/* Show pending withdrawals if any */}
                {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                  <div className="text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <div className="flex items-start space-x-2">
                      <div className="text-amber-500 mt-0.5">ℹ️</div>
                      <div>
                        <div className="font-medium">Pending Withdrawals:</div>
                        <div className="text-xs">You have ₹{withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0).toFixed(2)} in pending withdrawal requests.</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>Processing time: 1-3 business days</div>
              </div>
              
              <div className="flex flex-col space-y-3 pt-4">
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleWithdrawRequest}
                    disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) < 500 || parseFloat(withdrawAmount) > earningsData.availableBalance}
                    className="flex-1"
                  >
                    {loading ? 'Processing...' : 'Request Withdrawal'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWithdrawModal(false)
                      setWithdrawAmount('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
                
                {earningsData.availableBalance > 0 && (
                  <Button
                    onClick={() => {
                      setWithdrawAmount(earningsData.availableBalance.toString())
                      // If balance is less than minimum, we'll handle it in the modified handleWithdrawRequest
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Withdraw All (₹{earningsData.availableBalance.toFixed(2)})
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}