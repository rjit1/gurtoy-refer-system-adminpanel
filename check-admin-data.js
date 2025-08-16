// Check current admin panel data state
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mknxaioosbktcyfokvfw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnhhaW9vc2JrdGN5Zm9rdmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjY4NzIsImV4cCI6MjA3MDY0Mjg3Mn0.2UtfvqfZegZ1_hrkngG0O-OixQ8dti5FTSO00gflEn8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCurrentData() {
  console.log('🔍 Checking Current Database State...');
  
  // Sign in as admin first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'thegurtoy@gmail.com',
    password: 'Toys123@'
  });
  
  if (authError) {
    console.log('❌ Auth Error:', authError.message);
    return;
  }
  
  console.log('✅ Authenticated as:', authData.user.email);
  
  // Check each table
  const tables = ['users', 'orders', 'withdrawals', 'referral_code_requests', 'notices'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      console.log(`📊 ${table}: ${data?.length || 0} records`);
      if (error) console.log(`   Error: ${error.message}`);
      
      // Show sample data for debugging
      if (data && data.length > 0) {
        console.log(`   Sample: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  // Check optimized views
  const views = ['user_wallet_summary', 'withdrawal_requests_detailed', 'referral_requests_detailed'];
  
  console.log('\n🔍 Checking Optimized Views...');
  for (const view of views) {
    try {
      const { data, error } = await supabase.from(view).select('*');
      console.log(`📊 ${view}: ${data?.length || 0} records`);
      if (error) console.log(`   Error: ${error.message}`);
    } catch (err) {
      console.log(`❌ ${view}: ${err.message}`);
    }
  }
  
  // Test specific queries that admin panel uses
  console.log('\n🔍 Testing Admin Panel Queries...');
  
  // Test referral code search
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('referral_code', 'RAHUL123')
      .eq('kyc_status', 'approved');
    console.log(`🔍 Referral code search (RAHUL123): ${data?.length || 0} results`);
    if (error) console.log(`   Error: ${error.message}`);
  } catch (err) {
    console.log(`❌ Referral search error: ${err.message}`);
  }
  
  // Test admin function
  try {
    const { data, error } = await supabase.rpc('is_admin');
    console.log(`🔍 Admin function result: ${data}`);
    if (error) console.log(`   Error: ${error.message}`);
  } catch (err) {
    console.log(`❌ Admin function error: ${err.message}`);
  }
}

checkCurrentData().catch(console.error);
