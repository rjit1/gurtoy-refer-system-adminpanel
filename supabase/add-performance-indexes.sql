-- Add performance indexes to improve query speed
-- Run this script to add indexes to frequently queried columns

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON public.users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);

-- Withdrawals table indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id_status ON public.withdrawals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requested_at ON public.withdrawals(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_requested_at ON public.withdrawals(status, requested_at DESC);

-- Wallets table indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_available_balance ON public.wallets(available_balance DESC);
CREATE INDEX IF NOT EXISTS idx_wallets_bank_details_submitted ON public.wallets(bank_details_submitted) WHERE bank_details_submitted = true;

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Referral code requests table indexes
CREATE INDEX IF NOT EXISTS idx_referral_code_requests_user_id ON public.referral_code_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_code_requests_status ON public.referral_code_requests(status);
CREATE INDEX IF NOT EXISTS idx_referral_code_requests_requested_at ON public.referral_code_requests(requested_at DESC);

-- Notices table indexes
CREATE INDEX IF NOT EXISTS idx_notices_is_active ON public.notices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON public.notices(created_at DESC);

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;