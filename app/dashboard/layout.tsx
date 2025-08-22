'use client'

import { ReactNode } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'

export default function DashboardRootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
}