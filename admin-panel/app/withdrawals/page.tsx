'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/layout/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { WithdrawalWithUser, WithdrawalStatus } from '@/lib/supabase/types'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { 
  Wallet, 
  Eye, 
  Check, 
  X, 
  Filter,
  User,
  Phone,
  Calendar,
  Hash,
  CreditCard,
  Building,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([])
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<WithdrawalWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | WithdrawalStatus>('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalWithUser | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [processing, setProcessing] = useState(false)

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true)
      // Use the optimized view instead of complex joins
      const { data, error } = await supabase
        .from('withdrawal_requests_detailed')
        .select('*')
        .order('requested_at', { ascending: false })

      if (error) throw error

      const formattedWithdrawals: WithdrawalWithUser[] = data.map(withdrawal => ({
        id: withdrawal.id,
        user_id: withdrawal.user_id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        bank_details: withdrawal.bank_details,
        admin_notes: withdrawal.admin_notes || null,
        requested_at: withdrawal.requested_at,
        processed_at: withdrawal.processed_at,
        user: {
          full_name: withdrawal.full_name,
          phone: withdrawal.phone,
          referral_code: withdrawal.referral_code
        }
      }))

      setWithdrawals(formattedWithdrawals)
      console.log('Withdrawals fetched:', formattedWithdrawals.length)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const filterWithdrawals = useCallback(() => {
    let filtered = withdrawals

    if (statusFilter !== 'all') {
      filtered = filtered.filter(withdrawal => withdrawal.status === statusFilter)
    }

    setFilteredWithdrawals(filtered)
  }, [withdrawals, statusFilter])

  useEffect(() => {
    fetchWithdrawals()
  }, [fetchWithdrawals])

  useEffect(() => {
    filterWithdrawals()
  }, [filterWithdrawals])

  const handleWithdrawalAction = async (action: 'approve' | 'reject') => {
    if (!selectedWithdrawal) return

    setProcessing(true)
    try {
      const updates: any = {
        status: action === 'approve' ? 'processed' : 'rejected',
        processed_at: new Date().toISOString(),
        admin_notes: action === 'approve' 
          ? `Withdrawal processed on ${new Date().toLocaleDateString()}`
          : 'Withdrawal rejected by admin'
      }

      const { error } = await supabase
        .from('withdrawals')
        .update(updates)
        .eq('id', selectedWithdrawal.id)

      if (error) throw error

      if (action === 'approve') {
        // Update wallet balance
        const { error: walletError } = await supabase
          .from('wallets')
          .update({
            available_balance: selectedWithdrawal.user ? 
              (selectedWithdrawal.user as any).wallet?.available_balance - selectedWithdrawal.amount : 0
          })
          .eq('user_id', selectedWithdrawal.user_id)

        if (walletError) throw walletError

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedWithdrawal.user_id,
            type: 'withdrawal_processed',
            title: 'Withdrawal Processed',
            message: `Your withdrawal of ${formatCurrency(selectedWithdrawal.amount)} has been processed and will be credited to your account within 2-3 business days.`
          })

        // Create admin notice
        await supabase
          .from('notices')
          .insert({
            title: 'Withdrawal Processed',
            content: `Your ₹${selectedWithdrawal.amount} withdrawal was paid on ${new Date().toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}`,
            is_active: true
          })
      } else {
        // Create rejection notification
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedWithdrawal.user_id,
            type: 'withdrawal_rejected',
            title: 'Withdrawal Rejected',
            message: `Your withdrawal request of ${formatCurrency(selectedWithdrawal.amount)} has been rejected. Please contact support for more information.`
          })
      }

      // Refresh withdrawals list
      await fetchWithdrawals()
      setShowDetailsDialog(false)
      setSelectedWithdrawal(null)
    } catch (error) {
      console.error('Error processing withdrawal:', error)
    } finally {
      setProcessing(false)
    }
  }

  const openDetailsDialog = (withdrawal: WithdrawalWithUser) => {
    setSelectedWithdrawal(withdrawal)
    setShowDetailsDialog(true)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Withdrawal Management</h1>
          <p className="mt-2 text-gray-600">
            Review and process user withdrawal requests.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === 'pending').length}
              </div>
              <p className="text-xs text-gray-500">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending Amount</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  withdrawals
                    .filter(w => w.status === 'pending')
                    .reduce((sum, w) => sum + w.amount, 0)
                )}
              </div>
              <p className="text-xs text-gray-500">
                To be processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {withdrawals.filter(w => 
                  w.status === 'processed' && 
                  w.processed_at && 
                  new Date(w.processed_at).toDateString() === new Date().toDateString()
                ).length}
              </div>
              <p className="text-xs text-gray-500">
                Completed today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | WithdrawalStatus)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processed">Processed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Requests ({filteredWithdrawals.length})</CardTitle>
            <CardDescription>
              All withdrawal requests from users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Requested</th>
                    <th className="text-left py-3 px-4">Processed</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{withdrawal.user.full_name}</p>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{withdrawal.user.phone}</span>
                            </div>
                            {withdrawal.user.referral_code && (
                              <div className="flex items-center space-x-1">
                                <Hash className="h-3 w-3 text-gray-400" />
                                <span className="text-xs font-mono text-gray-600">{withdrawal.user.referral_code}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(withdrawal.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{formatDate(withdrawal.requested_at)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {withdrawal.processed_at ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{formatDate(withdrawal.processed_at)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsDialog(withdrawal)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredWithdrawals.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No withdrawal requests found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Withdrawal Request Details</DialogTitle>
              <DialogDescription>
                Review withdrawal request and bank details
              </DialogDescription>
            </DialogHeader>
            
            {selectedWithdrawal && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">User Name</label>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.user.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.user.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Referral Code</label>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.user.referral_code || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</p>
                  </div>
                </div>

                {/* Bank Details */}
                {selectedWithdrawal.bank_details && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Account Holder
                        </label>
                        <p className="text-sm text-gray-900">{selectedWithdrawal.bank_details.account_holder || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <CreditCard className="h-4 w-4 mr-1" />
                          Account Number
                        </label>
                        <p className="text-sm text-gray-900 font-mono">{selectedWithdrawal.bank_details.account_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          IFSC Code
                        </label>
                        <p className="text-sm text-gray-900 font-mono">{selectedWithdrawal.bank_details.ifsc || 'Not provided'}</p>
                      </div>
                      {selectedWithdrawal.bank_details.upi_id && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">UPI ID</label>
                          <p className="text-sm text-gray-900">{selectedWithdrawal.bank_details.upi_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status and Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <span className={`status-badge ${getStatusColor(selectedWithdrawal.status)}`}>
                      {selectedWithdrawal.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Requested At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedWithdrawal.requested_at)}</p>
                  </div>
                </div>

                {selectedWithdrawal.admin_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                    <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded">{selectedWithdrawal.admin_notes}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedWithdrawal.status === 'pending' && (
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={() => handleWithdrawalAction('approve')}
                      disabled={processing}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Mark as Paid'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleWithdrawalAction('reject')}
                      disabled={processing}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}