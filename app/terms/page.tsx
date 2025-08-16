'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <Link href="/" className="flex items-center space-x-2 text-primary hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-xl font-bold text-gradient">Gurtoy</span>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Terms of Service
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceptance of Terms</h2>
                  <p className="text-gray-600 mb-4">
                    By accessing and using Gurtoy&apos;s referral program, you accept and agree to be bound by 
                    the terms and provision of this agreement.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Referral Program Rules</h2>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>You must complete KYC verification to participate</li>
                    <li>Commission rate is 5% on confirmed sales</li>
                    <li>Minimum withdrawal amount is ₹500</li>
                    <li>Fraudulent activities will result in account termination</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
                  <p className="text-gray-600">
                    For questions about these Terms of Service, contact us at{' '}
                    <a href="mailto:thegurtoy@gmail.com" className="text-primary hover:underline">
                      thegurtoy@gmail.com
                    </a>
                  </p>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}