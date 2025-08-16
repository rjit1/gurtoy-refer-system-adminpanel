'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Filter, 
  Calendar, 
  Package, 
  User, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  Search
} from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
import type { Order, OrderStatus } from '../../lib/supabase/types'

interface ReferralActivityTabProps {
  userId: string
}

export default function ReferralActivityTab({ userId }: ReferralActivityTabProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return CheckCircle
      case 'processing':
        return Clock
      case 'pending':
        return AlertCircle
      default:
        return Clock
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'text-success bg-success/10'
      case 'processing':
        return 'text-info bg-info/10'
      case 'pending':
        return 'text-warning bg-warning/10'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false
    }

    // Date filter
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at)
      const now = new Date()
      const daysAgo = parseInt(dateFilter.replace('d', ''))
      const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      
      if (orderDate < filterDate) {
        return false
      }
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        order.buyer_name.toLowerCase().includes(searchLower) ||
        order.order_id.toLowerCase().includes(searchLower) ||
        order.product_names.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const totalCommission = filteredOrders.reduce((sum, order) => sum + order.commission, 0)
  const deliveredOrders = filteredOrders.filter(order => order.status === 'delivered').length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const maskName = (name: string) => {
    const parts = name.split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0) + '*'.repeat(Math.max(0, parts[0].length - 1))
    }
    return parts[0] + ' ' + parts[1].charAt(0) + '.'
  }

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
            <div className="p-3 rounded-xl text-primary bg-primary/10">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
            <div className="text-2xl font-bold text-gray-900">{filteredOrders.length}</div>
            <p className="text-xs text-gray-500">Referral orders tracked</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl text-success bg-success/10">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">Delivered Orders</h3>
            <div className="text-2xl font-bold text-gray-900">{deliveredOrders}</div>
            <p className="text-xs text-gray-500">Commission earned</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl text-success bg-success/10">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">Total Commission</h3>
            <div className="text-2xl font-bold text-gray-900">₹{totalCommission.toFixed(2)}</div>
            <p className="text-xs text-gray-500">From filtered orders</p>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by buyer, order ID, or product..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-8 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | '7d' | '30d' | '90d')}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-8 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Orders Table/List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Referral Orders</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Package className="w-8 h-8 mb-2 opacity-50" />
            <p>No orders found</p>
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? (
              <p className="text-sm">Try adjusting your filters</p>
            ) : (
              <p className="text-sm">Your referral orders will appear here</p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product(s)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => {
                    const StatusIcon = getStatusIcon(order.status)
                    const statusColor = getStatusColor(order.status)
                    
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {maskName(order.buyer_name)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.order_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {order.product_names}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{order.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {order.status}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success">
                          ₹{order.commission.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredOrders.map((order, index) => {
                const StatusIcon = getStatusIcon(order.status)
                const statusColor = getStatusColor(order.status)
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {maskName(order.buyer_name)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.order_id}
                          </div>
                        </div>
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {order.status}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-900">
                      <div className="truncate">{order.product_names}</div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="space-x-4">
                        <span className="text-gray-600">₹{order.price.toFixed(2)}</span>
                        <span className="text-gray-600">Qty: {order.quantity}</span>
                      </div>
                      <div className="font-medium text-success">
                        ₹{order.commission.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {formatDate(order.created_at)}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}