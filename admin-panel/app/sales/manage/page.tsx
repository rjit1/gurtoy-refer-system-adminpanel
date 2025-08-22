'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/layout/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { OrderWithUser, OrderStatus } from '@/lib/supabase/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Search, 
  Filter,
  Eye,
  Edit,
  Package,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react'

interface SalesFilters {
  search: string
  status: OrderStatus | 'all'
  dateFrom: string
  dateTo: string
}

export default function ManageSalesPage() {
  const [sales, setSales] = useState<OrderWithUser[]>([])
  const [filteredSales, setFilteredSales] = useState<OrderWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<OrderWithUser | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [filters, setFilters] = useState<SalesFilters>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  })

  const fetchSales = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users!inner (
            full_name,
            referral_code,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const salesWithUser: OrderWithUser[] = data.map(order => ({
        id: order.id,
        buyer_name: order.buyer_name,
        order_id: order.order_id,
        product_names: order.product_names,
        quantity: order.quantity,
        price: order.price,
        status: order.status,
        commission: order.commission,
        created_at: order.created_at,
        user: {
          full_name: order.users.full_name,
          referral_code: order.users.referral_code,
          phone: order.users.phone
        }
      }))

      setSales(salesWithUser)
      console.log('Sales fetched:', salesWithUser.length)
    } catch (err: any) {
      setError('Error fetching sales: ' + err.message)
      console.error('Error fetching sales:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const applyFilters = useCallback(() => {
    let filtered = [...sales]

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(sale => 
        sale.order_id.toLowerCase().includes(searchTerm) ||
        sale.buyer_name.toLowerCase().includes(searchTerm) ||
        sale.product_names.toLowerCase().includes(searchTerm) ||
        sale.user.full_name.toLowerCase().includes(searchTerm) ||
        (sale.user.referral_code && sale.user.referral_code.toLowerCase().includes(searchTerm))
      )
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(sale => sale.status === filters.status)
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(sale => 
        new Date(sale.created_at) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      filtered = filtered.filter(sale => 
        new Date(sale.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      )
    }

    setFilteredSales(filtered)
  }, [sales, filters])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleStatusUpdate = async () => {
    if (!selectedSale) return

    setUpdating(selectedSale.id)
    setError('')
    setSuccess('')

    try {
      const oldStatus = selectedSale.status
      const commission = newStatus === 'delivered' ? selectedSale.price * 0.05 : 0

      // Update order status and commission
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          commission: commission
        })
        .eq('id', selectedSale.id)

      if (orderError) throw orderError

      // If status changed to delivered, update wallet
      if (newStatus === 'delivered' && oldStatus !== 'delivered') {
        // Get user ID from the order
        const { data: orderData } = await supabase
          .from('orders')
          .select('user_id')
          .eq('id', selectedSale.id)
          .single()

        if (orderData) {
          // Get or create wallet
          let { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', orderData.user_id)
            .single()

          // Use upsert to handle both new and existing wallets
          const totalEarnings = wallet ? wallet.total_earnings + commission : commission;
          const availableBalance = wallet ? wallet.available_balance + commission : commission;
          
          const { error: upsertWalletError } = await supabase
            .from('wallets')
            .upsert({
              user_id: orderData.user_id,
              total_earnings: totalEarnings,
              available_balance: availableBalance,
              pending_earnings: wallet ? wallet.pending_earnings : 0,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id' // Handle conflict on user_id
            })

          if (upsertWalletError) {
            console.error('Error updating wallet:', upsertWalletError);
            throw upsertWalletError;
          }

          // Create notification for commission
          await supabase
            .from('notifications')
            .insert({
              user_id: orderData.user_id,
              type: 'commission_added',
              title: 'Commission Earned',
              message: `You earned ${formatCurrency(commission)} commission from order ${selectedSale.order_id}`
            })
        }
      }

      // If status changed from delivered to something else, remove commission
      if (oldStatus === 'delivered' && newStatus !== 'delivered') {
        const { data: orderData } = await supabase
          .from('orders')
          .select('user_id')
          .eq('id', selectedSale.id)
          .single()

        if (orderData) {
          const { data: wallet } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', orderData.user_id)
            .single()

          if (wallet) {
            const oldCommission = selectedSale.commission
            await supabase
              .from('wallets')
              .update({
                total_earnings: Math.max(0, wallet.total_earnings - oldCommission),
                available_balance: Math.max(0, wallet.available_balance - oldCommission)
              })
              .eq('user_id', orderData.user_id)
          }
        }
      }

      setSuccess(`Order status updated to ${newStatus}${newStatus === 'delivered' ? ` and commission of ${formatCurrency(commission)} credited` : ''}`)
      setShowStatusModal(false)
      setSelectedSale(null)
      fetchSales() // Refresh data
    } catch (err: any) {
      setError('Error updating status: ' + err.message)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    const config = statusConfig[status]
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    )
  }

  const getSalesStats = () => {
    const total = filteredSales.length
    const pending = filteredSales.filter(s => s.status === 'pending').length
    const processing = filteredSales.filter(s => s.status === 'processing').length
    const delivered = filteredSales.filter(s => s.status === 'delivered').length
    const totalValue = filteredSales.reduce((sum, sale) => sum + sale.price, 0)
    const totalCommission = filteredSales.reduce((sum, sale) => sum + sale.commission, 0)

    return { total, pending, processing, delivered, totalValue, totalCommission }
  }

  const stats = getSalesStats()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Sales</h1>
            <p className="mt-2 text-gray-600">
              View, filter, and manage all sales data with status updates.
            </p>
          </div>
          <Button onClick={fetchSales} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Processing</p>
                  <p className="text-xl font-bold">{stats.processing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-xl font-bold">{stats.delivered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-600">Commission</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalCommission)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Order ID, buyer, product, user..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as OrderStatus | 'all' }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setFilters({ search: '', status: 'all', dateFrom: '', dateTo: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Data ({filteredSales.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sales found matching your criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referrer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount & Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Order #{sale.order_id}
                            </div>
                            <div className="text-sm text-gray-500">
                              Buyer: {sale.buyer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Product: {sale.product_names}
                            </div>
                            <div className="text-sm text-gray-500">
                              Qty: {sale.quantity}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {sale.user.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {sale.user.referral_code || 'No code'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(sale.price)}
                            </div>
                            <div className="text-sm text-green-600">
                              Commission: {formatCurrency(sale.commission)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(sale.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(sale.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSale(sale)
                              setNewStatus(sale.status)
                              setShowStatusModal(true)
                            }}
                            disabled={updating === sale.id}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {updating === sale.id ? 'Updating...' : 'Update Status'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Update Modal */}
        {showStatusModal && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Order Status
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Order: #{selectedSale.order_id}</p>
                  <p className="text-sm text-gray-600">Current Status: {selectedSale.status}</p>
                </div>
                <div>
                  <Label htmlFor="newStatus">New Status</Label>
                  <select
                    id="newStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                {newStatus === 'delivered' && selectedSale.status !== 'delivered' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Commission of {formatCurrency(selectedSale.price * 0.05)} will be credited to {selectedSale.user.full_name}
                    </p>
                  </div>
                )}
                {selectedSale.status === 'delivered' && newStatus !== 'delivered' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠ Commission of {formatCurrency(selectedSale.commission)} will be removed from {selectedSale.user.full_name}&apos;s wallet
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex space-x-3">
                <Button
                  onClick={handleStatusUpdate}
                  disabled={updating === selectedSale.id}
                >
                  {updating === selectedSale.id ? 'Updating...' : 'Update Status'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStatusModal(false)
                    setSelectedSale(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  )
}