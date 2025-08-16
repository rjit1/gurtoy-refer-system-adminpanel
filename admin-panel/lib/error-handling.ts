// Admin panel error handling utilities
import { PostgrestError } from '@supabase/supabase-js'

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export interface AdminError {
  type: ErrorType
  message: string
  userMessage: string
  code?: string
  details?: any
  timestamp: Date
  stack?: string
  context?: string
}

// Error classification for admin panel
export function classifyAdminError(error: any, context?: string): AdminError {
  const timestamp = new Date()
  
  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: error.message || 'Network error occurred',
      userMessage: 'Connection problem. Please check your internet and try again.',
      timestamp,
      stack: error.stack,
      context
    }
  }

  // Supabase/PostgreSQL errors
  if (error.code || error.hint || error.details) {
    const pgError = error as PostgrestError
    return classifyDatabaseError(pgError, timestamp, context)
  }

  // Admin authentication errors
  if (error.message?.includes('admin') || error.message?.includes('credentials')) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: error.message,
      userMessage: 'Admin authentication failed. Please check your credentials.',
      timestamp,
      stack: error.stack,
      context
    }
  }

  // Authorization errors
  if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
    return {
      type: ErrorType.AUTHORIZATION,
      message: error.message,
      userMessage: 'You do not have permission to perform this action.',
      timestamp,
      stack: error.stack,
      context
    }
  }

  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return {
      type: ErrorType.VALIDATION,
      message: error.message,
      userMessage: 'Please check your input and try again.',
      timestamp,
      stack: error.stack,
      context
    }
  }

  // Default unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'An unknown error occurred',
    userMessage: 'Something went wrong. Please try again.',
    timestamp,
    stack: error.stack,
    context
  }
}

function classifyDatabaseError(error: PostgrestError, timestamp: Date, context?: string): AdminError {
  const code = error.code
  const message = error.message || 'Database error occurred'

  // Common PostgreSQL error codes with admin-specific messages
  switch (code) {
    case '23505': // unique_violation
      return {
        type: ErrorType.DATABASE,
        message,
        userMessage: 'Duplicate entry detected. This record already exists.',
        code,
        timestamp,
        details: error.details,
        context
      }

    case '23503': // foreign_key_violation
      return {
        type: ErrorType.DATABASE,
        message,
        userMessage: 'Cannot delete/modify: record is referenced by other data.',
        code,
        timestamp,
        details: error.details,
        context
      }

    case '23514': // check_violation
      return {
        type: ErrorType.DATABASE,
        message,
        userMessage: 'Data validation failed. Please check the input values.',
        code,
        timestamp,
        details: error.details,
        context
      }

    case '42501': // insufficient_privilege
      return {
        type: ErrorType.AUTHORIZATION,
        message,
        userMessage: 'Insufficient database privileges for this operation.',
        code,
        timestamp,
        details: error.details,
        context
      }

    default:
      return {
        type: ErrorType.DATABASE,
        message,
        userMessage: 'Database operation failed. Please try again.',
        code,
        timestamp,
        details: error.details,
        context
      }
  }
}

// Admin error logging with enhanced details
export function logAdminError(error: AdminError) {
  const logData = {
    ...error,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    adminPanel: true
  }

  // Always log admin errors (they're important)
  console.error('Admin panel error:', logData)

  // In production, send to error tracking service with high priority
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: Send to error tracking service with admin context
      // sendToErrorTrackingService({ ...logData, priority: 'high' })
      console.error('Production admin error:', logData)
    } catch (loggingError) {
      console.error('Failed to log admin error:', loggingError)
    }
  }
}

// Admin operation wrapper with enhanced error handling
export async function handleAdminOperation<T>(
  operation: () => Promise<T>,
  context: string,
  showUserError: boolean = true
): Promise<{ data: T | null; error: AdminError | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const adminError = classifyAdminError(error, context)
    logAdminError(adminError)
    
    if (showUserError) {
      // You would integrate this with your notification system
      console.error('Admin operation failed:', adminError.userMessage)
    }
    
    return { data: null, error: adminError }
  }
}

// Database operation wrapper for admin panel
export async function handleAdminDatabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context: string
): Promise<{ data: T | null; error: AdminError | null }> {
  try {
    const result = await operation()
    
    if (result.error) {
      const adminError = classifyAdminError(result.error, context)
      logAdminError(adminError)
      return { data: null, error: adminError }
    }
    
    return { data: result.data, error: null }
  } catch (error) {
    const adminError = classifyAdminError(error, context)
    logAdminError(adminError)
    return { data: null, error: adminError }
  }
}

// Retry mechanism for admin operations
export async function withAdminRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      const adminError = classifyAdminError(error, context)
      
      // Don't retry authentication/authorization errors
      if (
        adminError.type === ErrorType.AUTHENTICATION ||
        adminError.type === ErrorType.AUTHORIZATION
      ) {
        logAdminError(adminError)
        throw error
      }

      if (attempt === maxRetries) {
        logAdminError({ ...adminError, context: `${context} - Failed after ${maxRetries} attempts` })
        throw error
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Admin-specific error recovery actions
export function getAdminErrorRecoveryActions(error: AdminError): string[] {
  switch (error.type) {
    case ErrorType.AUTHENTICATION:
      return [
        'Verify admin credentials',
        'Check if admin session has expired',
        'Try logging out and back in',
        'Contact system administrator'
      ]
    
    case ErrorType.AUTHORIZATION:
      return [
        'Verify admin permissions',
        'Check if you have the required role',
        'Contact system administrator',
        'Review access control settings'
      ]
    
    case ErrorType.DATABASE:
      return [
        'Check database connectivity',
        'Verify data integrity',
        'Review recent database changes',
        'Contact database administrator'
      ]
    
    case ErrorType.VALIDATION:
      return [
        'Review input data format',
        'Check required fields',
        'Verify data constraints',
        'Consult data validation rules'
      ]
    
    default:
      return [
        'Try refreshing the admin panel',
        'Check system status',
        'Review recent changes',
        'Contact technical support'
      ]
  }
}

// Admin error notification helper
export function notifyAdminError(error: AdminError, showToUser: boolean = true) {
  // Log for admin monitoring
  logAdminError(error)
  
  if (showToUser) {
    // This would integrate with your admin notification system
    console.error('Admin notification:', error.userMessage)
    
    // Example: Show admin toast notification
    // toast.error(error.userMessage, { duration: 5000 })
  }
}

// Critical error handler for admin operations
export function handleCriticalAdminError(error: any, operation: string) {
  const adminError = classifyAdminError(error, `CRITICAL: ${operation}`)
  
  // Always log critical errors
  logAdminError(adminError)
  
  // In production, this might trigger alerts
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL ADMIN ERROR:', {
      operation,
      error: adminError,
      timestamp: new Date().toISOString()
    })
    
    // Example: Send immediate alert to admin team
    // sendCriticalAlert(adminError, operation)
  }
  
  return adminError
}
