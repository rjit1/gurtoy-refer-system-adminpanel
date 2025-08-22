-- Fix for duplicate wallet entries
-- This script identifies and removes duplicate wallet entries, keeping only the most recent one

-- Step 1: Identify duplicate wallet entries
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