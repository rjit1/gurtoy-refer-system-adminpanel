# Duplicate Wallet Entries Fix

This document provides instructions for fixing the duplicate wallet entries issue in the GurToy Referral System.

## Problem Description

The system currently allows multiple wallet entries for the same user, causing:
- Duplicate records in the database
- Users appearing multiple times in the Users & KYC page in the admin panel
- Potential issues with balance calculations and withdrawals

## Solution

The fix involves three parts:
1. Running SQL scripts to clean up existing duplicate wallet entries
2. Adding a unique constraint to prevent future duplicates
3. Updating the code to properly handle wallet operations

## Fix Instructions

### 1. Run the SQL Functions Script

First, run the SQL functions script in the Supabase SQL Editor:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/fix-duplicate-wallets-functions.sql`
4. Run the script

This creates the necessary functions for the fix script.

### 2. Run the Fix Script

Next, run the JavaScript fix script:

```bash
# Make sure you have the required environment variables set
# NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# Run the script
node fix-duplicate-wallets.js
```

This script will:
- Check for duplicate wallet entries
- Remove duplicates (keeping the most recent entry for each user)
- Add a unique constraint to prevent future duplicates
- Verify the fix was successful

### 3. Deploy Code Changes

The following code changes have been made to fix the issue:

1. Updated `admin-panel/app/withdrawals/page.tsx` to correctly fetch and update wallet balances
2. Updated `lib/wallet-utils.ts` to improve validation and use the `onConflict` parameter
3. Updated `admin-panel/lib/wallet-utils.ts` to use the `onConflict` parameter

Deploy these changes to your production environment.

## Verification

After applying the fix, verify that:

1. Each user has only one wallet entry in the database
2. Users appear only once in the Users & KYC page
3. Wallet balances are correctly updated when processing withdrawals

You can run this SQL query to check for any remaining duplicate wallet entries:

```sql
SELECT 
  user_id,
  COUNT(*) as wallet_count
FROM public.wallets 
GROUP BY user_id 
HAVING COUNT(*) > 1;
```

If this query returns no rows, the fix was successful.

## Prevention

The unique constraint on the `user_id` column in the `wallets` table will prevent future duplicate entries. Additionally, the code changes ensure that wallet operations use the `onConflict` parameter to update existing records rather than creating new ones.

The optimized view `user_wallet_summary` has also been updated to use `DISTINCT ON` to handle any edge cases where duplicates might still exist.