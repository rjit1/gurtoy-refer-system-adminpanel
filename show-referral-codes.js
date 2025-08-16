const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mknxaioosbktcyfokvfw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnhhaW9vc2JrdGN5Zm9rdmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjY4NzIsImV4cCI6MjA3MDY0Mjg3Mn0.2UtfvqfZegZ1_hrkngG0O-OixQ8dti5FTSO00gflEn8');

async function showReferralCodes() {
  await supabase.auth.signInWithPassword({ email: 'thegurtoy@gmail.com', password: 'Toys123@' });
  const { data } = await supabase.from('users').select('full_name, referral_code, kyc_status');
  console.log('Available referral codes:');
  data.forEach(user => {
    console.log(`- ${user.full_name}: ${user.referral_code} (KYC: ${user.kyc_status})`);
  });
}
showReferralCodes();
