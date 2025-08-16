# GurToy Admin Panel - Complete Setup Guide

## 🚨 CRITICAL: Database Schema Setup

The admin panel requires **ONE SQL file** to be run in Supabase:

### Complete Schema Setup
Run `../supabase/schema.sql` - this creates all tables, user policies, and admin policies in one go.

**✅ SINGLE FILE SETUP** - Everything needed for both user app and admin panel is included.

## Complete Schema Design

The schema (`../supabase/schema.sql`) includes:

**For User-Facing Application:**
- Strict RLS policies that only allow users to access their own data
- Secure file storage with proper access controls
- User registration and KYC workflows

**For Admin Panel:**
- Admin-specific policies that grant full access to admin user (`thegurtoy@gmail.com`)
- Admin can view all users for KYC management
- Admin can see all orders and commissions
- Admin can process all withdrawal requests
- Admin can manage system-wide notices

The single schema maintains security for regular users while providing admin access where needed.

## Complete Setup Process

### 1. Supabase Project Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down the URL and anon key

2. **Run Database Schema**
   ```sql
   -- In Supabase SQL Editor, run this single file:
   -- Copy and paste content from: ../supabase/schema.sql
   
   -- This includes:
   -- ✅ All tables and relationships
   -- ✅ User RLS policies for security
   -- ✅ Admin policies for panel access
   -- ✅ Storage policies for KYC documents
   -- ✅ Indexes and triggers for performance
   ```

3. **Create Storage Bucket**
   - Go to Storage in Supabase dashboard
   - Create bucket named `aadhaar` (for all KYC documents)
   - Set bucket to private (not public)
   - Note: Both Aadhaar documents and selfies are stored in this single bucket

4. **Create Admin User**
   - Go to Authentication in Supabase dashboard
   - Create user with email: `thegurtoy@gmail.com`
   - Set password: `Toys123@`
   - Confirm the user (mark as verified)

### 2. Admin Panel Setup

1. **Install Dependencies**
   ```bash
   cd admin-panel
   npm install
   ```

2. **Environment Configuration**
   - The `.env.local` file is already configured
   - Update Supabase URL and keys if different:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   - Admin panel will be available at `http://localhost:3001`
   - Login with: `thegurtoy@gmail.com` / `Toys123@`

### 3. Verification Checklist

After setup, verify these work:

- [ ] Admin can login successfully
- [ ] Dashboard shows summary cards (may be zero initially)
- [ ] Users page loads (may be empty initially)
- [ ] Can create notices in Notices page
- [ ] All navigation links work
- [ ] No console errors in browser

## Schema Analysis

The current schema is **perfectly designed** for the admin panel. Here's what each table provides:

### Core Tables
- **`users`** - User profiles with KYC status and referral codes
- **`wallets`** - Financial tracking with earnings and balances
- **`orders`** - Referral sales with commission calculations
- **`withdrawals`** - Withdrawal requests with bank details
- **`notices`** - System-wide announcements
- **`notifications`** - User activity feed

### Key Features Supported
- ✅ KYC document storage (aadhaar_url, selfie_url)
- ✅ Referral code management
- ✅ Commission tracking (5% auto-calculation)
- ✅ Withdrawal processing with bank details
- ✅ System notices with active/inactive status
- ✅ User notifications for all actions
- ✅ Audit trail with timestamps

### Security Features
- ✅ Row Level Security (RLS) enabled
- ✅ User data isolation (users can only see their own data)
- ✅ Admin override policies (admin can see all data)
- ✅ Secure file storage with proper access controls
- ✅ Input validation with CHECK constraints

## No Schema Modifications Needed

The existing schema supports all admin panel requirements:

1. **Dashboard Stats** - Calculated from existing tables
2. **KYC Management** - Uses `users` table with document URLs
3. **Sales Management** - Uses `orders` table with commission tracking
4. **Withdrawal Processing** - Uses `withdrawals` table with bank details
5. **Notice Management** - Uses `notices` table with active/inactive status

## Troubleshooting

### Admin Can't See User Data
- **Cause**: Schema not fully applied or admin user doesn't exist
- **Solution**: Ensure `../supabase/schema.sql` was run completely and admin user exists

### Login Fails
- **Cause**: Admin user doesn't exist or wrong credentials
- **Solution**: Create user `thegurtoy@gmail.com` in Supabase Auth dashboard

### Images Don't Load
- **Cause**: Storage bucket not created or wrong permissions
- **Solution**: Create `aadhaar` bucket, ensure admin policies applied

### Console Errors
- **Cause**: Environment variables not set correctly
- **Solution**: Check `.env.local` has correct Supabase URL and keys

## Production Deployment

For production deployment:

1. **Database**: Already set up in Supabase (production-ready)
2. **Frontend**: Deploy to Vercel with environment variables
3. **Domain**: Configure custom domain if needed
4. **SSL**: Automatic with Vercel
5. **Monitoring**: Set up error tracking and performance monitoring

## Security Notes

- The admin user has elevated privileges to manage all user data
- Regular users still have strict RLS policies protecting their data
- All admin actions are logged and auditable
- File uploads are secured with proper access controls
- Input validation prevents SQL injection and XSS attacks

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify the SQL file was run completely
3. Ensure admin user exists with correct email
4. Check browser console for specific error messages