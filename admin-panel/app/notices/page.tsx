'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase/client'
import { Notice, NoticeForm } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [form, setForm] = useState<NoticeForm>({
    title: '',
    content: '',
    is_active: true
  })

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices(data || [])
      console.log('Notices fetched:', data?.length || 0)
    } catch (error) {
      console.error('Error fetching notices:', error)
      setError('Failed to fetch notices')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.title.trim() || !form.content.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      if (selectedNotice) {
        // Update existing notice
        const { error } = await supabase
          .from('notices')
          .update({
            title: form.title.trim(),
            content: form.content.trim(),
            is_active: form.is_active
          })
          .eq('id', selectedNotice.id)

        if (error) throw error
        setSuccess('Notice updated successfully!')
      } else {
        // Create new notice
        const { error } = await supabase
          .from('notices')
          .insert({
            title: form.title.trim(),
            content: form.content.trim(),
            is_active: form.is_active
          })

        if (error) throw error
        setSuccess('Notice created successfully!')
      }

      // Reset form and close dialog
      setForm({ title: '', content: '', is_active: true })
      setShowCreateDialog(false)
      setShowEditDialog(false)
      setSelectedNotice(null)
      
      // Refresh notices
      await fetchNotices()
    } catch (err: any) {
      setError('Error saving notice: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleEdit = (notice: Notice) => {
    setSelectedNotice(notice)
    setForm({
      title: notice.title,
      content: notice.content,
      is_active: notice.is_active
    })
    setShowEditDialog(true)
  }

  const handleDelete = async (notice: Notice) => {
    if (!confirm('Are you sure you want to delete this notice?')) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', notice.id)

      if (error) throw error
      
      setSuccess('Notice deleted successfully!')
      await fetchNotices()
    } catch (err: any) {
      setError('Error deleting notice: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const toggleNoticeStatus = async (notice: Notice) => {
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !notice.is_active })
        .eq('id', notice.id)

      if (error) throw error
      
      setSuccess(`Notice ${!notice.is_active ? 'activated' : 'deactivated'} successfully!`)
      await fetchNotices()
    } catch (err: any) {
      setError('Error updating notice status: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const openCreateDialog = () => {
    setForm({ title: '', content: '', is_active: true })
    setSelectedNotice(null)
    setShowCreateDialog(true)
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Notices</h1>
            <p className="mt-2 text-gray-600">
              Create and manage system-wide notices for users.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Notice
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notices</CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notices.length}</div>
              <p className="text-xs text-gray-500">All notices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Notices</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notices.filter(n => n.is_active).length}
              </div>
              <p className="text-xs text-gray-500">Visible to users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Notices</CardTitle>
              <EyeOff className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notices.filter(n => !n.is_active).length}
              </div>
              <p className="text-xs text-gray-500">Hidden from users</p>
            </CardContent>
          </Card>
        </div>

        {/* Notices List */}
        <Card>
          <CardHeader>
            <CardTitle>All Notices</CardTitle>
            <CardDescription>
              Manage system notices and announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`p-4 border rounded-lg ${
                    notice.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notice.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notice.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {notice.is_active ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{notice.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {formatDate(notice.created_at)}</span>
                        </div>
                        {notice.updated_at !== notice.created_at && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Updated: {formatDate(notice.updated_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleNoticeStatus(notice)}
                        disabled={processing}
                      >
                        {notice.is_active ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Show
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(notice)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(notice)}
                        disabled={processing}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {notices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No notices found. Create your first notice to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setShowEditDialog(false)
            setSelectedNotice(null)
            setForm({ title: '', content: '', is_active: true })
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedNotice ? 'Edit Notice' : 'Create New Notice'}
              </DialogTitle>
              <DialogDescription>
                {selectedNotice 
                  ? 'Update the notice details below'
                  : 'Create a new notice that will be visible to all users'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter notice title"
                  value={form.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setForm(prev => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <textarea
                  id="content"
                  placeholder="Enter notice content"
                  value={form.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setForm(prev => ({ ...prev, content: e.target.value }))
                  }
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setForm(prev => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="is_active">Make this notice active (visible to users)</Label>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="submit" disabled={processing} className="flex-1">
                  {processing ? 'Saving...' : (selectedNotice ? 'Update Notice' : 'Create Notice')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false)
                    setShowEditDialog(false)
                    setSelectedNotice(null)
                    setForm({ title: '', content: '', is_active: true })
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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