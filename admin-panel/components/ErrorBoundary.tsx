'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Shield } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin ErrorBoundary caught an error:', error, errorInfo)
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.setState({
      error,
      errorInfo
    })

    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        context: 'admin-panel'
      }

      console.error('Admin panel error logged:', errorData)
    } catch (loggingError) {
      console.error('Failed to log admin panel error:', loggingError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoToDashboard = () => {
    window.location.href = '/dashboard'
  }

  private handleGoToLogin = () => {
    window.location.href = '/login'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Panel Error
              </h1>
              <p className="text-gray-600">
                An unexpected error occurred in the admin panel. The error has been logged for investigation.
              </p>
            </div>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <div className="flex items-center mb-2">
                  <Bug className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Debug Info:</span>
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        View Stack Trace
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload
                </Button>
                
                <Button
                  onClick={this.handleGoToDashboard}
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </div>

              <Button
                onClick={this.handleGoToLogin}
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>

            {/* Support info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Error ID: {Date.now().toString(36)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Please include this ID when reporting the issue.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AdminErrorBoundary

// Higher-order component for admin components
export function withAdminErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <AdminErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AdminErrorBoundary>
  )

  WrappedComponent.displayName = `withAdminErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for admin error reporting
export function useAdminErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Admin manual error report:', error, errorInfo)
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const errorData = {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          context: 'admin-panel',
          ...errorInfo
        }
        console.error('Admin error reported:', errorData)
      } catch (loggingError) {
        console.error('Failed to report admin error:', loggingError)
      }
    }
  }
}
