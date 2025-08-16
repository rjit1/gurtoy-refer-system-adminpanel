"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Camera,
  ArrowLeft,
  Shield,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import Button from '../../components/ui/Button'
import { supabase } from '../../lib/supabase/client'
import type { Profile } from '../../lib/supabase/types'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    aadhaar_name: ''
  })

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setEditForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        aadhaar_name: data.aadhaar_name || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSave = async () => {
    if (!profile) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          aadhaar_name: editForm.aadhaar_name
        })
        .eq('id', profile.id)

      if (error) throw error

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        full_name: editForm.full_name,
        phone: editForm.phone,
        aadhaar_name: editForm.aadhaar_name
      } : null)

      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        aadhaar_name: profile.aadhaar_name || ''
      })
    }
    setEditing(false)
  }

  const getKycStatusConfig = () => {
    switch (profile?.kyc_status) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-success bg-success/10 border-success/20',
          label: 'Verified'
        }
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-error bg-error/10 border-error/20',
          label: 'Rejected'
        }
      default:
        return {
          icon: Clock,
          color: 'text-warning bg-warning/10 border-warning/20',
          label: 'Pending'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-light via-white to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-light via-white to-blue-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const kycConfig = getKycStatusConfig()
  const KycIcon = kycConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-500">Manage your account information</p>
              </div>
            </div>

            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              {/* Profile Image */}
              <div className="relative inline-block mb-4">
                {profile.profile_image ? (
                  <Image
                    src={profile.profile_image}
                    alt={profile.full_name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {profile.full_name}
              </h2>

              {/* KYC Status */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${kycConfig.color} mb-4`}>
                <KycIcon className="w-4 h-4 mr-2" />
                KYC {kycConfig.label}
              </div>

              {/* Member Since */}
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                Member since {formatDate(profile.created_at)}
              </div>
            </div>
          </motion.div>

          {/* Profile Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
                {editing && (
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profile.full_name}</span>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profile.phone}</span>
                    </div>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{profile.id}</span>
                    <span className="text-xs text-gray-500 ml-auto">Cannot be changed</span>
                  </div>
                </div>

                {/* Aadhaar Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name as per Aadhaar Card
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.aadhaar_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, aadhaar_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter name as per Aadhaar card"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profile.aadhaar_name || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* Referral Code (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Code
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 font-mono">
                      {profile.referral_code || 'Not assigned yet'}
                    </span>
                    {profile.referral_code && (
                      <span className="text-xs text-gray-500 ml-auto">Assigned by admin</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* KYC Documents Section */}
        {(profile.aadhaar_url || profile.selfie_url) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                KYC Documents
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.aadhaar_url && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Aadhaar Card
                    </h4>
                    <div className="border border-gray-200 rounded-xl p-4 text-center">
                      <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Document uploaded</p>
                      <p className="text-xs text-gray-500 mt-1">
                        For security, documents are not displayed
                      </p>
                    </div>
                  </div>
                )}

                {profile.selfie_url && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Selfie Verification
                    </h4>
                    <div className="border border-gray-200 rounded-xl p-4 text-center">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Selfie uploaded</p>
                      <p className="text-xs text-gray-500 mt-1">
                        For security, photos are not displayed
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}