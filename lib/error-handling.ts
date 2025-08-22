// Comprehensive error handling utilities
import { PostgrestError } from '@supabase/supabase-js'

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  FILE_UPLOAD = 'FILE_UPLOAD',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
  // Application-specific error types
  WALLET = 'WALLET',
  WITHDRAWAL = 'WITHDRAWAL',
  KYC = 'KYC',
  REFERRAL = 'REFERRAL',
  ORDER = 'ORDER'
}

export interface AppError {
  type: ErrorType
  message: string
  userMessage: string
  code?: string
  details?: any
  timestamp: Date
  stack?: string
}

// Error classification
export function classifyError(error: any): AppError {
  const timestamp = new Date()
  
  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: error.message || 'Network error occurred',
      userMessage: 'Connection problem. Please check your internet and try again.',
      timestamp,
      stack: error.stack
    }
  }

  // Supabase/PostgreSQL errors
  if (error.code || error.hint || error.details) {
    const pgError = error as PostgrestError
    return classifyDatabaseError(pgError, timestamp)
  }

  // Authentication errors
  if (error.message?.includes('auth') || error.message?.includes('session')) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: error.message,
      userMessage: 'Please log in again to continue.',
      timestamp,
      stack: error.stack
    }
  }

  // File upload errors
  if (error.message?.includes('file') || error.message?.includes('upload')) {
    return {
      type: ErrorType.FILE_UPLOAD,
      message: error.message,
      userMessage: 'File upload failed. Please try again with a different file.',
      timestamp,
      stack: error.stack
    }
  }

  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return {
      type: ErrorType.VALIDATION,
      message: error.message,
      userMessage: 'Please check your input and try again.',
      timestamp,
      stack: error.stack
    }
  }

  // Application-specific errors
  if (error.message?.includes('wallet') || error.context === 'wallet') {
    return {
      type: ErrorType.WALLET,
      message: error.message || 'Wallet operation failed',
      userMessage: 'Unable to process wallet operation. Please try again.',
      timestamp,
      stack: error.stack
    }
  }

  if (error.message?.includes('withdrawal') || error.context === 'withdrawal') {
    return {
      type: ErrorType.WITHDRAWAL,
      message: error.message || 'Withdrawal operation failed',
      userMessage: 'Unable to process withdrawal. Please try again later.',
      timestamp,
      stack: error.stack
    }
  }

  if (error.message?.includes('kyc') || error.context === 'kyc') {
    return {
      type: ErrorType.KYC,
      message: error.message || 'KYC verification failed',
      userMessage: 'Unable to verify your documents. Please check and try again.',
      timestamp,
      stack: error.stack
    }
  }

  if (error.message?.includes('referral') || error.context === 'referral') {
    return {
      type: ErrorType.REFERRAL,
      message: error.message || 'Referral operation failed',
      userMessage: 'Unable to process referral. Please try again.',
      timestamp,
      stack: error.stack
    }
  }

  if (error.message?.includes('order') || error.context === 'order') {
    return {
      type: ErrorType.ORDER,
      message: error.message || 'Order operation failed',
      userMessage: 'Unable to process order. Please try again.',
      timestamp,
      stack: error.stack
    }
  }

  // Default unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'An unknown error occurred',
    userMessage: 'Something went wrong. Please try again.',
    timestamp,
    stack: error.stack
  }
}

function classifyDatabaseError(error: PostgrestError, timestamp: Date): AppError {
  const code = error.code
  const message = error.message || 'Database error occurred'

  // Common PostgreSQL error codes
  switch (code) {
    case '23505': // unique_violation
      return {
        type: ErrorType.DATABASE,
        message,
        userMessage: 'This information already exists. Please use different details.',
        code,
        timestamp,
        details: error.details
      }

    case '23503': // foreign_key_violation
      return {
        type: ErrorType.DATABASE,
        message,
        userMessage: 'Invalid reference. Please check your data.',
        code,
        timestamp,
        details: error.details
      }

    case '23514': // check_violation
      return {
        type: ErrorType.DATABASE,
        message,
        userMessage: 'Invalid data format. Please check your input.',
        code,
        timestamp,
        details: error.details
      }

    case '42501': // insufficient_privilege
      return {
        type: ErrorType.AUTHORIZATION,
        message,
        userMessage: 'You do not have permission to perform this action.',
        code,
        timestamp,
        details: error.details
      }

    case '08006': // connection_failure
    case '08001': // sqlclient_unable_to_establish_sqlconnection
      return {
        type: ErrorType.NETWORK,
        message,
        userMessage: 'Database connection failed. Please try again.',
        code,
        timestamp,
        details: error.details
      }

    default:
      return {
        type: ErrorType.DATABASE,
        message,
        userMessage: 'Database error occurred. Please try again.',
        code,
        timestamp,
        details: error.details
      }
  }
}

// Error logging
export function logError(error: AppError, context?: string) {
  const logData = {
    ...error,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', logData)
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: Send to error tracking service
      // sendToErrorTrackingService(logData)
      console.error('Production error:', logData)
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }
}

// Retry mechanism
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      const appError = classifyError(error)
      
      // Don't retry certain error types
      if (
        appError.type === ErrorType.AUTHENTICATION ||
        appError.type === ErrorType.AUTHORIZATION ||
        appError.type === ErrorType.VALIDATION
      ) {
        throw error
      }

      if (attempt === maxRetries) {
        logError(appError, `Failed after ${maxRetries} attempts`)
        throw error
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}

// Error boundary hook for functional components
export function useErrorHandler() {
  return (error: any, context?: string) => {
    const appError = classifyError(error)
    logError(appError, context)
    return appError
  }
}

// Toast notification helper
export function showErrorToast(error: AppError) {
  // This would integrate with your toast notification system
  // For now, just log to console
  console.error('Toast error:', error.userMessage)
  
  // Example integration with react-hot-toast:
  // toast.error(error.userMessage)
}

// Form error helper
export function getFormErrorMessage(error: any, field?: string): string {
  const appError = classifyError(error)
  
  if (field && appError.details) {
    // Try to extract field-specific error
    const fieldError = appError.details[field]
    if (fieldError) {
      return fieldError
    }
  }
  
  return appError.userMessage
}

// API error wrapper
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await apiCall()
    return { data, error: null }
  } catch (error) {
    const appError = classifyError(error)
    logError(appError, context)
    return { data: null, error: appError }
  }
}

// Database operation wrapper
export async function handleDatabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context?: string
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const result = await operation()
    
    if (result.error) {
      const appError = classifyError(result.error)
      logError(appError, context)
      return { data: null, error: appError }
    }
    
    return { data: result.data, error: null }
  } catch (error) {
    const appError = classifyError(error)
    logError(appError, context)
    return { data: null, error: appError }
  }
}

// Error recovery suggestions
export function getErrorRecoveryActions(error: AppError): string[] {
  switch (error.type) {
    case ErrorType.NETWORK:
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ]
    
    case ErrorType.AUTHENTICATION:
      return [
        'Log out and log back in',
        'Clear your browser cache',
        'Check if your session has expired'
      ]
    
    case ErrorType.VALIDATION:
      return [
        'Check all required fields are filled',
        'Verify the format of your input',
        'Make sure all data is valid'
      ]
    
    case ErrorType.FILE_UPLOAD:
      return [
        'Check file size (must be under 5MB)',
        'Verify file format is supported',
        'Try uploading a different file'
      ]
    
    case ErrorType.WALLET:
      return [
        'Check your wallet balance',
        'Verify your bank details are correct',
        'Try the operation again after a few minutes'
      ]
    
    case ErrorType.WITHDRAWAL:
      return [
        'Verify you have sufficient balance',
        'Check your bank details are correct',
        'Make sure you meet the minimum withdrawal amount'
      ]
    
    case ErrorType.KYC:
      return [
        'Ensure your documents are clear and readable',
        'Verify you uploaded the correct document types',
        'Make sure your selfie matches your ID document'
      ]
    
    case ErrorType.REFERRAL:
      return [
        'Check if the referral code is valid',
        'Verify your KYC is approved',
        'Contact support for assistance with referrals'
      ]
    
    case ErrorType.ORDER:
      return [
        'Check if the order details are correct',
        'Verify the product is available',
        'Try placing the order again'
      ]
    
    default:
      return [
        'Try refreshing the page',
        'Wait a moment and try again',
        'Contact support if the problem persists'
      ]
  }
}
