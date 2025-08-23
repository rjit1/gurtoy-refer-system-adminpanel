'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [animationData, setAnimationData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load the Lottie animation
    const loadAnimation = async () => {
      try {
        const response = await fetch('/animations/boy-running.json')
        if (!response.ok) {
          throw new Error('Failed to load animation')
        }
        const data = await response.json()
        setAnimationData(data)
      } catch (error) {
        console.error('Error loading animation:', error)
        // Continue without animation if loading fails
      } finally {
        setIsLoading(false)
      }
    }

    loadAnimation()
  }, [])

  useEffect(() => {
    // Reduced time to 1.5 seconds for better performance
    const timer = setTimeout(() => {
      onComplete()
    }, 1500)

    return () => clearTimeout(timer)
  }, [onComplete])

  const handleAnimationComplete = () => {
    // Optional: Complete splash screen when animation finishes
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-blue-500 to-accent"
      >
        <div className="text-center px-4">
          {/* Lottie Animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 sm:mb-8"
          >
            {!isLoading && animationData ? (
              <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 flex items-center justify-center mx-auto">
                <Lottie
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full max-w-[207px] max-h-[207px] sm:max-w-[242px] sm:max-h-[242px] md:max-w-[259px] md:max-h-[259px] lg:max-w-[311px] lg:max-h-[311px] xl:max-w-[360px] xl:max-h-[360px]"
                  onComplete={handleAnimationComplete}
                />
              </div>
            ) : (
              <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 bg-white/20 rounded-full animate-pulse flex items-center justify-center mx-auto">
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 xl:w-48 xl:h-48 bg-white/30 rounded-full animate-bounce"></div>
              </div>
            )}
          </motion.div>

          {/* Brand Name */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-4 sm:mb-6"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2" style={{ fontSize: 'clamp(1.875rem, 5vw, 4rem)' }}>
              Gurtoy
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-medium">
              Referral Program
            </p>
          </motion.div>

          {/* Loading Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="flex items-center justify-center space-x-2"
          >
            <div className="flex space-x-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-white rounded-full"
              />
            </div>
          </motion.div>

          {/* Skip Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2 }}
            onClick={onComplete}
            className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 hover:text-white transition-colors duration-300 text-sm sm:text-base font-medium px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Skip →
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}