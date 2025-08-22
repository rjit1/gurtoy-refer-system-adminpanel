# Gurtoy Referral Platform

A comprehensive referral management platform built with Next.js, TypeScript, Tailwind CSS, and Supabase. This platform includes a landing page, user dashboard, and admin panel for managing referrals, orders, and payments.

## 🚀 Features

### Landing Page
- **Modern Design**: Clean, professional UI with smooth animations
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **Performance Optimized**: Built with Next.js 14 and App Router
- **Smooth Animations**: Powered by Framer Motion
- **SEO Optimized**: Meta tags, structured data, and semantic HTML

### Platform Features
- **User Authentication**: Secure email/password authentication with Supabase Auth
- **KYC Verification**: Upload and verify Aadhaar card and selfie
- **Referral Management**: Generate and track referral codes
- **Order Tracking**: Monitor orders and commissions
- **Wallet System**: Track earnings and process withdrawals
- **Admin Dashboard**: Manage users, KYC verification, and withdrawals
- **Notifications**: Real-time notifications for important events

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## 🎨 Design System

### Colors
- **Primary**: #0077FF (Blue - trust, action)
- **Accent**: #00C897 (Green - success, money)
- **Dark**: #0B0F19 (Charcoal - depth)
- **Text**: #1F2937 (Gray-800)
- **Background**: #F9FAFB (Ultra light gray)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 600, 700

## 📱 Sections

1. **Header with Navigation**
   - Brand logo and navigation
   - CTA buttons for Login and Get Started
   - Mobile-responsive hamburger menu

2. **Hero Section**
   - Compelling headline and subtext
   - Primary CTA button
   - Key statistics display

3. **How It Works**
   - 4-step process explanation
   - Interactive cards with icons

4. **Benefits Section**
   - Key value propositions
   - Feature highlights

5. **Testimonials**
   - Social proof from satisfied users
   - Star ratings and user details

6. **Contact Section**
   - Company information
   - Call-to-action for registration

7. **Footer**
   - Company details and quick links
   - Contact information

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gurtoy-refer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
gurtoy-refer/
├── app/                  # Next.js app directory
│   ├── admin/            # Admin panel pages
│   ├── dashboard/        # User dashboard pages
│   ├── api/              # API routes
│   ├── login/            # Authentication pages
│   ├── register/         # User registration
│   ├── kyc/              # KYC verification
│   ├── profile/          # User profile management
│   ├── verify/           # Email verification
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── admin/            # Admin-specific components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility functions and helpers
│   ├── supabase/         # Supabase client and types
│   ├── wallet-utils.ts   # Wallet management utilities
│   ├── kyc-utils.ts      # KYC document utilities
│   ├── notification-utils.ts # Notification utilities
│   ├── error-handling.ts # Error handling utilities
│   └── security-utils.ts # Security utilities
├── public/               # Static assets
├── supabase/             # Supabase migrations and scripts
│   ├── fix-view-dependencies.sql # Fix for database view dependencies
│   └── add-performance-indexes.sql # Performance indexes
├── middleware.ts         # Next.js middleware for auth and security
├── deploy.js             # Deployment script
├── fix-kyc-documents.js  # Script to fix KYC document URLs
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🌐 Deployment

### Manual Deployment

This project is optimized for Vercel deployment:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up the required environment variables
4. Deploy

### Automated Deployment

Use the deployment script to deploy to Vercel and update Supabase:

```bash
node deploy.js
```

Follow the prompts to select the environment and deployment options.

### Environment Variables

```
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: Optimized
- **Mobile Responsive**: 100%
- **Accessibility**: WCAG 2.1 compliant

## 🔧 Customization

### Colors
Update colors in `tailwind.config.js`:

```javascript
colors: {
  primary: '#0077FF',
  accent: '#00C897',
  // ... other colors
}
```

### Content
Update content in `app/page.tsx` and component files.

### Animations
Modify Framer Motion animations in component files.

## 📞 Contact

- **Email**: thegurtoy@gmail.com
- **Address**: 6/7, Char Khamba Rd, Model Town Extension, Model Town, Ludhiana, Punjab 141002

## 🧪 Testing

Run the test suite:

```bash
npm test
```

For end-to-end tests with Playwright:

```bash
npx playwright test
```

## 🔧 Utilities

### Wallet Utilities

The `wallet-utils.ts` file contains functions for managing user wallets:

- `calculateUserEarnings`: Calculate user earnings from orders
- `updateUserWallet`: Update user wallet with calculated earnings
- `updateUserWalletAfterOrder`: Update wallet after order creation/update
- `updateWalletOnStatusChange`: Update wallet when order status changes
- `recalculateAllWallets`: Recalculate all user wallets (admin utility)
- `getWalletSummary`: Get wallet summary for admin dashboard

### KYC Utilities

The `kyc-utils.ts` file contains functions for managing KYC documents:

- `validateKycDocuments`: Validate KYC document URLs
- `standardizeKycDocumentUrls`: Standardize KYC document URLs
- `fixAllKycDocumentUrls`: Fix KYC document URLs for all users

### Notification Utilities

The `notification-utils.ts` file contains functions for managing notifications:

- `createNotification`: Create a notification
- `markNotificationAsRead`: Mark a notification as read
- `markAllNotificationsAsRead`: Mark all notifications as read for a user
- `getUnreadNotificationCount`: Get unread notification count for a user
- `deleteOldNotifications`: Delete old notifications (older than 30 days)

### Error Handling

The `error-handling.ts` file contains utilities for handling errors:

- `classifyError`: Classify errors by type
- `logError`: Log errors with context
- `getUserFriendlyError`: Get user-friendly error messages
- `handleApiError`: Handle API errors with proper response
- `withRetry`: Retry mechanism for operations
- `getErrorRecoveryActions`: Get error recovery suggestions

### Security Utilities

The `security-utils.ts` file contains security-related utilities:

- `createAdminClient`: Create a server-side Supabase client with admin privileges
- `createServerClient`: Create a server-side Supabase client with user's session
- `sanitizeInput`: Sanitize user input to prevent XSS attacks
- `validatePhoneNumber`: Validate phone number format
- `validateAadhaarNumber`: Validate Aadhaar number format
- `validateIFSC`: Validate IFSC code format
- `validateUPI`: Validate UPI ID format
- `validateBankAccount`: Validate bank account number
- `generateSecureRandomString`: Generate a secure random string
- `checkRateLimit`: Rate limiting helper

## 📄 License

This project is proprietary and confidential.