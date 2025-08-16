'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react'
import Button from './Button'
import type { KycStatus } from '../../lib/supabase/types'

interface KYCBannerProps {
  kycStatus: KycStatus
  hasKycFiles: boolean
  className?: string
}

export default function KYCBanner({ 
  kycStatus, 
  hasKycFiles, 
  className = '' 
}: KYCBannerProps) {
  // Don't show banner if KYC is approved
  if (kycStatus === 'approved') {
    return null
  }

  const getBannerConfig = () => {
    if (kycStatus === 'rejected') {
      return {
        icon: AlertCircle,
        title: 'KYC Verification Rejected',
        message: 'Your documents were rejected. Please re-submit your KYC with clear documents.',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900',
        messageColor: 'text-red-800',
        iconColor: 'text-red-600',
        buttonText: 'Re-submit KYC',
        buttonHref: '/kyc'
      }
    }

    if (kycStatus === 'pending' && hasKycFiles) {
      return {
        icon: Clock,
        title: 'KYC Under Review',
        message: 'Your documents are under review. Please wait for approval.',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        messageColor: 'text-blue-800',
        iconColor: 'text-blue-600',
        buttonText: null,
        buttonHref: null
      }
    }

    // Default: pending without files
    return {
      icon: FileText,
      title: 'Complete KYC Verification',
      message: 'Complete your KYC verification to unlock referral code & wallet access.',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-900',
      messageColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      buttonText: 'Start Verification',
      buttonHref: '/kyc'
    }
  }

  const config = getBannerConfig()
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg bg-white/50 ${config.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${config.textColor}`}>
              {config.title}
            </h3>
            <p className={`text-sm mt-1 ${config.messageColor}`}>
              {config.message}
            </p>
            
            {/* Additional info for pending status */}
            {kycStatus === 'pending' && hasKycFiles && (
              <div className="mt-3 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-xs text-blue-700">Processing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {config.buttonText && config.buttonHref && (
          <div className="flex-shrink-0 ml-4">
            <Button 
              href={config.buttonHref} 
              size="sm"
              variant={kycStatus === 'rejected' ? 'secondary' : 'primary'}
            >
              {config.buttonText}
            </Button>
          </div>
        )}
      </div>

      {/* Progress indicator for pending with files */}
      {kycStatus === 'pending' && hasKycFiles && (
        <div className="mt-4 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span>Documents submitted</span>
            <span>Estimated review time: 24-48 hours</span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-blue-500 h-1.5 rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}