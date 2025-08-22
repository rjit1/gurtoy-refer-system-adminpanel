// Notification utilities
import { supabase } from './supabase/client'
import type { NotificationType } from './supabase/types'

// Create a notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        read: false
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error creating notification:', error)
    return false
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

// Get unread notification count for a user
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return data?.length || 0
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}

// Delete old notifications (older than 30 days)
export async function deleteOldNotifications(): Promise<boolean> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting old notifications:', error)
    return false
  }
}

// Create standard notification messages
export function createKycNotification(userId: string, status: 'submitted' | 'approved' | 'rejected'): Promise<boolean> {
  let title = ''
  let message = ''
  let type: NotificationType = 'kyc_submitted'
  
  switch (status) {
    case 'submitted':
      title = 'KYC Submitted'
      message = 'Your KYC documents have been submitted for verification. We will review them shortly.'
      type = 'kyc_submitted'
      break
    case 'approved':
      title = 'KYC Approved'
      message = 'Your KYC verification is complete! You can now request a referral code.'
      type = 'kyc_approved'
      break
    case 'rejected':
      title = 'KYC Rejected'
      message = 'Your KYC verification was rejected. Please check your documents and try again.'
      type = 'kyc_rejected'
      break
  }
  
  return createNotification(userId, type, title, message)
}

export function createReferralNotification(
  userId: string, 
  status: 'requested' | 'generated',
  referralCode?: string
): Promise<boolean> {
  let title = ''
  let message = ''
  let type: NotificationType = 'referral_code_requested'
  
  switch (status) {
    case 'requested':
      title = 'Referral Code Requested'
      message = 'Your request for a referral code has been submitted. We will process it shortly.'
      type = 'referral_code_requested'
      break
    case 'generated':
      title = 'Referral Code Generated'
      message = `Your referral code ${referralCode} has been generated! You can now start sharing it.`
      type = 'referral_generated'
      break
  }
  
  return createNotification(userId, type, title, message)
}

export function createWithdrawalNotification(
  userId: string,
  status: 'processed' | 'rejected',
  amount: number
): Promise<boolean> {
  let title = ''
  let message = ''
  let type: NotificationType = 'withdrawal_processed'
  
  switch (status) {
    case 'processed':
      title = 'Withdrawal Processed'
      message = `Your withdrawal of ₹${amount.toFixed(2)} has been processed successfully.`
      type = 'withdrawal_processed'
      break
    case 'rejected':
      title = 'Withdrawal Rejected'
      message = `Your withdrawal request of ₹${amount.toFixed(2)} was rejected. Please check your bank details.`
      type = 'withdrawal_rejected'
      break
  }
  
  return createNotification(userId, type, title, message)
}

export function createCommissionNotification(
  userId: string,
  amount: number,
  orderStatus: string
): Promise<boolean> {
  const title = 'Commission Update'
  let message = ''
  
  if (orderStatus === 'delivered') {
    message = `Order delivered! ₹${amount.toFixed(2)} commission added to your wallet.`
  } else {
    message = `New order received! ₹${amount.toFixed(2)} commission pending delivery.`
  }
  
  return createNotification(userId, 'commission_added', title, message)
}