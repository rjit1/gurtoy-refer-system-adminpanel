'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Calendar, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Megaphone,
  Clock,
  Eye
} from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
import type { Notice } from '../../lib/supabase/types'

interface NoticesTabProps {
  kycStatus: string
}

export default function NoticesTab({ kycStatus }: NoticesTabProps) {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotices(data || [])
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only show notices if KYC is approved
    if (kycStatus === 'approved') {
      fetchNotices()
    } else {
      setLoading(false)
    }
  }, [kycStatus, fetchNotices])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      }) + ' today'
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }
  }

  const getNoticeIcon = (title: string) => {
    const titleLower = title.toLowerCase()
    
    if (titleLower.includes('maintenance') || titleLower.includes('update')) {
      return AlertTriangle
    } else if (titleLower.includes('new') || titleLower.includes('launch')) {
      return CheckCircle
    } else if (titleLower.includes('important') || titleLower.includes('urgent')) {
      return Megaphone
    } else {
      return Info
    }
  }

  const getNoticeColor = (title: string) => {
    const titleLower = title.toLowerCase()
    
    if (titleLower.includes('maintenance') || titleLower.includes('urgent')) {
      return 'text-warning bg-warning/10 border-warning/20'
    } else if (titleLower.includes('new') || titleLower.includes('launch')) {
      return 'text-success bg-success/10 border-success/20'
    } else if (titleLower.includes('important')) {
      return 'text-error bg-error/10 border-error/20'
    } else {
      return 'text-info bg-info/10 border-info/20'
    }
  }

  // If KYC is not approved, show access restriction message
  if (kycStatus !== 'approved') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Notices Access Restricted
          </h2>
          <p className="text-gray-600 mb-4">
            Complete your KYC verification to access system announcements and important notices.
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            kycStatus === 'pending' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <Clock className="w-4 h-4 mr-2" />
            KYC Status: {kycStatus}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">System Notices</h1>
            <p className="text-primary-100 opacity-90">
              Stay updated with important announcements and system updates
            </p>
          </div>
        </div>
      </motion.div>

      {/* Notices List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Announcements</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{notices.length} notices</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Bell className="w-8 h-8 mb-2 opacity-50" />
            <p>No notices available</p>
            <p className="text-sm">Check back later for updates</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notices.map((notice, index) => {
              const Icon = getNoticeIcon(notice.title)
              const colorClass = getNoticeColor(notice.title)
              
              return (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl border ${colorClass} flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {notice.title}
                          </h3>
                          <div className="prose prose-sm max-w-none text-gray-700">
                            {notice.content.split('\n').map((paragraph, idx) => (
                              <p key={idx} className="mb-2 last:mb-0">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Published {formatDate(notice.created_at)}</span>
                        </div>
                        
                        {/* Priority Badge */}
                        {notice.title.toLowerCase().includes('important') && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Important
                          </div>
                        )}
                        {notice.title.toLowerCase().includes('new') && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            New
                          </div>
                        )}
                        {notice.title.toLowerCase().includes('maintenance') && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Maintenance
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Sample Notices for Demo */}
      {notices.length === 0 && !loading && kycStatus === 'approved' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sample Notices</h2>
            <p className="text-sm text-gray-600 mt-1">
              Here&apos;s what notices will look like when published by admin
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Sample Notice 1 */}
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl border text-success bg-success/10 border-success/20 flex-shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    New Commission Structure Launched
                  </h3>
                  <div className="text-gray-700 mb-4">
                    <p>We&apos;re excited to announce our enhanced commission structure! Starting today, you can earn up to 5% commission on all referral sales.</p>
                    <p className="mt-2">Key benefits include faster payouts, lower minimum withdrawal limits, and bonus incentives for top performers.</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Published 2 days ago</span>
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      New
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Notice 2 */}
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl border text-warning bg-warning/10 border-warning/20 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Scheduled Maintenance - January 15th
                  </h3>
                  <div className="text-gray-700 mb-4">
                    <p>We&apos;ll be performing scheduled maintenance on January 15th from 2:00 AM to 4:00 AM IST to improve system performance.</p>
                    <p className="mt-2">During this time, the dashboard may be temporarily unavailable. All data will be preserved and no action is required from your end.</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Published 1 week ago</span>
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Maintenance
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}