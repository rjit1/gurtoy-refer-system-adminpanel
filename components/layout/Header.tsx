'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, User, LogIn } from 'lucide-react'
import Button from '../ui/Button'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  const navItems = [
    { name: 'Home', href: '#hero' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Contact', href: '#contact' },
  ]

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="mobile-header-fix bg-white/95 backdrop-blur-md shadow-lg"
    >
      <div className="w-full max-w-7xl mx-auto overflow-hidden">
        <div className="flex items-center justify-between py-2 xs:py-3 px-3 xs:px-4 sm:px-6 lg:px-8 2xl:px-12 min-h-[60px] xs:min-h-[64px]">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center flex-shrink-0"
          >
            <Link href="/" className="flex items-center">
              <div className="relative w-24 h-7 xs:w-28 xs:h-8 sm:w-32 sm:h-9 md:w-36 md:h-10 lg:w-40 lg:h-11 xl:w-44 xl:h-12">
                <Image
                  src="/gurtoy-logo.png"
                  alt="Gurtoy - Referral Program"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, (max-width: 1024px) 140px, 160px"
                />
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.button
                key={item.name}
                onClick={() => scrollToSection(item.href.substring(1))}
                className="text-gray-800 hover:text-primary transition-colors duration-300 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.name}
              </motion.button>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" href="/login" size="sm">
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button href="/register" size="sm">
              <User className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={toggleMenu}
            whileTap={{ scale: 0.95 }}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 xs:w-6 xs:h-6 text-gray-800" />
            ) : (
              <Menu className="w-5 h-5 xs:w-6 xs:h-6 text-gray-800" />
            )}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="py-2 xs:py-3 px-3 xs:px-4 space-y-2 xs:space-y-3">
                {navItems.map((item) => (
                  <motion.button
                    key={item.name}
                    onClick={() => scrollToSection(item.href.substring(1))}
                    className="block w-full text-left py-2 text-gray-800 hover:text-primary transition-colors duration-300 font-medium"
                    whileHover={{ x: 10 }}
                  >
                    {item.name}
                  </motion.button>
                ))}
                <div className="pt-2 xs:pt-3 space-y-2">
                  <Button variant="outline" href="/login" className="w-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button href="/register" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}