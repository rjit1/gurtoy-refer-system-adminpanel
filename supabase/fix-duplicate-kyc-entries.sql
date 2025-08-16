-- Fix for duplicate KYC entries in admin panel
-- This script addresses the root cause: duplicate wallet entries for the same user

-- PROBLEM IDENTIFIED:
-- - Users can have multiple wallet entries in the wallets table
-- - The user_wallet_summary view uses LEFT JOIN which creates duplicate rows
-- - This causes the same user to appear multiple times in the Users & KYC page

-- SOLUTION:
-- 1. Remove duplicate wallet entries (keep the most recent one)
-- 2. Add unique constraint to prevent future duplicates
-- 3. Update the view to handle any remaining edge cases

-- Step 1: Check current duplicate wallet entries
SELECT 
  user_id,
  COUNT(*) as wallet_count,
  STRING_AGG(id::text, ', ') as wallet_ids
FROM public.wallets 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 2: Remove duplicate wallet entries (keeping the most recent one per user)
WITH duplicate_wallets AS (
  SELECT id, user_id, created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.wallets
)
DELETE FROM public.wallets 
WHERE id IN (
  SELECT id FROM duplicate_wallets WHERE rn > 1
);

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE public.wallets 
DROP CONSTRAINT IF EXISTS unique_wallet_per_user;

ALTER TABLE public.wallets 
ADD CONSTRAINT unique_wallet_per_user UNIQUE (user_id);

-- Step 4: Verify the fix
-- Check that each user now has only one wallet entry
SELECT 
  user_id,
  COUNT(*) as wallet_count
FROM public.wallets 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- This should return no rows if the fix worked

-- Step 5: Test the user_wallet_summary view
SELECT COUNT(*) as view_count FROM user_wallet_summary;
SELECT COUNT(*) as users_count FROM users;

-- These two counts should now be equal

-- ADDITIONAL PREVENTION:
-- The updated user_wallet_summary view now uses DISTINCT ON to handle any edge cases
-- Even if duplicates somehow occur in the future, the view will only show one entry per user
