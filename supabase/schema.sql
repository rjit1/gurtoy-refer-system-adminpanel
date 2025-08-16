-- Supabase schema for GurToy referral system (production-ready dashboard)
-- Complete schema with admin panel support
-- Run in Supabase SQL editor

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  aadhaar_name text, -- Name as per Aadhaar card
  kyc_status text not null default 'pending' check (kyc_status in ('pending','approved','rejected')),
  referral_code text,
  aadhaar_url text,
  selfie_url text,
  profile_image text,
  created_at timestamp with time zone not null default now()
);

-- Wallets table for detailed financial tracking
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  total_earnings numeric not null default 0,
  pending_earnings numeric not null default 0,
  available_balance numeric not null default 0,
  bank_account_holder text,
  bank_account_number text,
  bank_ifsc text,
  upi_id text,
  bank_details_submitted boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Orders table for referral activity tracking
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  buyer_name text not null, -- Masked name like "Raj K."
  order_id text not null,
  product_names text not null, -- JSON array or comma-separated
  quantity integer not null default 1,
  price numeric not null,
  status text not null default 'processing' check (status in ('processing','delivered','pending')),
  commission numeric not null default 0, -- Auto-calculated 5% on delivered
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Withdrawals table
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending','processed','rejected')),
  bank_details jsonb, -- Store bank details at time of withdrawal
  admin_notes text,
  requested_at timestamp with time zone not null default now(),
  processed_at timestamp with time zone
);

-- Notices table for system announcements
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Notifications table for user activity feed
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('kyc_submitted','kyc_approved','kyc_rejected','referral_code_requested','referral_generated','referral_sale','commission_added','withdrawal_processed','withdrawal_rejected')),
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Referral code requests table for admin approval system
create table if not exists public.referral_code_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamp with time zone not null default now(),
  processed_at timestamp with time zone,
  processed_by text, -- Admin who processed the request
  admin_notes text,
  referral_code text -- The code assigned by admin
);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.wallets enable row level security;
alter table public.orders enable row level security;
alter table public.withdrawals enable row level security;
alter table public.notices enable row level security;
alter table public.notifications enable row level security;
alter table public.referral_code_requests enable row level security;

-- Create admin function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user's email is the admin email
  RETURN (
    SELECT email = 'thegurtoy@gmail.com'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USER POLICIES (for regular users)
-- Users: read own profile
drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users: insert own profile
drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Users: update own profile
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Wallets policies
drop policy if exists "Users can read own wallet" on public.wallets;
create policy "Users can read own wallet"
  on public.wallets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own wallet" on public.wallets;
create policy "Users can update own wallet"
  on public.wallets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert own wallet" on public.wallets;
create policy "Users can insert own wallet"
  on public.wallets for insert
  with check (auth.uid() = user_id);

-- Orders policies
drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Withdrawals policies
drop policy if exists "Users can read own withdrawals" on public.withdrawals;
create policy "Users can read own withdrawals"
  on public.withdrawals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own withdrawals" on public.withdrawals;
create policy "Users can insert own withdrawals"
  on public.withdrawals for insert
  with check (auth.uid() = user_id);

-- Notices policies (read-only for all authenticated users)
drop policy if exists "Authenticated users can read notices" on public.notices;
create policy "Authenticated users can read notices"
  on public.notices for select
  to authenticated
  using (is_active = true);

-- Notifications policies
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Referral code requests policies
drop policy if exists "Users can read own referral requests" on public.referral_code_requests;
create policy "Users can read own referral requests"
  on public.referral_code_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own referral requests" on public.referral_code_requests;
create policy "Users can insert own referral requests"
  on public.referral_code_requests for insert
  with check (auth.uid() = user_id);

-- ADMIN POLICIES (for admin panel access)
-- Admin policies for users table
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
CREATE POLICY "Admin can read all users"
  ON public.users FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
CREATE POLICY "Admin can update all users"
  ON public.users FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin policies for wallets table
DROP POLICY IF EXISTS "Admin can read all wallets" ON public.wallets;
CREATE POLICY "Admin can read all wallets"
  ON public.wallets FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admin can update all wallets" ON public.wallets;
CREATE POLICY "Admin can update all wallets"
  ON public.wallets FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can insert wallets" ON public.wallets;
CREATE POLICY "Admin can insert wallets"
  ON public.wallets FOR INSERT
  WITH CHECK (is_admin());

-- Admin policies for orders table
DROP POLICY IF EXISTS "Admin can read all orders" ON public.orders;
CREATE POLICY "Admin can read all orders"
  ON public.orders FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admin can insert orders" ON public.orders;
CREATE POLICY "Admin can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can update all orders" ON public.orders;
CREATE POLICY "Admin can update all orders"
  ON public.orders FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin policies for withdrawals table
DROP POLICY IF EXISTS "Admin can read all withdrawals" ON public.withdrawals;
CREATE POLICY "Admin can read all withdrawals"
  ON public.withdrawals FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admin can update all withdrawals" ON public.withdrawals;
CREATE POLICY "Admin can update all withdrawals"
  ON public.withdrawals FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin policies for notices table
DROP POLICY IF EXISTS "Admin can manage all notices" ON public.notices;
CREATE POLICY "Admin can manage all notices"
  ON public.notices FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin policies for notifications table
DROP POLICY IF EXISTS "Admin can read all notifications" ON public.notifications;
CREATE POLICY "Admin can read all notifications"
  ON public.notifications FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admin can insert notifications" ON public.notifications;
CREATE POLICY "Admin can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (is_admin());

-- Admin policies for referral code requests table
DROP POLICY IF EXISTS "Admin can read all referral requests" ON public.referral_code_requests;
CREATE POLICY "Admin can read all referral requests"
  ON public.referral_code_requests FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admin can update all referral requests" ON public.referral_code_requests;
CREATE POLICY "Admin can update all referral requests"
  ON public.referral_code_requests FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can insert referral requests" ON public.referral_code_requests;
CREATE POLICY "Admin can insert referral requests"
  ON public.referral_code_requests FOR INSERT
  WITH CHECK (is_admin());

-- STORAGE POLICIES
-- Storage bucket for KYC documents
-- 1) Create bucket named 'aadhaar' (in Storage UI) with public access disabled
-- 2) Apply these RLS policies for storage.objects

-- Use the built-in owner column set on upload by authenticated users
-- This avoids relying on path parsing or metadata setting on the client

-- READ (Users can read their own documents)
drop policy if exists "aadhaar owner read" on storage.objects;
create policy "aadhaar owner read"
  on storage.objects for select
  using (
    bucket_id = 'aadhaar'
    and (
      auth.role() = 'service_role'
      or owner = auth.uid()
    )
  );

-- WRITE (INSERT)
drop policy if exists "aadhaar owner write" on storage.objects;
create policy "aadhaar owner write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'aadhaar'
    and owner = auth.uid()
  );

-- UPDATE
drop policy if exists "aadhaar owner update" on storage.objects;
create policy "aadhaar owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'aadhaar'
    and owner = auth.uid()
  )
  with check (
    bucket_id = 'aadhaar'
    and owner = auth.uid()
  );

-- DELETE
drop policy if exists "aadhaar owner delete" on storage.objects;
create policy "aadhaar owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'aadhaar'
    and owner = auth.uid()
  );

-- Admin storage policies for KYC documents
DROP POLICY IF EXISTS "Admin can read all aadhaar documents" ON storage.objects;
CREATE POLICY "Admin can read all aadhaar documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'aadhaar'
    AND is_admin()
  );

-- Admin can read all documents in aadhaar bucket (includes both aadhaar and selfie files)
-- Note: Both aadhaar documents and selfies are stored in the same 'aadhaar' bucket

-- Create indexes for better performance
create index if not exists idx_wallets_user_id on public.wallets(user_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_withdrawals_user_id on public.withdrawals(user_id);
create index if not exists idx_withdrawals_status on public.withdrawals(status);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);
create index if not exists idx_notices_active on public.notices(is_active);
create index if not exists idx_referral_requests_user_id on public.referral_code_requests(user_id);
create index if not exists idx_referral_requests_status on public.referral_code_requests(status);

-- Create triggers for updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop existing triggers if they exist
drop trigger if exists update_wallets_updated_at on public.wallets;
drop trigger if exists update_orders_updated_at on public.orders;
drop trigger if exists update_notices_updated_at on public.notices;

-- Create triggers for updated_at timestamps
create trigger update_wallets_updated_at before update on public.wallets
  for each row execute function update_updated_at_column();

create trigger update_orders_updated_at before update on public.orders
  for each row execute function update_updated_at_column();

create trigger update_notices_updated_at before update on public.notices
  for each row execute function update_updated_at_column();

-- Optional: Create a view for admin dashboard stats (for better performance)
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.users WHERE kyc_status = 'approved') as kyc_approved,
  (SELECT COUNT(*) FROM public.users WHERE referral_code IS NOT NULL) as referral_codes_assigned,
  (SELECT COUNT(*) FROM public.orders) as total_sales_added,
  (SELECT COALESCE(SUM(total_earnings), 0) FROM public.wallets) as total_paid_to_users,
  (SELECT COUNT(*) FROM public.withdrawals WHERE status = 'pending') as pending_withdrawals;