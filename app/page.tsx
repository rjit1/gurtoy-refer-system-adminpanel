'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  UserCheck, 
  Code, 
  Share2, 
  DollarSign, 
  Shield, 
  Zap, 
  Eye, 
  Wallet,
  Star,
  MapPin,
  Mail,
  CheckCircle
} from 'lucide-react'
import Image from 'next/image'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import SplashScreen from '../components/SplashScreen'

// Add React.memo to prevent unnecessary re-renders
import { memo } from 'react'

const LandingPage = memo(function LandingPage() {
  // Start with splash hidden for better initial load performance
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // Check if splash screen has been shown before in this session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash')
    if (!hasSeenSplash) {
      // Only show splash if it hasn't been seen before
      setShowSplash(true)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem('hasSeenSplash', 'true')
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const steps = [
    {
      icon: UserCheck,
      title: 'Register with KYC',
      description: 'Complete your profile with required documents for verification'
    },
    {
      icon: Code,
      title: 'Get Your Referral Code',
      description: 'Receive your unique referral code after approval'
    },
    {
      icon: Share2,
      title: 'Share Your Code',
      description: 'Share your code with friends and family'
    },
    {
      icon: DollarSign,
      title: 'Earn on Every Order',
      description: 'Get 5% commission on every confirmed purchase'
    }
  ]

  const benefits = [
    {
      icon: Zap,
      title: 'Easy Setup',
      description: 'Quick registration process with simple KYC verification'
    },
    {
      icon: DollarSign,
      title: '5% Commission',
      description: 'Earn 5% commission on every sale made through your referral'
    },
    {
      icon: Eye,
      title: 'Full Transparency',
      description: 'Track all your referrals and earnings in real-time'
    },
    {
      icon: Wallet,
      title: 'Withdraw Anytime',
      description: 'Minimum withdrawal of ₹500 with quick processing'
    }
  ]

  const achievements = [
    {
      icon: Star,
      number: '17,000+',
      title: 'Google Reviews',
      subtitle: '5-Star Rating',
      description: 'Trusted by thousands of satisfied customers across India',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Share2,
      number: '850K+',
      title: 'Instagram Followers',
      subtitle: 'Social Media Presence',
      description: 'Join our vibrant community of toy enthusiasts and parents',
      color: 'from-pink-500 to-purple-600'
    },
    {
      icon: MapPin,
      number: '#1',
      title: 'Toy Store in Ludhiana',
      subtitle: 'Local Market Leader',
      description: 'The most trusted name for quality toys in Punjab',
      color: 'from-green-500 to-emerald-600'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Add priority to Header for faster rendering */}
      <Header />
      
      {/* Hero Section - Optimized for performance */}
      <section id="hero" className="pt-20 xs:pt-24 sm:pt-28 lg:pt-32 pb-12 xs:pb-16 sm:pb-20 lg:pb-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
        <div className="container-max">
          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 2xl:gap-20 items-center" style={{minHeight: "60vh"}}>
            <motion.div
              initial={{ opacity: 0.8, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, easings: ["easeOut"] }}
              className="w-full text-center lg:text-left lg:order-1 py-8 xs:py-12 sm:py-0"
            >
              {/* Simplified animation for better performance */}
              <h1 className="responsive-text-hero font-bold text-gray-800 mb-4 xs:mb-6 sm:mb-8 lg:mb-10 leading-tight animate-fade-in" style={{ fontSize: 'clamp(1.5rem, 5vw, 4rem)' }}>
                Earn Commission by{' '}
                <span className="text-gradient block sm:inline">Referring Friends</span>
              </h1>
              
              {/* Preload critical LCP element with key attribute for priority rendering */}
              <p key="hero-description" className="responsive-text-body text-gray-600 mb-6 xs:mb-8 sm:mb-10 lg:mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0" style={{ willChange: 'auto' }}>
                Join Gurtoy&apos;s referral program and earn 5% commission on every sale made using your referral code. 
                Start earning today with our transparent and reliable platform.
              </p>
              
              <motion.div 
                className="flex flex-col xs:flex-row gap-3 xs:gap-4 sm:gap-6 lg:gap-8 justify-center lg:justify-start mb-8 xs:mb-10 sm:mb-12 lg:mb-16"
                initial={{ opacity: 0.8, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Button href="/register" size="lg" className="group w-full xs:w-auto">
                  Become a Referrer
                  <ArrowRight className="w-4 h-4 xs:w-5 xs:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full xs:w-auto"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn How It Works
                </Button>
              </motion.div>

              <motion.div 
                className="grid grid-cols-3 gap-4 xs:gap-6 sm:gap-8 lg:gap-10 max-w-md xs:max-w-lg mx-auto lg:mx-0"
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div className="text-center">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-primary">5%</div>
                  <div className="text-xs xs:text-sm sm:text-base text-gray-600">Commission Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-accent">₹500</div>
                  <div className="text-xs xs:text-sm sm:text-base text-gray-600">Min. Withdrawal</div>
                </div>
                <div className="text-center">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-primary">24/7</div>
                  <div className="text-xs xs:text-sm sm:text-base text-gray-600">Support</div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0.8, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, easings: ["easeOut"] }}
              className="w-full lg:order-2 relative hidden sm:block"
            >
              <div className="relative w-full h-48 xs:h-56 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px]">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl xs:rounded-2xl transform rotate-1 xs:rotate-2 sm:rotate-3"></div>
                <div className="relative bg-white rounded-xl xs:rounded-2xl shadow-xl xs:shadow-2xl p-3 xs:p-4 sm:p-6 lg:p-8 h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 xl:w-40 xl:h-40 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mb-3 xs:mb-4 sm:mb-6 flex items-center justify-center">
                      <DollarSign className="w-8 h-8 xs:w-10 xs:h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 text-white" />
                    </div>
                    <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">Start Earning Today</h3>
                    <p className="text-base lg:text-lg text-gray-600">Join thousands of successful referrers</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section-padding bg-white">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 xs:mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="responsive-text-heading font-bold text-gray-800 mb-3 xs:mb-4 sm:mb-6">
              How It Works
            </h2>
            <p className="responsive-text-body text-gray-600 max-w-3xl mx-auto leading-relaxed px-2 xs:px-0">
              Get started in 4 simple steps and begin earning commission on every referral
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="responsive-grid-4"
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="card text-center group hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              >
                <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mb-3 xs:mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 xs:-top-2 xs:-right-2 sm:-top-3 sm:-right-3 w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 bg-accent text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg">
                  {index + 1}
                </div>
                <h3 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-2 xs:mb-2 sm:mb-3">
                  {step.title}
                </h3>
                <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="section-padding bg-gray-50">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 xs:mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="responsive-text-heading font-bold text-gray-800 mb-3 xs:mb-4 sm:mb-6">
              Why Choose Gurtoy?
            </h2>
            <p className="responsive-text-body text-gray-600 max-w-3xl mx-auto leading-relaxed px-2 xs:px-0">
              Join thousands of satisfied referrers who trust Gurtoy for reliable earnings
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="responsive-grid-4 mb-8 xs:mb-12 sm:mb-16"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="card text-center group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mb-3 xs:mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" />
                </div>
                <h3 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-2 xs:mb-2 sm:mb-3">
                  {benefit.title}
                </h3>
                <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button href="/register" size="lg" className="group w-full xs:w-auto">
              Start Earning Now
              <ArrowRight className="w-4 h-4 xs:w-5 xs:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 xs:mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="responsive-text-heading font-bold text-gray-800 mb-3 xs:mb-4 sm:mb-6">
              Why Trust Gurtoy?
            </h2>
            <p className="responsive-text-body text-gray-600 max-w-3xl mx-auto leading-relaxed px-2 xs:px-0">
              Our proven track record speaks for itself - join thousands who already trust us
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="responsive-grid-3"
          >
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="card hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 text-center group relative overflow-hidden"
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${achievement.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`}></div>
                
                {/* Icon with gradient background */}
                <div className={`w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r ${achievement.color} rounded-full mx-auto mb-4 xs:mb-5 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <achievement.icon className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>

                {/* Achievement number */}
                <div className={`text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${achievement.color} bg-clip-text text-transparent mb-2 xs:mb-3 sm:mb-4`}>
                  {achievement.number}
                </div>

                {/* Title and subtitle */}
                <h3 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 xs:mb-2">
                  {achievement.title}
                </h3>
                <div className={`text-sm xs:text-base sm:text-lg font-semibold bg-gradient-to-r ${achievement.color} bg-clip-text text-transparent mb-3 xs:mb-4 sm:mb-5`}>
                  {achievement.subtitle}
                </div>

                {/* Description */}
                <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed">
                  {achievement.description}
                </p>

                {/* Decorative element */}
                <div className={`absolute -bottom-2 -right-2 w-16 h-16 xs:w-20 xs:h-20 bg-gradient-to-r ${achievement.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-8 xs:mt-12 sm:mt-16 lg:mt-20"
          >
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 xs:p-8 sm:p-10 lg:p-12 text-center">
              <h3 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 xs:mb-6 sm:mb-8">
                Join the Success Story
              </h3>
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 xs:gap-6 sm:gap-8 mb-6 xs:mb-8 sm:mb-10">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5 xs:w-6 xs:h-6 text-green-500" />
                  <span className="text-sm xs:text-base sm:text-lg font-semibold text-gray-700">Verified Business</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="w-5 h-5 xs:w-6 xs:h-6 text-blue-500" />
                  <span className="text-sm xs:text-base sm:text-lg font-semibold text-gray-700">Secure Platform</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Star className="w-5 h-5 xs:w-6 xs:h-6 text-yellow-500" />
                  <span className="text-sm xs:text-base sm:text-lg font-semibold text-gray-700">Top Rated</span>
                </div>
              </div>
              <Button href="/register" size="lg" className="group">
                Start Your Journey Today
                <ArrowRight className="w-4 h-4 xs:w-5 xs:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="responsive-grid-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <h2 className="responsive-text-heading font-bold text-gray-800 mb-3 xs:mb-4 sm:mb-6">
                Get in Touch
              </h2>
              <p className="responsive-text-body text-gray-600 mb-4 xs:mb-6 sm:mb-8 leading-relaxed">
                Have questions? We&apos;re here to help you get started with your referral journey.
              </p>
              
              <div className="space-y-3 xs:space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-2 xs:space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 text-xs xs:text-sm sm:text-base mb-1">Address</div>
                    <div className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed">
                      6/7, Char Khamba Rd, Model Town Extension,<br />
                      Model Town, Ludhiana, Punjab 141002
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 xs:space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 text-xs xs:text-sm sm:text-base mb-1">Email</div>
                    <a 
                      href="mailto:thegurtoy@gmail.com" 
                      className="text-xs xs:text-sm sm:text-base text-gray-600 hover:text-primary transition-colors break-all"
                    >
                      thegurtoy@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="card order-1 lg:order-2 mb-8 lg:mb-0"
            >
              <h3 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 xs:mb-4 sm:mb-6">
                Ready to Start Earning?
              </h3>
              <div className="space-y-2 xs:space-y-3 sm:space-y-4 mb-4 xs:mb-6 sm:mb-8">
                <div className="flex items-center space-x-2 xs:space-x-3">
                  <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base text-gray-600">Quick KYC verification</span>
                </div>
                <div className="flex items-center space-x-2 xs:space-x-3">
                  <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base text-gray-600">Instant referral code generation</span>
                </div>
                <div className="flex items-center space-x-2 xs:space-x-3">
                  <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base text-gray-600">Real-time earnings tracking</span>
                </div>
                <div className="flex items-center space-x-2 xs:space-x-3">
                  <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base text-gray-600">Fast withdrawal processing</span>
                </div>
              </div>
              <Button href="/register" className="w-full group" size="lg">
                Join Gurtoy Today
                <ArrowRight className="w-4 h-4 xs:w-5 xs:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
})

// Export the memoized component
export default LandingPage;