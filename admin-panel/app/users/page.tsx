'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import AdminLayout from '@/components/layout/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { UserWithWallet, KycStatus } from '@/lib/supabase/types'
import { formatDate, getStatusColor } from '@/lib/utils'
import { 
  Eye, 
  Check, 
  X, 
  Search, 
  Filter,
  User,
  Phone,
  Calendar,
  Hash,
  FileText,
  Camera
} from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithWallet[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | KycStatus>('all')
  const [selectedUser, setSelectedUser] = useState<UserWithWallet | null>(null)
  const [showKYCDialog, setShowKYCDialog] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [documentUrls, setDocumentUrls] = useState<{[key: string]: string}>({})

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      // Use the optimized view instead of complex joins
      const { data: usersData, error } = await supabase
        .from('user_wallet_summary')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedUsers: UserWithWallet[] = usersData.map(user => ({
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

      setUsers(formattedUsers)
      console.log('Users fetched:', formattedUsers.length)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const filterUsers = useCallback(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm) ||
        user.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.kyc_status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    filterUsers()
  }, [filterUsers])

  const handleKYCAction = async (action: 'approve' | 'reject') => {
    if (!selectedUser) return

    setProcessing(true)
    try {
      const updates: any = {
        kyc_status: action === 'approve' ? 'approved' : 'rejected'
      }

      if (action === 'approve' && referralCode.trim()) {
        updates.referral_code = referralCode.trim()
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', selectedUser.id)

      if (error) throw error

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedUser.id,
          type: action === 'approve' ? 'kyc_approved' : 'kyc_rejected',
          title: action === 'approve' ? 'KYC Approved' : 'KYC Rejected',
          message: action === 'approve' 
            ? `Your KYC has been approved. Your referral code is: ${referralCode}`
            : 'Your KYC application has been rejected. Please contact support.',
        })

      // Refresh users list
      await fetchUsers()
      setShowKYCDialog(false)
      setSelectedUser(null)
      setReferralCode('')
    } catch (error) {
      console.error('Error updating KYC status:', error)
    } finally {
      setProcessing(false)
    }
  }

  const openKYCDialog = async (user: UserWithWallet) => {
    setSelectedUser(user)
    setReferralCode(user.referral_code || '')
    setShowKYCDialog(true)
    
    // Load document URLs when dialog opens
    await loadDocumentUrls(user)
  }

  const loadDocumentUrls = async (user: UserWithWallet) => {
    const urls: {[key: string]: string} = {}

    try {
      // Load actual Supabase storage URLs
      if (user.aadhaar_url) {
        const { data } = await supabase.storage
          .from('aadhaar')
          .createSignedUrl(user.aadhaar_url, 3600) // 1 hour expiry

        if (data?.signedUrl) {
          urls[`aadhaar_${user.id}`] = data.signedUrl
        } else {
          // Fallback to placeholder if URL generation fails
          urls[`aadhaar_${user.id}`] = 'https://via.placeholder.com/400x300/e3f2fd/1976d2?text=Aadhaar+Document'
        }
      }

      if (user.selfie_url) {
        const { data } = await supabase.storage
          .from('aadhaar')
          .createSignedUrl(user.selfie_url, 3600) // 1 hour expiry

        if (data?.signedUrl) {
          urls[`selfie_${user.id}`] = data.signedUrl
        } else {
          // Fallback to placeholder if URL generation fails
          urls[`selfie_${user.id}`] = 'https://via.placeholder.com/400x300/f3e5f5/7b1fa2?text=Selfie+Photo'
        }
      }

      setDocumentUrls(prev => ({ ...prev, ...urls }))
    } catch (error) {
      console.error('Error loading document URLs:', error)

      // Fallback to placeholders on error
      if (user.aadhaar_url) {
        urls[`aadhaar_${user.id}`] = 'https://via.placeholder.com/400x300/e3f2fd/1976d2?text=Aadhaar+Document'
      }
      if (user.selfie_url) {
        urls[`selfie_${user.id}`] = 'https://via.placeholder.com/400x300/f3e5f5/7b1fa2?text=Selfie+Photo'
      }

      setDocumentUrls(prev => ({ ...prev, ...urls }))
    }
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
          <h1 className="text-3xl font-bold text-gray-900">User & KYC Management</h1>
          <p className="mt-2 text-gray-600">
            Manage user registrations and KYC verification process.
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
                <Label htmlFor="search">Search Users</Label>
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
                <Label htmlFor="status">KYC Status</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | KycStatus)}
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              All registered users and their KYC status
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
                    <th className="text-left py-3 px-4">Referral Code</th>
                    <th className="text-left py-3 px-4">Joined</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            {user.aadhaar_name && (
                              <p className="text-xs text-gray-500">Aadhaar: {user.aadhaar_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{user.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${getStatusColor(user.kyc_status)}`}>
                          {user.kyc_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.referral_code ? (
                          <div className="flex items-center space-x-1">
                            <Hash className="h-3 w-3 text-gray-400" />
                            <span className="font-mono text-sm">{user.referral_code}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{formatDate(user.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openKYCDialog(user)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View KYC
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KYC Dialog */}
        <Dialog open={showKYCDialog} onOpenChange={setShowKYCDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>KYC Verification - {selectedUser?.full_name}</DialogTitle>
              <DialogDescription>
                Review and approve/reject KYC documents
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-sm text-gray-900">{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm text-gray-900">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <Label>Aadhaar Name</Label>
                    <p className="text-sm text-gray-900">{selectedUser.aadhaar_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Current Status</Label>
                    <span className={`status-badge ${getStatusColor(selectedUser.kyc_status)}`}>
                      {selectedUser.kyc_status}
                    </span>
                  </div>
                </div>

                {/* Documents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center mb-2">
                      <FileText className="h-4 w-4 mr-1" />
                      Aadhaar Document
                    </Label>
                    {selectedUser.aadhaar_url ? (
                      <div className="border rounded-lg p-2">
                        {documentUrls[`aadhaar_${selectedUser.id}`] ? (
                          <>
                            <Image
                              src={documentUrls[`aadhaar_${selectedUser.id}`]}
                              alt="Aadhaar Document"
                              width={300}
                              height={200}
                              className="w-full h-32 object-cover rounded"
                              onError={(e) => {
                                console.error('Failed to load Aadhaar image:', e)
                              }}
                              priority={false}
                              unoptimized={documentUrls[`aadhaar_${selectedUser.id}`]?.includes('placeholder')}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full"
                              onClick={() => window.open(documentUrls[`aadhaar_${selectedUser.id}`], '_blank')}
                            >
                              View Full Size
                            </Button>
                          </>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-gray-500">Loading document...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No document uploaded</p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="flex items-center mb-2">
                      <Camera className="h-4 w-4 mr-1" />
                      Selfie
                    </Label>
                    {selectedUser.selfie_url ? (
                      <div className="border rounded-lg p-2">
                        {documentUrls[`selfie_${selectedUser.id}`] ? (
                          <>
                            <Image
                              src={documentUrls[`selfie_${selectedUser.id}`]}
                              alt="Selfie"
                              width={300}
                              height={200}
                              className="w-full h-32 object-cover rounded"
                              onError={(e) => {
                                console.error('Failed to load selfie image:', e)
                              }}
                              priority={false}
                              unoptimized={documentUrls[`selfie_${selectedUser.id}`]?.includes('placeholder')}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full"
                              onClick={() => window.open(documentUrls[`selfie_${selectedUser.id}`], '_blank')}
                            >
                              View Full Size
                            </Button>
                          </>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-gray-500">Loading selfie...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No selfie uploaded</p>
                    )}
                  </div>
                </div>

                {/* Referral Code Input */}
                {selectedUser.kyc_status === 'pending' && (
                  <div>
                    <Label htmlFor="referralCode">Referral Code (for approval)</Label>
                    <Input
                      id="referralCode"
                      placeholder="Enter referral code from MyDukaan"
                      value={referralCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferralCode(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Actions */}
                {selectedUser.kyc_status === 'pending' && (
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={() => handleKYCAction('approve')}
                      disabled={processing || !referralCode.trim()}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Approve & Assign Code'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleKYCAction('reject')}
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