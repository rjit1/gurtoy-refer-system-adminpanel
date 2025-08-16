# GurToy Admin Panel

A production-ready admin panel for managing the GurToy referral-based sales commission system.

## Features

- **Dashboard Overview**: Summary cards showing key metrics
- **User & KYC Management**: Review and approve user KYC documents
- **Add Referral Sale**: Add sales and credit commissions to users
- **Wallet & Withdrawal Management**: Process withdrawal requests
- **Admin Notices**: Create and manage system-wide notices
- **Secure Authentication**: Admin-only access with route protection

## Tech Stack

- **Frontend**: React + Next.js 14 (App Router)
- **Backend**: Supabase (Auth, Database, Storage)
- **UI Framework**: Tailwind CSS + Custom Components
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## Admin Credentials

- **Email**: thegurtoy@gmail.com
- **Password**: Toys123@

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Run the complete schema: `../supabase/schema.sql` in Supabase SQL Editor
   - This single file includes all tables, policies, and admin access
   - Create storage bucket: `aadhaar` (for all KYC documents - if not auto-created)
   - Ensure admin user exists with email: `thegurtoy@gmail.com`

3. **Environment Setup**
   - Copy `.env.local` and update Supabase credentials if needed

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   The admin panel will be available at `http://localhost:3001`

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
admin-panel/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard overview
│   ├── users/            # User & KYC management
│   ├── sales/            # Add referral sales
│   ├── withdrawals/      # Withdrawal management
│   ├── notices/          # Admin notices
│   └── login/            # Admin login
├── components/
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── supabase/         # Supabase client and types
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # Helper functions
└── middleware.ts         # Route protection
```

## Key Features

### Dashboard
- Total users, KYC approved, referral codes assigned
- Total sales added, total paid to users
- Pending withdrawal requests
- System activity and quick stats

### User & KYC Management
- View all registered users with filters
- Review KYC documents (Aadhaar + Selfie)
- Approve/reject KYC with referral code assignment
- Search by name, phone, or referral code

### Add Referral Sale
- Search users by referral code
- Add sale details with automatic commission calculation (5%)
- Support for different order statuses
- Auto-credit commission when order is delivered

### Withdrawal Management
- View all withdrawal requests with bank details
- Process withdrawals with automatic notifications
- Track withdrawal history and status
- Generate payment confirmations

### Admin Notices
- Create system-wide notices for users
- Toggle notice visibility (active/inactive)
- Edit and delete notices
- Automatic notice generation for payments

## Security Features

- Route protection middleware
- Admin-only authentication
- Secure Supabase RLS policies
- Input validation and sanitization
- Masked sensitive data (buyer names)

## Database Schema

The admin panel works with the following main tables:
- `users` - User profiles and KYC status
- `wallets` - User wallet balances and earnings
- `orders` - Referral sales and commissions
- `withdrawals` - Withdrawal requests and processing
- `notices` - System notices and announcements
- `notifications` - User notifications

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Support

For technical support or questions about the admin panel, contact the development team.

## License

This project is proprietary and confidential.