'use client'

import { ReactNode } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import AdminLayout from '@/components/layout/AdminLayout'

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthGuard requireAdmin={true}>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AuthGuard>
  )
}