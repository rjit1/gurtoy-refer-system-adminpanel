import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import { ToastProvider } from '../components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Gurtoy - Earn Commission by Referring Friends',
  description: 'Join Gurtoy\'s referral program and earn 5% commission on every sale made using your referral code. Easy setup, full transparency, and withdraw anytime.',
  keywords: 'referral program, earn commission, Gurtoy, refer friends, make money online',
  authors: [{ name: 'Gurtoy Team' }],
  openGraph: {
    title: 'Gurtoy - Earn Commission by Referring Friends',
    description: 'Join Gurtoy\'s referral program and earn 5% commission on every sale made using your referral code.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gurtoy - Earn Commission by Referring Friends',
    description: 'Join Gurtoy\'s referral program and earn 5% commission on every sale made using your referral code.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}