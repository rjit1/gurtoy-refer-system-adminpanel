// Script to fix KYC document URLs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mknxaioosbktcyfokvfw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnhhaW9vc2JrdGN5Zm9rdmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjY4NzIsImV4cCI6MjA3MDY0Mjg3Mn0.2UtfvqfZegZ1_hrkngG0O-OixQ8dti5FTSO00gflEn8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Standard KYC document URL patterns
const KYC_DOCUMENT_PATHS = {
  aadhaar: (userId) => `kyc-documents/aadhaar-${userId}.jpg`,
  selfie: (userId) => `kyc-documents/selfie-${userId}.jpg`,
  profile: (userId) => `profile-images/${userId}.jpg`
};

async function fixKycDocuments() {
  console.log('🔧 Fixing KYC Document URLs...');
  
  // Sign in as admin
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'thegurtoy@gmail.com',
    password: 'Toys123@'
  });
  
  if (authError) {
    console.log('❌ Auth Error:', authError.message);
    return;
  }
  
  console.log('✅ Authenticated as admin');
  
  // Get all users with KYC documents
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, aadhaar_url, selfie_url')
    .not('kyc_status', 'is', null);
  
  if (usersError) {
    console.log('❌ Error fetching users:', usersError.message);
    return;
  }
  
  console.log(`Found ${users.length} users with KYC data`);
  
  let standardized = 0;
  let skipped = 0;
  let failed = 0;
  
  // Process each user
  for (const user of users) {
    try {
      // Generate standard URLs
      const standardAadhaarUrl = KYC_DOCUMENT_PATHS.aadhaar(user.id);
      const standardSelfieUrl = KYC_DOCUMENT_PATHS.selfie(user.id);
      
      // Check if URLs need to be standardized
      const needsUpdate = (
        !user.aadhaar_url?.includes(`aadhaar-${user.id}`) ||
        !user.selfie_url?.includes(`selfie-${user.id}`)
      );
      
      if (needsUpdate) {
        // Update user with standardized URLs
        const { error: updateError } = await supabase
          .from('users')
          .update({
            aadhaar_url: standardAadhaarUrl,
            selfie_url: standardSelfieUrl
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.log(`❌ Error updating ${user.full_name}:`, updateError.message);
          failed++;
        } else {
          console.log(`✅ Updated ${user.full_name} with standard KYC URLs`);
          standardized++;
        }
      } else {
        console.log(`⏭️ Skipped ${user.full_name} - URLs already standardized`);
        skipped++;
      }
    } catch (error) {
      console.log(`❌ Error processing ${user.full_name}:`, error.message);
      failed++;
    }
  }
  
  console.log('');
  console.log('🎉 KYC DOCUMENT FIX COMPLETED!');
  console.log('='.repeat(50));
  console.log(`✅ Standardized: ${standardized} users`);
  console.log(`⏭️ Skipped: ${skipped} users`);
  console.log(`❌ Failed: ${failed} users`);
  console.log('');
  console.log('All KYC documents now follow the standard URL pattern:');
  console.log('- Aadhaar: kyc-documents/aadhaar-{user_id}.jpg');
  console.log('- Selfie: kyc-documents/selfie-{user_id}.jpg');
}

fixKycDocuments().catch(console.error);