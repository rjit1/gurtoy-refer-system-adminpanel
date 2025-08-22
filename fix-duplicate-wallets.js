// Script to fix duplicate wallet entries
// Run this script with: node fix-duplicate-wallets.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicateWallets() {
  console.log('Starting duplicate wallet fix...');

  try {
    // Step 1: Check for duplicate wallet entries
    console.log('Checking for duplicate wallet entries...');
    const { data: duplicates, error: checkError } = await supabase.rpc('check_duplicate_wallets');

    if (checkError) {
      throw checkError;
    }

    if (!duplicates || duplicates.length === 0) {
      console.log('No duplicate wallet entries found. Database is clean!');
      return;
    }

    console.log(`Found ${duplicates.length} users with duplicate wallet entries.`);
    console.log('User IDs with duplicates:', duplicates.map(d => d.user_id).join(', '));

    // Step 2: Execute the fix SQL script
    console.log('Removing duplicate wallet entries...');
    const { error: fixError } = await supabase.rpc('fix_duplicate_wallets');

    if (fixError) {
      throw fixError;
    }

    // Step 3: Verify the fix
    console.log('Verifying the fix...');
    const { data: remainingDuplicates, error: verifyError } = await supabase.rpc('check_duplicate_wallets');

    if (verifyError) {
      throw verifyError;
    }

    if (remainingDuplicates && remainingDuplicates.length > 0) {
      console.warn(`Warning: ${remainingDuplicates.length} users still have duplicate wallet entries.`);
      console.warn('This may require manual intervention.');
    } else {
      console.log('Success! All duplicate wallet entries have been removed.');
    }

    // Step 4: Add unique constraint if it doesn't exist
    console.log('Adding unique constraint on wallets table...');
    const { error: constraintError } = await supabase.rpc('add_wallet_unique_constraint');

    if (constraintError) {
      throw constraintError;
    }

    console.log('Unique constraint added successfully.');
    console.log('Fix complete! The wallets table now enforces one wallet per user.');

  } catch (error) {
    console.error('Error fixing duplicate wallets:', error);
    process.exit(1);
  }
}

// Run the fix
fixDuplicateWallets();