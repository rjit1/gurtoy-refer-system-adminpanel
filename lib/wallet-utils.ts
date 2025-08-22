// Wallet management utilities for commission calculation and updates
import { supabase } from './supabase/client'

export interface WalletCalculation {
  totalEarnings: number
  pendingEarnings: number
  availableBalance: number
  totalOrders: number
  deliveredOrders: number
  pendingOrders: number
}

// Commission rate (5%)
export const COMMISSION_RATE = 0.05

// Minimum withdrawal amount
export const MIN_WITHDRAWAL_AMOUNT = 500

// Calculate user earnings from orders - CENTRALIZED CALCULATION LOGIC
export async function calculateUserEarnings(userId: string): Promise<WalletCalculation> {
  try {
    // Get all orders for the user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('price, status')
      .eq('user_id', userId)

    if (ordersError) throw ordersError

    // Get all withdrawals (processed and pending)
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('amount, status')
      .eq('user_id', userId)
      .in('status', ['processed', 'pending'])
      
    console.log('Withdrawals for calculation:', withdrawals)

    if (withdrawalsError) throw withdrawalsError

    let totalEarnings = 0
    let pendingEarnings = 0
    let availableBalance = 0
    let totalOrders = 0
    let deliveredOrders = 0
    let pendingOrders = 0

    // Calculate earnings from orders
    if (orders && orders.length > 0) {
      totalOrders = orders.length

      orders.forEach((order) => {
        const commission = order.price * COMMISSION_RATE

        if (order.status === 'delivered') {
          totalEarnings += commission
          availableBalance += commission
          deliveredOrders++
        } else if (order.status === 'pending' || order.status === 'processing') {
          totalEarnings += commission
          pendingEarnings += commission
          pendingOrders++
        }
      })
    }

    // Subtract processed and pending withdrawals from available balance
    if (withdrawals && withdrawals.length > 0) {
      // Calculate total processed withdrawals
      const processedWithdrawals = withdrawals
        .filter(w => w.status === 'processed')
        .reduce((sum, w) => sum + w.amount, 0)
      
      // Calculate total pending withdrawals
      const pendingWithdrawals = withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0)
      
      // Subtract both from available balance
      availableBalance = Math.max(0, availableBalance - processedWithdrawals - pendingWithdrawals)
      
      // Add pending withdrawals to pendingEarnings for better visibility
      pendingEarnings += pendingWithdrawals
    }

    // Round all monetary values to 2 decimal places
    return {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      pendingEarnings: Math.round(pendingEarnings * 100) / 100,
      availableBalance: Math.round(availableBalance * 100) / 100,
      totalOrders,
      deliveredOrders,
      pendingOrders
    }
  } catch (error) {
    console.error('Error calculating user earnings:', error)
    return {
      totalEarnings: 0,
      pendingEarnings: 0,
      availableBalance: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      pendingOrders: 0
    }
  }
}

// Update wallet with calculated earnings
export async function updateUserWallet(userId: string): Promise<boolean> {
  try {
    const earnings = await calculateUserEarnings(userId)

    const { error } = await supabase
      .from('wallets')
      .upsert({
        user_id: userId,
        total_earnings: earnings.totalEarnings,
        pending_earnings: earnings.pendingEarnings,
        available_balance: earnings.availableBalance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id' // Ensure we update based on user_id conflict
      })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error updating user wallet:', error)
    return false
  }
}

// Validate withdrawal request
export function validateWithdrawalRequest(
  amount: number,
  availableBalance: number,
  hasBankDetails: boolean
): { isValid: boolean; error?: string } {
  if (!hasBankDetails) {
    return { isValid: false, error: 'Please add your bank details first' }
  }

  if (amount < MIN_WITHDRAWAL_AMOUNT) {
    return { isValid: false, error: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}` }
  }

  if (amount > availableBalance) {
    return { isValid: false, error: 'Withdrawal amount exceeds your available balance.' }
  }

  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' }
  }

  // Check for reasonable decimal places (max 2)
  if (amount.toString().split('.')[1]?.length > 2) {
    return { isValid: false, error: 'Amount can have maximum 2 decimal places' }
  }

  return { isValid: true }
}

// Process withdrawal request
export async function processWithdrawalRequest(
  userId: string,
  amount: number,
  bankDetails: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate the request
    const earnings = await calculateUserEarnings(userId)
    const validation = validateWithdrawalRequest(amount, earnings.availableBalance, !!bankDetails)
    
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // Create withdrawal request
    const { error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: amount,
        bank_details: bankDetails,
        status: 'pending'
      })

    if (withdrawalError) throw withdrawalError

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'withdrawal_processed',
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of ₹${amount.toFixed(2)} has been submitted and is under review.`
      })

    return { success: true }
  } catch (error) {
    console.error('Error processing withdrawal request:', error)
    return { success: false, error: 'Failed to process withdrawal request. Please try again.' }
  }
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Get wallet status for user
export async function getWalletStatus(userId: string): Promise<{
  earnings: WalletCalculation
  canWithdraw: boolean
  hasBankDetails: boolean
  pendingWithdrawals: number
}> {
  try {
    const earnings = await calculateUserEarnings(userId)

    // Check if user has bank details
    const { data: wallet } = await supabase
      .from('wallets')
      .select('bank_details_submitted')
      .eq('user_id', userId)
      .single()

    // Get pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'pending')

    const pendingAmount = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0

    return {
      earnings,
      canWithdraw: earnings.availableBalance >= MIN_WITHDRAWAL_AMOUNT && wallet?.bank_details_submitted,
      hasBankDetails: wallet?.bank_details_submitted || false,
      pendingWithdrawals: pendingAmount
    }
  } catch (error) {
    console.error('Error getting wallet status:', error)
    return {
      earnings: {
        totalEarnings: 0,
        pendingEarnings: 0,
        availableBalance: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        pendingOrders: 0
      },
      canWithdraw: false,
      hasBankDetails: false,
      pendingWithdrawals: 0
    }
  }
}

// Update wallet when order status changes (for admin use)
export async function updateWalletOnOrderStatusChange(
  userId: string,
  orderId: string,
  newStatus: string,
  oldStatus: string
): Promise<boolean> {
  try {
    // Only update wallet if status actually changed
    if (newStatus === oldStatus) return true

    // Recalculate and update wallet
    const success = await updateUserWallet(userId)
    
    if (success) {
      // Create notification for status change
      let notificationMessage = ''
      
      if (newStatus === 'delivered' && oldStatus !== 'delivered') {
        notificationMessage = 'Your order has been delivered! Commission has been added to your wallet.'
      } else if (newStatus === 'pending' && oldStatus === 'delivered') {
        notificationMessage = 'Order status changed to pending. Commission moved to pending earnings.'
      }

      if (notificationMessage) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'commission_added',
            title: 'Order Status Updated',
            message: notificationMessage
          })
      }
    }

    return success
  } catch (error) {
    console.error('Error updating wallet on order status change:', error)
    return false
  }
}
