import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AdminErrorBoundary from '../components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GurToy Admin Panel',
  description: 'Admin panel for GurToy referral system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminErrorBoundary>
          {children}
        </AdminErrorBoundary>
      </body>
    </html>
  )
}