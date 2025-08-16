'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/admin-layout'
import { isAdminAuthenticated } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { DashboardStats } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils'
import { getAdminDashboardStats } from '@/lib/database/optimized-queries'
import { 
  Users, 
  UserCheck, 
  Hash, 
  ShoppingCart, 
  DollarSign, 
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    kycApproved: 0,
    referralCodesAssigned: 0,
    totalSalesAdded: 0,
    totalPaidToUsers: 0,
    pendingWithdrawals: 0,
    pendingReferralRequests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  const checkAuthentication = useCallback(async () => {
    try {
      const isAuthenticated = await isAdminAuthenticated()
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
      return
    }
    setAuthLoading(false)
  }, [router])

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Use optimized query function
      const stats = await getAdminDashboardStats()
      setStats(stats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Fallback to empty stats
      setStats({
        totalUsers: 0,
        kycApproved: 0,
        referralCodesAssigned: 0,
        totalSalesAdded: 0,
        totalPaidToUsers: 0,
        pendingWithdrawals: 0,
        pendingReferralRequests: 0
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuthentication()
  }, [checkAuthentication])

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardStats()
    }
  }, [authLoading, fetchDashboardStats])

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: 'Registered users',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'KYC Approved',
      value: stats.kycApproved,
      description: 'Verified users',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Referral Codes Assigned',
      value: stats.referralCodesAssigned,
      description: 'Active referrers',
      icon: Hash,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Sales Added',
      value: stats.totalSalesAdded,
      description: 'Orders processed',
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Total Paid to Users',
      value: formatCurrency(stats.totalPaidToUsers),
      description: 'Commission distributed',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      description: 'Awaiting processing',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Pending Referral Requests',
      value: stats.pendingReferralRequests,
      description: 'Code requests to process',
      icon: Hash,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-2 text-gray-600">
            Welcome to the GurToy Admin Panel. Here&apos;s your system overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat, index) => (
            <Card key={index} className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest system activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">System is running smoothly</p>
                    <p className="text-xs text-gray-500">All services operational</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Database connected</p>
                    <p className="text-xs text-gray-500">Supabase integration active</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pending tasks available</p>
                    <p className="text-xs text-gray-500">Check withdrawal requests</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                Quick Stats
              </CardTitle>
              <CardDescription>
                Key performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">KYC Approval Rate</span>
                  <span className="text-sm font-medium">
                    {stats.totalUsers > 0 
                      ? `${Math.round((stats.kycApproved / stats.totalUsers) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Referrers</span>
                  <span className="text-sm font-medium">
                    {stats.referralCodesAssigned}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Commission</span>
                  <span className="text-sm font-medium">
                    {stats.totalSalesAdded > 0 
                      ? formatCurrency(stats.totalPaidToUsers / stats.totalSalesAdded)
                      : formatCurrency(0)
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}