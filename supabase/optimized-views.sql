-- Optimized database views and functions for better performance
-- Run these in Supabase SQL editor after the main schema

-- IMPORTANT: If you get dependency errors, run this first:
-- DROP VIEW IF EXISTS withdrawal_requests_detailed CASCADE;
-- DROP VIEW IF EXISTS user_dashboard_summary CASCADE;
-- DROP VIEW IF EXISTS user_earnings_calculated CASCADE;

-- Drop existing functions and views first to avoid conflicts
-- Use CASCADE to automatically handle dependencies
DROP FUNCTION IF EXISTS get_admin_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS calculate_user_earnings(uuid) CASCADE;

-- Drop all views with CASCADE to handle dependencies automatically
DROP VIEW IF EXISTS admin_dashboard_stats CASCADE;
DROP VIEW IF EXISTS admin_dashboard_stats_optimized CASCADE;
DROP VIEW IF EXISTS user_wallet_summary CASCADE;
DROP VIEW IF EXISTS user_earnings_calculated CASCADE;
DROP VIEW IF EXISTS withdrawal_requests_detailed CASCADE;
DROP VIEW IF EXISTS referral_requests_detailed CASCADE;
DROP VIEW IF EXISTS user_dashboard_summary CASCADE;

-- 1. Optimized admin dashboard stats view
CREATE OR REPLACE VIEW admin_dashboard_stats_optimized AS
SELECT
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.users WHERE kyc_status = 'approved') as kyc_approved,
  (SELECT COUNT(*) FROM public.users WHERE referral_code IS NOT NULL) as referral_codes_assigned,
  (SELECT COUNT(*) FROM public.orders) as total_sales_added,
  (SELECT COALESCE(SUM(total_earnings), 0) FROM public.wallets) as total_paid_to_users,
  (SELECT COUNT(*) FROM public.withdrawals WHERE status = 'pending') as pending_withdrawals,
  (SELECT COUNT(*) FROM public.referral_code_requests WHERE status = 'pending') as pending_referral_requests;

-- 2. User wallet summary view (combines user and wallet data)
-- Fixed to handle duplicate wallet entries by using DISTINCT ON
CREATE OR REPLACE VIEW user_wallet_summary AS
SELECT
  u.id,
  u.full_name,
  u.phone,
  u.aadhaar_name,
  u.kyc_status,
  u.referral_code,
  u.aadhaar_url,
  u.selfie_url,
  u.profile_image,
  u.created_at,
  COALESCE(w.total_earnings, 0) as total_earnings,
  COALESCE(w.pending_earnings, 0) as pending_earnings,
  COALESCE(w.available_balance, 0) as available_balance,
  w.bank_account_holder,
  w.bank_account_number,
  w.bank_ifsc,
  w.upi_id,
  COALESCE(w.bank_details_submitted, false) as bank_details_submitted,
  w.updated_at as wallet_updated_at
FROM public.users u
LEFT JOIN (
  -- Subquery to get the most recent wallet entry per user (handles duplicates)
  SELECT DISTINCT ON (user_id)
    user_id,
    total_earnings,
    pending_earnings,
    available_balance,
    bank_account_holder,
    bank_account_number,
    bank_ifsc,
    upi_id,
    bank_details_submitted,
    updated_at
  FROM public.wallets
  ORDER BY user_id, created_at DESC
) w ON u.id = w.user_id;

-- 3. User earnings calculation view (real-time calculation from orders)
CREATE OR REPLACE VIEW user_earnings_calculated AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.referral_code,
  COALESCE(SUM(CASE 
    WHEN o.status = 'delivered' THEN o.price * 0.05 
    ELSE 0 
  END), 0) as total_earnings,
  COALESCE(SUM(CASE 
    WHEN o.status IN ('pending', 'processing') THEN o.price * 0.05 
    ELSE 0 
  END), 0) as pending_earnings,
  COALESCE(SUM(CASE
    WHEN o.status = 'delivered' THEN o.price * 0.05
    ELSE 0
  END), 0) - COALESCE(withdrawn.total_withdrawn, 0) as available_balance,
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN o.status IN ('pending', 'processing') THEN 1 END) as pending_orders
FROM public.users u
LEFT JOIN public.orders o ON u.id = o.user_id
LEFT JOIN (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) as total_withdrawn
  FROM public.withdrawals
  WHERE status IN ('processed', 'pending')
  GROUP BY user_id
) withdrawn ON u.id = withdrawn.user_id
WHERE u.kyc_status = 'approved' AND u.referral_code IS NOT NULL
GROUP BY u.id, u.full_name, u.referral_code, withdrawn.total_withdrawn;

-- 4. Withdrawal requests with user details view
CREATE OR REPLACE VIEW withdrawal_requests_detailed AS
SELECT 
  w.*,
  u.full_name,
  u.phone,
  u.referral_code,
  ue.available_balance as calculated_balance,
  ue.total_earnings as calculated_total_earnings
FROM public.withdrawals w
JOIN public.users u ON w.user_id = u.id
LEFT JOIN user_earnings_calculated ue ON w.user_id = ue.user_id
ORDER BY w.requested_at DESC;

-- 5. Referral requests with user details view
CREATE OR REPLACE VIEW referral_requests_detailed AS
SELECT 
  r.*,
  u.full_name,
  u.phone,
  u.kyc_status,
  u.created_at as user_created_at
FROM public.referral_code_requests r
JOIN public.users u ON r.user_id = u.id
ORDER BY r.requested_at DESC;

-- 6. User dashboard summary (optimized for dashboard loading)
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
  u.id,
  u.full_name,
  u.phone,
  u.aadhaar_name,
  u.kyc_status,
  u.referral_code,
  u.profile_image,
  u.created_at,
  -- Wallet information
  COALESCE(w.total_earnings, 0) as total_earnings,
  COALESCE(w.pending_earnings, 0) as pending_earnings,
  COALESCE(w.available_balance, 0) as available_balance,
  COALESCE(w.bank_details_submitted, false) as bank_details_submitted,
  -- Order statistics
  COALESCE(order_stats.total_orders, 0) as total_orders,
  COALESCE(order_stats.delivered_orders, 0) as delivered_orders,
  COALESCE(order_stats.pending_orders, 0) as pending_orders,
  COALESCE(order_stats.total_sales_value, 0) as total_sales_value,
  -- Withdrawal statistics
  COALESCE(withdrawal_stats.total_withdrawals, 0) as total_withdrawals,
  COALESCE(withdrawal_stats.pending_withdrawals, 0) as pending_withdrawals,
  -- Notification count
  COALESCE(notification_stats.unread_notifications, 0) as unread_notifications
FROM public.users u
LEFT JOIN public.wallets w ON u.id = w.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN status IN ('pending', 'processing') THEN 1 END) as pending_orders,
    SUM(price) as total_sales_value
  FROM public.orders
  GROUP BY user_id
) order_stats ON u.id = order_stats.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_withdrawals,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_withdrawals
  FROM public.withdrawals
  GROUP BY user_id
) withdrawal_stats ON u.id = withdrawal_stats.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as unread_notifications
  FROM public.notifications
  WHERE read = false
  GROUP BY user_id
) notification_stats ON u.id = notification_stats.user_id;

-- 7. Function to get dashboard stats efficiently
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users bigint,
  kyc_approved bigint,
  referral_codes_assigned bigint,
  total_sales_added bigint,
  total_paid_to_users numeric,
  pending_withdrawals bigint,
  pending_referral_requests bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    total_users,
    kyc_approved,
    referral_codes_assigned,
    total_sales_added,
    total_paid_to_users,
    pending_withdrawals,
    pending_referral_requests
  FROM admin_dashboard_stats_optimized;
$$;

-- 8. Function to calculate user earnings efficiently
CREATE OR REPLACE FUNCTION calculate_user_earnings(user_uuid uuid)
RETURNS TABLE (
  total_earnings numeric,
  pending_earnings numeric,
  available_balance numeric,
  total_orders bigint,
  delivered_orders bigint,
  pending_orders bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COALESCE(SUM(CASE 
      WHEN o.status = 'delivered' THEN o.price * 0.05 
      ELSE 0 
    END), 0) as total_earnings,
    COALESCE(SUM(CASE 
      WHEN o.status IN ('pending', 'processing') THEN o.price * 0.05 
      ELSE 0 
    END), 0) as pending_earnings,
    COALESCE(SUM(CASE 
      WHEN o.status = 'delivered' THEN o.price * 0.05 
      ELSE 0 
    END), 0) - COALESCE(
      (SELECT SUM(amount) FROM public.withdrawals WHERE user_id = user_uuid AND status IN ('processed', 'pending')),
      0
    ) as available_balance,
    COUNT(o.id) as total_orders,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN o.status IN ('pending', 'processing') THEN 1 END) as pending_orders
  FROM public.orders o
  WHERE o.user_id = user_uuid;
$$;

-- 9. Clean up duplicate wallet entries (run this once to fix existing duplicates)
-- Remove duplicate wallet entries, keeping the most recent one per user
WITH duplicate_wallets AS (
  SELECT id, user_id, created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.wallets
)
DELETE FROM public.wallets
WHERE id IN (
  SELECT id FROM duplicate_wallets WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.wallets
DROP CONSTRAINT IF EXISTS unique_wallet_per_user;

ALTER TABLE public.wallets
ADD CONSTRAINT unique_wallet_per_user UNIQUE (user_id);

-- 10. Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON public.users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id_status ON public.withdrawals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_requested_at ON public.withdrawals(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_referral_requests_status ON public.referral_code_requests(status);

-- 10. Views inherit RLS from their underlying tables automatically
-- No need to enable RLS on views - they use the policies from base tables

-- Grant access to views
GRANT SELECT ON admin_dashboard_stats_optimized TO authenticated;
GRANT SELECT ON user_wallet_summary TO authenticated;
GRANT SELECT ON user_earnings_calculated TO authenticated;
GRANT SELECT ON withdrawal_requests_detailed TO authenticated;
GRANT SELECT ON referral_requests_detailed TO authenticated;
GRANT SELECT ON user_dashboard_summary TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_earnings(uuid) TO authenticated;
