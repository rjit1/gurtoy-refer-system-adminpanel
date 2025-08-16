// Optimized database queries using views and functions
import { supabase } from '../supabase/client'
import type { DashboardStats, Profile, Wallet, Withdrawal, UserWithWallet, WithdrawalWithUser } from '../supabase/types'

// Cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Cache utility functions
function getCacheKey(query: string, params?: any): string {
  return `${query}_${JSON.stringify(params || {})}`
}

function getFromCache<T>(key: string): T | null {
  const cached = queryCache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T
  }
  queryCache.delete(key)
  return null
}

function setCache<T>(key: string, data: T, ttlMs: number = 30000): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  })
}

// Admin Dashboard Queries
export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const cacheKey = getCacheKey('admin_dashboard_stats')
  const cached = getFromCache<DashboardStats>(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    // Use the optimized function instead of multiple queries
    const { data, error } = await supabase
      .rpc('get_admin_dashboard_stats')

    if (error) throw error

    const stats: DashboardStats = {
      totalUsers: data[0]?.total_users || 0,
      kycApproved: data[0]?.kyc_approved || 0,
      referralCodesAssigned: data[0]?.referral_codes_assigned || 0,
      totalSalesAdded: data[0]?.total_sales_added || 0,
      totalPaidToUsers: data[0]?.total_paid_to_users || 0,
      pendingWithdrawals: data[0]?.pending_withdrawals || 0,
      pendingReferralRequests: data[0]?.pending_referral_requests || 0
    }

    // Cache for 30 seconds
    setCache(cacheKey, stats, 30000)
    return stats
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    
    // Fallback to individual queries if function fails
    return await getAdminDashboardStatsFallback()
  }
}

async function getAdminDashboardStatsFallback(): Promise<DashboardStats> {
  const [
    totalUsersResult,
    kycApprovedResult,
    referralCodesResult,
    totalSalesResult,
    totalPaidResult,
    pendingWithdrawalsResult,
    pendingReferralRequestsResult
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('kyc_status', 'approved'),
    supabase.from('users').select('*', { count: 'exact', head: true }).not('referral_code', 'is', null),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('wallets').select('total_earnings'),
    supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('referral_code_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  ])

  const totalPaidToUsers = totalPaidResult.data?.reduce((sum, wallet) => sum + (wallet.total_earnings || 0), 0) || 0

  return {
    totalUsers: totalUsersResult.count || 0,
    kycApproved: kycApprovedResult.count || 0,
    referralCodesAssigned: referralCodesResult.count || 0,
    totalSalesAdded: totalSalesResult.count || 0,
    totalPaidToUsers,
    pendingWithdrawals: pendingWithdrawalsResult.count || 0,
    pendingReferralRequests: pendingReferralRequestsResult.count || 0
  }
}

// User Management Queries
export async function getUsersWithWallets(): Promise<UserWithWallet[]> {
  const cacheKey = getCacheKey('users_with_wallets')
  const cached = getFromCache<UserWithWallet[]>(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    // Use the optimized view instead of joins
    const { data, error } = await supabase
      .from('user_wallet_summary')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const users: UserWithWallet[] = data.map(user => ({
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      aadhaar_name: user.aadhaar_name,
      kyc_status: user.kyc_status,
      referral_code: user.referral_code,
      aadhaar_url: user.aadhaar_url,
      selfie_url: user.selfie_url,
      profile_image: user.profile_image,
      created_at: user.created_at,
      wallet: {
        total_earnings: user.total_earnings,
        available_balance: user.available_balance,
        pending_earnings: user.pending_earnings
      }
    }))

    // Cache for 60 seconds
    setCache(cacheKey, users, 60000)
    return users
  } catch (error) {
    console.error('Error fetching users with wallets:', error)
    throw error
  }
}

// Withdrawal Management Queries
export async function getWithdrawalsWithUsers(): Promise<WithdrawalWithUser[]> {
  const cacheKey = getCacheKey('withdrawals_with_users')
  const cached = getFromCache<WithdrawalWithUser[]>(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    // Use the optimized view
    const { data, error } = await supabase
      .from('withdrawal_requests_detailed')
      .select('*')

    if (error) throw error

    const withdrawals: WithdrawalWithUser[] = data.map(withdrawal => ({
      ...withdrawal,
      user: {
        full_name: withdrawal.full_name,
        phone: withdrawal.phone,
        referral_code: withdrawal.referral_code
      }
    }))

    // Cache for 30 seconds
    setCache(cacheKey, withdrawals, 30000)
    return withdrawals
  } catch (error) {
    console.error('Error fetching withdrawals with users:', error)
    throw error
  }
}

// User Dashboard Queries
export async function getUserDashboardData(userId: string) {
  const cacheKey = getCacheKey('user_dashboard', { userId })
  const cached = getFromCache(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    // Use the optimized view for dashboard data
    const { data, error } = await supabase
      .from('user_dashboard_summary')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    // Cache for 30 seconds
    setCache(cacheKey, data, 30000)
    return data
  } catch (error) {
    console.error('Error fetching user dashboard data:', error)
    throw error
  }
}

// User Earnings Calculation
export async function calculateUserEarnings(userId: string) {
  const cacheKey = getCacheKey('user_earnings', { userId })
  const cached = getFromCache(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    // Use the optimized function
    const { data, error } = await supabase
      .rpc('calculate_user_earnings', { user_uuid: userId })

    if (error) throw error

    const earnings = data[0] || {
      total_earnings: 0,
      pending_earnings: 0,
      available_balance: 0,
      total_orders: 0,
      delivered_orders: 0,
      pending_orders: 0
    }

    // Cache for 60 seconds
    setCache(cacheKey, earnings, 60000)
    return earnings
  } catch (error) {
    console.error('Error calculating user earnings:', error)
    throw error
  }
}

// Referral Requests Queries
export async function getReferralRequestsWithUsers() {
  const cacheKey = getCacheKey('referral_requests_with_users')
  const cached = getFromCache(cacheKey)
  
  if (cached) {
    return cached
  }

  try {
    // Use the optimized view
    const { data, error } = await supabase
      .from('referral_requests_detailed')
      .select('*')

    if (error) throw error

    // Cache for 60 seconds
    setCache(cacheKey, data, 60000)
    return data
  } catch (error) {
    console.error('Error fetching referral requests with users:', error)
    throw error
  }
}

// Batch Operations
export async function batchUpdateWallets(updates: Array<{ userId: string; earnings: any }>) {
  try {
    const promises = updates.map(update => 
      supabase
        .from('wallets')
        .upsert({
          user_id: update.userId,
          total_earnings: update.earnings.total_earnings,
          pending_earnings: update.earnings.pending_earnings,
          available_balance: update.earnings.available_balance,
          updated_at: new Date().toISOString()
        })
    )

    await Promise.all(promises)
    
    // Clear related caches
    queryCache.clear()
  } catch (error) {
    console.error('Error batch updating wallets:', error)
    throw error
  }
}

// Cache Management
export function clearQueryCache(pattern?: string) {
  if (pattern) {
    const keys = Array.from(queryCache.keys())
    for (const key of keys) {
      if (key.includes(pattern)) {
        queryCache.delete(key)
      }
    }
  } else {
    queryCache.clear()
  }
}

export function getCacheStats() {
  return {
    size: queryCache.size,
    keys: Array.from(queryCache.keys())
  }
}
