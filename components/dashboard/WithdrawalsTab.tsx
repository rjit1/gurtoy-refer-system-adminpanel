'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowDownToLine, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Calendar,
  DollarSign,
  AlertCircle,
  Plus,
  CreditCard
} from 'lucide-react'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase/client'
import type { Withdrawal, WithdrawalStatus, Wallet } from '../../lib/supabase/types'

interface WithdrawalsTabProps {
  userId: string
  wallet: Wallet | null
}

export default function WithdrawalsTab({ userId, wallet }: WithdrawalsTabProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    availableBalance: 0
  })
  const [loadingEarnings, setLoadingEarnings] = useState(true)

  const fetchWithdrawals = useCallback(async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false })

      if (error) throw error
      setWithdrawals(data || [])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Calculate earnings based on order status - same logic as WalletTab
  const calculateEarnings = useCallback(async () => {
    if (!userId) return
    
    try {
      setLoadingEarnings(true)
      
      // Fetch all orders for the user
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)

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
          .eq('user_id', userId)
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
  }, [userId, wallet])

  useEffect(() => {
    fetchWithdrawals()
    if (userId && wallet) {
      calculateEarnings()
    }
  }, [userId, wallet, fetchWithdrawals, calculateEarnings])

  const handleWithdrawRequest = async () => {
    if (!wallet || !withdrawAmount) return

    const amount = parseFloat(withdrawAmount)
    const availableBalance = earningsData.availableBalance
    if (amount < 500 || amount >= availableBalance) return

    try {
      setRequesting(true)
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: userId,
          amount: amount,
          bank_details: {
            account_holder: wallet.bank_account_holder,
            account_number: wallet.bank_account_number,
            ifsc: wallet.bank_ifsc,
            upi_id: wallet.upi_id
          }
        })

      if (error) throw error

      // Create notification for withdrawal request
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'withdrawal_processed',
          title: 'Withdrawal Request Submitted',
          message: `Your withdrawal request of ₹${amount.toFixed(2)} has been submitted and is under review.`
        })

      // Refresh withdrawals list and recalculate earnings
      await fetchWithdrawals()
      await calculateEarnings()
      setShowRequestModal(false)
      setWithdrawAmount('')
    } catch (error) {
      console.error('Error requesting withdrawal:', error)
    } finally {
      setRequesting(false)
    }
  }

  const getStatusIcon = (status: WithdrawalStatus) => {
    switch (status) {
      case 'processed':
        return CheckCircle
      case 'pending':
        return Clock
      case 'rejected':
        return XCircle
      default:
        return Clock
    }
  }

  const getStatusColor = (status: WithdrawalStatus) => {
    switch (status) {
      case 'processed':
        return 'text-success bg-success/10'
      case 'pending':
        return 'text-warning bg-warning/10'
      case 'rejected':
        return 'text-error bg-error/10'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canRequestWithdrawal = wallet &&
    earningsData.availableBalance >= 500 &&
    wallet.bank_details_submitted

  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'processed')
    .reduce((sum, w) => sum + w.amount, 0)

  const pendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl text-success bg-success/10">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">Total Withdrawn</h3>
            <div className="text-2xl font-bold text-gray-900">₹{totalWithdrawn.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Successfully processed</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl text-warning bg-warning/10">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">Pending Amount</h3>
            <div className="text-2xl font-bold text-gray-900">₹{pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Under review</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl text-primary bg-primary/10">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">Available Balance</h3>
            <div className="text-2xl font-bold text-gray-900">
              {loadingEarnings ? '₹---.--' : `₹${earningsData.availableBalance.toFixed(2)}`}
            </div>
            <p className="text-xs text-gray-500">Ready for withdrawal</p>
          </div>
        </motion.div>
      </div>

      {/* Request Withdrawal Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Request Withdrawal</h2>
            <p className="text-sm text-gray-600 mt-1">
              Minimum withdrawal amount is ₹500
            </p>
          </div>
          <Button
            onClick={() => setShowRequestModal(true)}
            disabled={!canRequestWithdrawal}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </Button>
        </div>

        {!canRequestWithdrawal && (
          <div className="space-y-3">
            {!wallet?.bank_details_submitted && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-blue-900 font-medium">Bank Details Required</h4>
                    <p className="text-blue-800 text-sm mt-1">
                      Please add your bank details in the Wallet tab to enable withdrawals.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {wallet && earningsData.availableBalance < 500 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-900 font-medium">Insufficient Balance</h4>
                    <p className="text-yellow-800 text-sm mt-1">
                      You need at least ₹500 to request a withdrawal. Current balance: ₹{earningsData.availableBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Withdrawals History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Withdrawal History</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <ArrowDownToLine className="w-8 h-8 mb-2 opacity-50" />
            <p>No withdrawal requests yet</p>
            <p className="text-sm">Your withdrawal history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {withdrawals.map((withdrawal, index) => {
              const StatusIcon = getStatusIcon(withdrawal.status)
              const statusColor = getStatusColor(withdrawal.status)
              
              return (
                <motion.div
                  key={withdrawal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gray-100">
                        <CreditCard className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            ₹{withdrawal.amount.toFixed(2)}
                          </h3>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {withdrawal.status}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Requested on {formatDate(withdrawal.requested_at)}
                        </div>
                        {withdrawal.processed_at && (
                          <div className="text-sm text-gray-600">
                            Processed on {formatDate(withdrawal.processed_at)}
                          </div>
                        )}
                        {withdrawal.admin_notes && (
                          <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                            <strong>Admin Note:</strong> {withdrawal.admin_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bank Details Preview */}
                    {withdrawal.bank_details && (
                      <div className="text-right text-sm text-gray-500">
                        <div>
                          {(withdrawal.bank_details as any).account_holder}
                        </div>
                        <div>
                          ****{(withdrawal.bank_details as any).account_number?.slice(-4)}
                        </div>
                        <div>
                          {(withdrawal.bank_details as any).ifsc}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Withdrawal Request Modal */}
      {showRequestModal && (
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
                  max={earningsData.availableBalance}
                  step="0.01"
                />
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div>Available balance: ₹{earningsData.availableBalance.toFixed(2)}</div>
                <div className="text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <div className="flex items-start space-x-2">
                    <div className="text-amber-500 mt-0.5">ℹ️</div>
                    <div>
                      <div className="font-medium">Withdrawal Note:</div>
                      <div className="text-xs">You cannot withdraw the full available amount. Please leave at least ₹1 in your account for processing fees and system maintenance.</div>
                    </div>
                  </div>
                </div>
                <div>Processing time: 1-3 business days</div>
              </div>

              {/* Bank Details Preview */}
              {wallet?.bank_details_submitted && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Withdrawal will be sent to:
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{wallet.bank_account_holder}</div>
                    <div>****{wallet.bank_account_number?.slice(-4)}</div>
                    <div>{wallet.bank_ifsc}</div>
                    {wallet.upi_id && <div>UPI: {wallet.upi_id}</div>}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 pt-4">
                <Button
                  onClick={handleWithdrawRequest}
                  disabled={requesting || !withdrawAmount || parseFloat(withdrawAmount) < 500 || parseFloat(withdrawAmount) >= earningsData.availableBalance}
                  className="flex-1"
                >
                  {requesting ? 'Processing...' : 'Request Withdrawal'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRequestModal(false)
                    setWithdrawAmount('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}