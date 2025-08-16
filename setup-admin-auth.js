// Setup admin authentication and create test data
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://mknxaioosbktcyfokvfw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnhhaW9vc2JrdGN5Zm9rdmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjY4NzIsImV4cCI6MjA3MDY0Mjg3Mn0.2UtfvqfZegZ1_hrkngG0O-OixQ8dti5FTSO00gflEn8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function setupAdminAuth() {
  console.log('🔧 Setting up Admin Authentication...')
  console.log('=' .repeat(50))
  
  try {
    // Step 1: Sign up admin user
    console.log('1. Creating admin user account...')
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'thegurtoy@gmail.com',
      password: 'Toys123@'
    })
    
    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError
    }
    
    if (signUpData.user) {
      console.log('   ✅ Admin user created/exists:', signUpData.user.email)
    }
    
    // Step 2: Sign in as admin
    console.log('2. Signing in as admin...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'thegurtoy@gmail.com',
      password: 'Toys123@'
    })
    
    if (signInError) {
      throw signInError
    }
    
    console.log('   ✅ Admin signed in successfully')
    console.log('   👤 Admin ID:', signInData.user.id)
    
    // Step 3: Test admin function
    console.log('3. Testing admin function...')
    
    const { data: isAdminData, error: isAdminError } = await supabase
      .rpc('is_admin')
    
    if (isAdminError) {
      console.log('   ⚠️  Admin function error:', isAdminError.message)
    } else {
      console.log('   ✅ Admin function result:', isAdminData)
    }
    
    // Step 4: Create test data as admin
    console.log('4. Creating test data as authenticated admin...')
    
    // Create test users
    const testUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        full_name: 'Rahul Sharma',
        phone: '9876543210',
        aadhaar_name: 'Rahul Kumar Sharma',
        kyc_status: 'approved',
        referral_code: 'RAHUL123',
        aadhaar_url: 'https://example.com/aadhaar1.jpg',
        selfie_url: 'https://example.com/selfie1.jpg'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Priya Singh',
        phone: '9876543211',
        aadhaar_name: 'Priya Singh',
        kyc_status: 'approved',
        referral_code: 'PRIYA456',
        aadhaar_url: 'https://example.com/aadhaar2.jpg',
        selfie_url: 'https://example.com/selfie2.jpg'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        full_name: 'Amit Patel',
        phone: '9876543212',
        aadhaar_name: 'Amit Kumar Patel',
        kyc_status: 'pending',
        referral_code: null
      }
    ]

    const { error: usersError } = await supabase
      .from('users')
      .upsert(testUsers)

    if (usersError) {
      console.log('   ⚠️  Users creation error:', usersError.message)
    } else {
      console.log('   ✅ Created test users')
    }

    // Create test wallets
    const testWallets = [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        total_earnings: 750.00,
        pending_earnings: 150.00,
        available_balance: 600.00,
        bank_account_holder: 'Rahul Kumar Sharma',
        bank_account_number: '1234567890123456',
        bank_ifsc: 'SBIN0001234',
        upi_id: 'rahul@paytm',
        bank_details_submitted: true
      },
      {
        user_id: '22222222-2222-2222-2222-222222222222',
        total_earnings: 500.00,
        pending_earnings: 100.00,
        available_balance: 400.00,
        bank_account_holder: 'Priya Singh',
        bank_account_number: '9876543210987654',
        bank_ifsc: 'HDFC0001234',
        upi_id: 'priya@gpay',
        bank_details_submitted: true
      }
    ]

    const { error: walletsError } = await supabase
      .from('wallets')
      .upsert(testWallets)

    if (walletsError) {
      console.log('   ⚠️  Wallets creation error:', walletsError.message)
    } else {
      console.log('   ✅ Created test wallets')
    }

    // Create test orders
    const testOrders = [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        buyer_name: 'Raj K.',
        order_id: 'ORD001',
        product_names: 'Wooden Toy Car, Building Blocks',
        quantity: 2,
        price: 2500.00,
        status: 'delivered',
        commission: 125.00
      },
      {
        user_id: '22222222-2222-2222-2222-222222222222',
        buyer_name: 'Vikram M.',
        order_id: 'ORD003',
        product_names: 'Toy Kitchen Set',
        quantity: 1,
        price: 3200.00,
        status: 'delivered',
        commission: 160.00
      },
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        buyer_name: 'Sunita R.',
        order_id: 'ORD004',
        product_names: 'Remote Control Car',
        quantity: 1,
        price: 3000.00,
        status: 'pending',
        commission: 150.00
      }
    ]

    const { error: ordersError } = await supabase
      .from('orders')
      .upsert(testOrders)

    if (ordersError) {
      console.log('   ⚠️  Orders creation error:', ordersError.message)
    } else {
      console.log('   ✅ Created test orders')
    }

    // Create test withdrawals
    const testWithdrawals = [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        amount: 500.00,
        status: 'processed',
        bank_details: {
          account_holder: 'Rahul Kumar Sharma',
          account_number: '1234567890123456',
          ifsc: 'SBIN0001234'
        }
      },
      {
        user_id: '22222222-2222-2222-2222-222222222222',
        amount: 300.00,
        status: 'pending',
        bank_details: {
          account_holder: 'Priya Singh',
          account_number: '9876543210987654',
          ifsc: 'HDFC0001234'
        }
      }
    ]

    const { error: withdrawalsError } = await supabase
      .from('withdrawals')
      .upsert(testWithdrawals)

    if (withdrawalsError) {
      console.log('   ⚠️  Withdrawals creation error:', withdrawalsError.message)
    } else {
      console.log('   ✅ Created test withdrawals')
    }

    // Create test referral requests
    const testReferralRequests = [
      {
        user_id: '33333333-3333-3333-3333-333333333333',
        status: 'pending'
      }
    ]

    const { error: referralError } = await supabase
      .from('referral_code_requests')
      .upsert(testReferralRequests)

    if (referralError) {
      console.log('   ⚠️  Referral requests creation error:', referralError.message)
    } else {
      console.log('   ✅ Created test referral requests')
    }

    // Create test notices
    const testNotices = [
      {
        title: 'Welcome to GurToy Referral Program',
        content: 'Start earning 5% commission on every successful referral.',
        is_active: true
      },
      {
        title: 'New Product Launch',
        content: 'Check out our latest educational toys collection!',
        is_active: true
      }
    ]

    const { error: noticesError } = await supabase
      .from('notices')
      .upsert(testNotices)

    if (noticesError) {
      console.log('   ⚠️  Notices creation error:', noticesError.message)
    } else {
      console.log('   ✅ Created test notices')
    }

    console.log('')
    console.log('🎉 ADMIN SETUP COMPLETED!')
    console.log('=' .repeat(50))
    console.log('✅ Admin user authenticated')
    console.log('✅ Test data created')
    console.log('')
    console.log('🔗 Admin Panel Login:')
    console.log('   URL: http://localhost:3001/login')
    console.log('   Email: thegurtoy@gmail.com')
    console.log('   Password: Toys123@')
    console.log('')
    console.log('📊 All admin panel pages should now show data!')

  } catch (error) {
    console.error('❌ Error setting up admin:', error)
  }
}

setupAdminAuth().catch(console.error)
