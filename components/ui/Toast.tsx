'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastStatus = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  title: string
  description?: string
  status: ToastStatus
  duration?: number
  isClosable?: boolean
}

interface ToastContextType {
  toast: (props: Omit<ToastProps, 'id'>) => void
  closeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context.toast
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prevToasts) => [...prevToasts, { id, ...props }])
  }

  const closeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast, closeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={() => closeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function Toast({
  id,
  title,
  description,
  status,
  duration = 5000,
  isClosable = true,
  onClose,
}: ToastProps & { onClose: () => void }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const statusStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
  }

  const { bg, border, icon } = statusStyles[status]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`${bg} border-l-4 ${border} p-4 rounded-md shadow-md max-w-md w-full`}
    >
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {isClosable && (
              <button
                onClick={onClose}
                className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}