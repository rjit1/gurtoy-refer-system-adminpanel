-- SQL functions to fix duplicate wallet entries
-- These functions are used by the fix-duplicate-wallets.js script

-- Function to check for duplicate wallet entries
CREATE OR REPLACE FUNCTION check_duplicate_wallets()
RETURNS TABLE (
  user_id uuid,
  wallet_count bigint,
  wallet_ids text
) LANGUAGE sql AS $$
  SELECT 
    user_id,
    COUNT(*) as wallet_count,
    STRING_AGG(id::text, ', ') as wallet_ids
  FROM public.wallets 
  GROUP BY user_id 
  HAVING COUNT(*) > 1;
$$;

-- Function to fix duplicate wallet entries
CREATE OR REPLACE FUNCTION fix_duplicate_wallets()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Remove duplicate wallet entries (keeping the most recent one per user)
  WITH duplicate_wallets AS (
    SELECT id, user_id, created_at,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.wallets
  )
  DELETE FROM public.wallets 
  WHERE id IN (
    SELECT id FROM duplicate_wallets WHERE rn > 1
  );
END;
$$;

-- Function to add unique constraint on wallets table
CREATE OR REPLACE FUNCTION add_wallet_unique_constraint()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Drop constraint if it exists
  ALTER TABLE public.wallets 
  DROP CONSTRAINT IF EXISTS unique_wallet_per_user;

  -- Add unique constraint
  ALTER TABLE public.wallets 
  ADD CONSTRAINT unique_wallet_per_user UNIQUE (user_id);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_duplicate_wallets() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_duplicate_wallets() TO authenticated;
GRANT EXECUTE ON FUNCTION add_wallet_unique_constraint() TO authenticated;