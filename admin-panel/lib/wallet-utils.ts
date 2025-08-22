// Admin panel wallet management utilities
import { supabase } from './supabase/client'

export const COMMISSION_RATE = 0.05

// Interface for wallet calculation results
export interface WalletCalculation {
  totalEarnings: number
  pendingEarnings: number
  availableBalance: number
  totalOrders: number
  deliveredOrders: number
  pendingOrders: number
}

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
      
    console.log('Admin - Withdrawals for calculation:', withdrawals)

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

// Update user wallet with calculated earnings
export async function updateUserWallet(userId: string): Promise<boolean> {
  try {
    const earnings = await calculateUserEarnings(userId)

    // Get current wallet data to preserve bank details
    const { data: currentWallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Error fetching wallet:', walletError)
      return false
    }

    // Update or insert wallet record
    const { error: updateError } = await supabase
      .from('wallets')
      .upsert({
        user_id: userId,
        total_earnings: earnings.totalEarnings,
        pending_earnings: earnings.pendingEarnings,
        available_balance: earnings.availableBalance,
        updated_at: new Date().toISOString(),
        // Preserve existing bank details
        ...(currentWallet && {
          bank_account_holder: currentWallet.bank_account_holder,
          bank_account_number: currentWallet.bank_account_number,
          bank_ifsc: currentWallet.bank_ifsc,
          upi_id: currentWallet.upi_id,
          bank_details_submitted: currentWallet.bank_details_submitted
        })
      }, {
        onConflict: 'user_id' // Ensure we update based on user_id conflict
      })

    if (updateError) {
      console.error('Error updating wallet:', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating user wallet:', error)
    return false
  }
}

// Update user wallet after order creation/update
export async function updateUserWalletAfterOrder(
  userId: string,
  orderPrice: number,
  orderStatus: string,
  oldStatus?: string
): Promise<boolean> {
  try {
    // Calculate commission
    const commission = orderPrice * COMMISSION_RATE

    // Use the centralized calculation function to update the wallet
    const success = await updateUserWallet(userId)
    
    if (!success) {
      return false
    }

    // Create notification for commission update
    let notificationMessage = ''
    let notificationType = 'commission_added'

    if (orderStatus === 'delivered' && oldStatus !== 'delivered') {
      notificationMessage = `Order delivered! ₹${commission.toFixed(2)} commission added to your wallet.`
    } else if (orderStatus === 'pending' && oldStatus === 'delivered') {
      notificationMessage = `Order status changed to pending. ₹${commission.toFixed(2)} moved to pending earnings.`
    } else if (orderStatus === 'delivered') {
      notificationMessage = `New order delivered! ₹${commission.toFixed(2)} commission added to your wallet.`
    } else if (orderStatus === 'pending' || orderStatus === 'processing') {
      notificationMessage = `New order received! ₹${commission.toFixed(2)} commission pending delivery.`
      notificationType = 'order_added'
    }

    if (notificationMessage) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notificationType,
          title: 'Commission Update',
          message: notificationMessage,
          read: false
        })
    }

    return true
  } catch (error) {
    console.error('Error updating user wallet:', error)
    return false
  }
}

// Update wallet when order status changes
export async function updateWalletOnStatusChange(
  userId: string,
  orderId: string,
  newStatus: string,
  oldStatus: string,
  orderPrice: number
): Promise<boolean> {
  try {
    // Only update if status actually changed
    if (newStatus === oldStatus) return true

    const success = await updateUserWalletAfterOrder(userId, orderPrice, newStatus, oldStatus)
    
    if (success) {
      console.log(`Wallet updated for user ${userId} after order status change: ${oldStatus} -> ${newStatus}`)
    }

    return success
  } catch (error) {
    console.error('Error updating wallet on status change:', error)
    return false
  }
}

// Recalculate all user wallets (admin utility)
export async function recalculateAllWallets(): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  try {
    // Get all users with orders
    const { data: usersWithOrders, error } = await supabase
      .from('orders')
      .select('user_id')
      .not('user_id', 'is', null)

    if (error) throw error

    // Get unique user IDs
    const userIds = usersWithOrders?.map(o => o.user_id) || []
    const uniqueUserIds = Array.from(new Set(userIds))

    // Update each user's wallet
    for (const userId of uniqueUserIds) {
      const result = await updateUserWalletAfterOrder(userId, 0, 'recalculation')
      if (result) {
        success++
      } else {
        failed++
      }
    }

    console.log(`Wallet recalculation complete: ${success} success, ${failed} failed`)
    return { success, failed }
  } catch (error) {
    console.error('Error recalculating wallets:', error)
    return { success, failed }
  }
}

// Get wallet summary for admin dashboard
export async function getWalletSummary(): Promise<{
  totalEarnings: number
  totalAvailable: number
  totalPending: number
  totalUsers: number
}> {
  try {
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('total_earnings, available_balance, pending_earnings')

    if (error) throw error

    const summary = wallets?.reduce(
      (acc, wallet) => ({
        totalEarnings: acc.totalEarnings + (wallet.total_earnings || 0),
        totalAvailable: acc.totalAvailable + (wallet.available_balance || 0),
        totalPending: acc.totalPending + (wallet.pending_earnings || 0),
        totalUsers: acc.totalUsers + 1
      }),
      { totalEarnings: 0, totalAvailable: 0, totalPending: 0, totalUsers: 0 }
    ) || { totalEarnings: 0, totalAvailable: 0, totalPending: 0, totalUsers: 0 }

    return summary
  } catch (error) {
    console.error('Error getting wallet summary:', error)
    return { totalEarnings: 0, totalAvailable: 0, totalPending: 0, totalUsers: 0 }
  }
}
