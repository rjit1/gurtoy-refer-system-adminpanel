// Admin panel wallet management utilities
import { supabase } from './supabase/client'

export const COMMISSION_RATE = 0.05

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

    // Get current wallet data
    const { data: currentWallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Error fetching wallet:', walletError)
      return false
    }

    // Calculate new earnings based on all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('price, status')
      .eq('user_id', userId)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return false
    }

    let totalEarnings = 0
    let pendingEarnings = 0
    let availableBalance = 0

    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        const orderCommission = order.price * COMMISSION_RATE

        if (order.status === 'delivered') {
          totalEarnings += orderCommission
          availableBalance += orderCommission
        } else if (order.status === 'pending' || order.status === 'processing') {
          totalEarnings += orderCommission
          pendingEarnings += orderCommission
        }
      })
    }

    // Subtract processed withdrawals from available balance
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'processed')

    if (withdrawals && withdrawals.length > 0) {
      const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0)
      availableBalance = Math.max(0, availableBalance - totalWithdrawn)
    }

    // Update or insert wallet record
    const { error: updateError } = await supabase
      .from('wallets')
      .upsert({
        user_id: userId,
        total_earnings: Math.round(totalEarnings * 100) / 100,
        pending_earnings: Math.round(pendingEarnings * 100) / 100,
        available_balance: Math.round(availableBalance * 100) / 100,
        updated_at: new Date().toISOString(),
        // Preserve existing bank details
        ...(currentWallet && {
          bank_account_holder: currentWallet.bank_account_holder,
          bank_account_number: currentWallet.bank_account_number,
          bank_ifsc: currentWallet.bank_ifsc,
          upi_id: currentWallet.upi_id,
          bank_details_submitted: currentWallet.bank_details_submitted
        })
      })

    if (updateError) {
      console.error('Error updating wallet:', updateError)
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
    const uniqueUserIds = [...new Set(usersWithOrders?.map(o => o.user_id) || [])]

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
