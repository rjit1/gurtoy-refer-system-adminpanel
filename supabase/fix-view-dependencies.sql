-- Fix for view dependency issues
-- Run this FIRST if you get dependency errors when running optimized-views.sql

-- Drop views in the correct order to handle dependencies
-- Views that depend on others must be dropped first

-- Step 1: Drop views that depend on user_earnings_calculated
DROP VIEW IF EXISTS withdrawal_requests_detailed CASCADE;
DROP VIEW IF EXISTS user_dashboard_summary CASCADE;

-- Step 2: Drop the base view
DROP VIEW IF EXISTS user_earnings_calculated CASCADE;

-- Step 3: Drop other independent views
DROP VIEW IF EXISTS admin_dashboard_stats CASCADE;
DROP VIEW IF EXISTS admin_dashboard_stats_optimized CASCADE;
DROP VIEW IF EXISTS user_wallet_summary CASCADE;
DROP VIEW IF EXISTS referral_requests_detailed CASCADE;

-- Step 4: Drop functions
DROP FUNCTION IF EXISTS get_admin_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS calculate_user_earnings(uuid) CASCADE;

-- Now you can safely run the optimized-views.sql file
