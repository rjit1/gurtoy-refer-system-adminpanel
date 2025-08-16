'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { ReferralRequestWithUser, ReferralRequestStatus } from '@/lib/supabase/types'
import { isAdminAuthenticated } from '@/lib/auth'
import { formatDate, getStatusColor } from '@/lib/utils'
import { 
  Hash, 
  Check, 
  X, 
  Search, 
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function ReferralRequestsPage() {
  const [requests, setRequests] = useState<ReferralRequestWithUser[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ReferralRequestWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ReferralRequestStatus>('all')
  const [selectedRequest, setSelectedRequest] = useState<ReferralRequestWithUser | null>(null)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)
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

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      // Use the optimized view instead of complex joins
      const { data: requestsData, error } = await supabase
        .from('referral_requests_detailed')
        .select('*')
        .order('requested_at', { ascending: false })

      if (error) throw error

      const formattedRequests: ReferralRequestWithUser[] = requestsData.map(request => ({
        id: request.id,
        user_id: request.user_id,
        status: request.status,
        referral_code: request.referral_code,
        requested_at: request.requested_at,
        processed_at: request.processed_at || null,
        processed_by: request.processed_by || null,
        admin_notes: request.admin_notes || null,
        user: {
          full_name: request.full_name,
          phone: request.phone,
          kyc_status: request.kyc_status
        }
      }))

      setRequests(formattedRequests)
      console.log('Referral requests fetched:', formattedRequests.length)
    } catch (error) {
      console.error('Error fetching referral requests:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const filterRequests = useCallback(() => {
    let filtered = requests

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.phone.includes(searchTerm) ||
        (request.referral_code && request.referral_code.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, statusFilter])

  useEffect(() => {
    checkAuthentication()
  }, [checkAuthentication])

  useEffect(() => {
    if (!authLoading) {
      fetchRequests()
    }
  }, [authLoading, fetchRequests])

  useEffect(() => {
    filterRequests()
  }, [filterRequests])

  const handleProcessRequest = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return

    setProcessing(true)
    try {
      const updates: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        processed_at: new Date().toISOString(),
        processed_by: 'Admin',
        admin_notes: adminNotes.trim() || null
      }

      if (action === 'approve' && referralCode.trim()) {
        updates.referral_code = referralCode.trim()
        
        // Also update the user's referral_code
        await supabase
          .from('users')
          .update({ referral_code: referralCode.trim() })
          .eq('id', selectedRequest.user_id)
      }

      const { error } = await supabase
        .from('referral_code_requests')
        .update(updates)
        .eq('id', selectedRequest.id)

      if (error) throw error

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedRequest.user_id,
          type: action === 'approve' ? 'referral_generated' : 'referral_code_requested',
          title: action === 'approve' ? 'Referral Code Approved' : 'Referral Code Request Rejected',
          message: action === 'approve' 
            ? `Your referral code request has been approved. Your referral code is: ${referralCode}`
            : `Your referral code request has been rejected. ${adminNotes || 'Please contact support for more information.'}`,
        })

      // Refresh requests list
      await fetchRequests()
      setShowProcessDialog(false)
      setSelectedRequest(null)
      setReferralCode('')
      setAdminNotes('')
    } catch (error) {
      console.error('Error processing request:', error)
    } finally {
      setProcessing(false)
    }
  }

  const openProcessDialog = (request: ReferralRequestWithUser) => {
    setSelectedRequest(request)
    setReferralCode(request.referral_code || '')
    setAdminNotes(request.admin_notes || '')
    setShowProcessDialog(true)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900">Referral Code Requests</h1>
          <p className="mt-2 text-gray-600">
            Manage user referral code requests and approve/assign codes.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Requests</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, phone, or referral code..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Request Status</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | ReferralRequestStatus)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Code Requests ({filteredRequests.length})</CardTitle>
            <CardDescription>
              All user requests for referral codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Contact</th>
                    <th className="text-left py-3 px-4">KYC Status</th>
                    <th className="text-left py-3 px-4">Request Status</th>
                    <th className="text-left py-3 px-4">Referral Code</th>
                    <th className="text-left py-3 px-4">Requested</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.user.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{request.user.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${getStatusColor(request.user.kyc_status)}`}>
                          {request.user.kyc_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && <Clock className="h-3 w-3 text-yellow-500" />}
                          {request.status === 'approved' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {request.status === 'rejected' && <XCircle className="h-3 w-3 text-red-500" />}
                          <span className={`status-badge ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {request.referral_code ? (
                          <div className="flex items-center space-x-1">
                            <Hash className="h-3 w-3 text-gray-400" />
                            <span className="font-mono text-sm">{request.referral_code}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{formatDate(request.requested_at)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openProcessDialog(request)}
                          >
                            {request.status === 'pending' ? 'Process' : 'View'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No referral code requests found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Process Request Dialog */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Process Referral Code Request</DialogTitle>
              <DialogDescription>
                {selectedRequest?.status === 'pending' 
                  ? 'Approve or reject this referral code request'
                  : 'View referral code request details'
                }
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                {/* User Info */}
                <div className="space-y-2">
                  <div>
                    <Label>User</Label>
                    <p className="text-sm text-gray-900">{selectedRequest.user.full_name}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm text-gray-900">{selectedRequest.user.phone}</p>
                  </div>
                  <div>
                    <Label>KYC Status</Label>
                    <span className={`status-badge ${getStatusColor(selectedRequest.user.kyc_status)}`}>
                      {selectedRequest.user.kyc_status}
                    </span>
                  </div>
                  <div>
                    <Label>Request Status</Label>
                    <span className={`status-badge ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>

                {/* Referral Code Input (only for pending requests) */}
                {selectedRequest.status === 'pending' && (
                  <div>
                    <Label htmlFor="referralCode">Referral Code to Assign</Label>
                    <Input
                      id="referralCode"
                      placeholder="Enter referral code from MyDukaan"
                      value={referralCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferralCode(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Show assigned code for processed requests */}
                {selectedRequest.status !== 'pending' && selectedRequest.referral_code && (
                  <div>
                    <Label>Assigned Referral Code</Label>
                    <p className="text-sm font-mono text-gray-900">{selectedRequest.referral_code}</p>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Input
                    id="adminNotes"
                    placeholder="Optional notes for this request"
                    value={adminNotes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminNotes(e.target.value)}
                    className="mt-1"
                    disabled={selectedRequest.status !== 'pending'}
                  />
                </div>

                {/* Show processing info for processed requests */}
                {selectedRequest.status !== 'pending' && (
                  <div className="space-y-2">
                    {selectedRequest.processed_at && (
                      <div>
                        <Label>Processed At</Label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRequest.processed_at)}</p>
                      </div>
                    )}
                    {selectedRequest.processed_by && (
                      <div>
                        <Label>Processed By</Label>
                        <p className="text-sm text-gray-900">{selectedRequest.processed_by}</p>
                      </div>
                    )}
                    {selectedRequest.admin_notes && (
                      <div>
                        <Label>Admin Notes</Label>
                        <p className="text-sm text-gray-900">{selectedRequest.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions (only for pending requests) */}
                {selectedRequest.status === 'pending' && (
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={() => handleProcessRequest('approve')}
                      disabled={processing || !referralCode.trim()}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Approve & Assign'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleProcessRequest('reject')}
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