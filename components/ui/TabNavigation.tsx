'use client'

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Wallet,
  Activity,
  ArrowDownToLine,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import type { DashboardTab } from '../../lib/supabase/types'

interface TabNavigationProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  className?: string
}

const tabs = [
  {
    id: 'dashboard' as DashboardTab,
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    description: 'Overview & stats'
  },
  {
    id: 'wallet' as DashboardTab,
    label: 'Wallet',
    shortLabel: 'Wallet',
    icon: Wallet,
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    description: 'Balance & earnings'
  },
  {
    id: 'referral-activity' as DashboardTab,
    label: 'Referral Activity',
    shortLabel: 'Activity',
    icon: Activity,
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    description: 'Track referrals'
  },
  {
    id: 'withdrawals' as DashboardTab,
    label: 'Withdrawals',
    shortLabel: 'Withdraw',
    icon: ArrowDownToLine,
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    description: 'Cash out earnings'
  },
  {
    id: 'notices' as DashboardTab,
    label: 'Notices',
    shortLabel: 'Notices',
    icon: Bell,
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    description: 'Important updates'
  },
]

export default function TabNavigation({
  activeTab,
  onTabChange,
  className = ''
}: TabNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollButtons)
      return () => container.removeEventListener('scroll', checkScrollButtons)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Desktop Tab Navigation */}
      <div className="hidden md:flex p-2 space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center space-x-4 px-6 py-4 rounded-lg font-medium transition-all duration-200 group
                ${isActive
                  ? 'text-white bg-gradient-to-r from-primary to-primary/80 shadow-lg'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary'}`} />
              <div className="flex flex-col items-start">
                <span className="whitespace-nowrap text-base font-semibold">{tab.label}</span>
                <span className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                  {tab.description}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Mobile Tab Navigation - Enhanced with scroll indicators */}
      <div className="md:hidden relative">
        {/* Scroll hint text */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            👆 Tap to switch • Swipe to see more tabs
          </p>
        </div>

        {/* Left scroll button */}
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg border border-gray-200"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </motion.button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg border border-gray-200"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </motion.button>
        )}

        {/* Scrollable tabs container */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-2 overflow-x-auto scrollbar-hide p-3 scroll-smooth"
          onScroll={checkScrollButtons}
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center space-y-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 min-w-[80px] group
                  ${isActive
                    ? 'text-white bg-gradient-to-br shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100'
                  }
                `}
                style={isActive ? {
                  background: tab.gradient
                } : {}}
                whileHover={{ scale: isActive ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/50 group-hover:bg-white/70'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold whitespace-nowrap">{tab.shortLabel}</span>
                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className="h-0.5 bg-white/50 rounded-full mt-1"
                    />
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Active tab indicator */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="text-center">
            <span className="text-sm font-medium text-gray-700">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}