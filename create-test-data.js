// Create comprehensive test data for admin panel testing
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://mknxaioosbktcyfokvfw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnhhaW9vc2JrdGN5Zm9rdmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjY4NzIsImV4cCI6MjA3MDY0Mjg3Mn0.2UtfvqfZegZ1_hrkngG0O-OixQ8dti5FTSO00gflEn8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function createTestData() {
  console.log('🔧 Creating Test Data for Admin Panel...')
  console.log('=' .repeat(50))
  
  try {
    // 1. Create test users
    console.log('1. Creating test users...')
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
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        full_name: 'Sneha Gupta',
        phone: '9876543213',
        aadhaar_name: 'Sneha Gupta',
        kyc_status: 'rejected',
        referral_code: null
      }
    ]

    const { error: usersError } = await supabase
      .from('users')
      .upsert(testUsers)

    if (usersError) throw usersError
    console.log('   ✅ Created 4 test users')

    // 2. Create wallets for approved users
    console.log('2. Creating wallets...')
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

    if (walletsError) throw walletsError
    console.log('   ✅ Created 2 wallets')

    // 3. Create test orders
    console.log('3. Creating test orders...')
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
        user_id: '11111111-1111-1111-1111-111111111111',
        buyer_name: 'Anita S.',
        order_id: 'ORD002',
        product_names: 'Educational Puzzle Set',
        quantity: 1,
        price: 1800.00,
        status: 'delivered',
        commission: 90.00
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
      },
      {
        user_id: '22222222-2222-2222-2222-222222222222',
        buyer_name: 'Deepak T.',
        order_id: 'ORD005',
        product_names: 'Board Game Collection',
        quantity: 1,
        price: 2000.00,
        status: 'processing',
        commission: 100.00
      }
    ]

    const { error: ordersError } = await supabase
      .from('orders')
      .upsert(testOrders)

    if (ordersError) throw ordersError
    console.log('   ✅ Created 5 test orders')

    // 4. Create test withdrawals
    console.log('4. Creating test withdrawals...')
    const testWithdrawals = [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        amount: 500.00,
        status: 'processed',
        bank_details: {
          account_holder: 'Rahul Kumar Sharma',
          account_number: '1234567890123456',
          ifsc: 'SBIN0001234',
          upi_id: 'rahul@paytm'
        },
        requested_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        user_id: '22222222-2222-2222-2222-222222222222',
        amount: 300.00,
        status: 'pending',
        bank_details: {
          account_holder: 'Priya Singh',
          account_number: '9876543210987654',
          ifsc: 'HDFC0001234',
          upi_id: 'priya@gpay'
        },
        requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        amount: 1000.00,
        status: 'rejected',
        bank_details: {
          account_holder: 'Rahul Kumar Sharma',
          account_number: '1234567890123456',
          ifsc: 'SBIN0001234',
          upi_id: 'rahul@paytm'
        },
        requested_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      }
    ]

    const { error: withdrawalsError } = await supabase
      .from('withdrawals')
      .upsert(testWithdrawals)

    if (withdrawalsError) throw withdrawalsError
    console.log('   ✅ Created 3 test withdrawals')

    // 5. Create test referral code requests
    console.log('5. Creating referral code requests...')
    const testReferralRequests = [
      {
        user_id: '33333333-3333-3333-3333-333333333333',
        status: 'pending',
        requested_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        user_id: '44444444-4444-4444-4444-444444444444',
        status: 'rejected',
        referral_code: null,
        requested_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      }
    ]

    const { error: referralError } = await supabase
      .from('referral_code_requests')
      .upsert(testReferralRequests)

    if (referralError) throw referralError
    console.log('   ✅ Created 2 referral code requests')

    // 6. Create test notices
    console.log('6. Creating test notices...')
    const testNotices = [
      {
        title: 'Welcome to GurToy Referral Program',
        content: 'Start earning 5% commission on every successful referral. Upload your KYC documents to get started!',
        is_active: true
      },
      {
        title: 'New Product Launch',
        content: 'We have launched new educational toys. Check out our latest collection and start referring!',
        is_active: true
      },
      {
        title: 'Maintenance Notice',
        content: 'The system will be under maintenance on Sunday from 2 AM to 4 AM. Please plan your activities accordingly.',
        is_active: false
      }
    ]

    const { error: noticesError } = await supabase
      .from('notices')
      .upsert(testNotices)

    if (noticesError) throw noticesError
    console.log('   ✅ Created 3 test notices')

    // 7. Create test notifications
    console.log('7. Creating test notifications...')
    const testNotifications = [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        type: 'commission_added',
        title: 'Commission Earned',
        message: 'You earned ₹125.00 commission from order ORD001',
        read: false
      },
      {
        user_id: '22222222-2222-2222-2222-222222222222',
        type: 'withdrawal_processed',
        title: 'Withdrawal Request Submitted',
        message: 'Your withdrawal request of ₹300.00 has been submitted and is under review.',
        read: true
      }
    ]

    const { error: notificationsError } = await supabase
      .from('notifications')
      .upsert(testNotifications)

    if (notificationsError) throw notificationsError
    console.log('   ✅ Created 2 test notifications')

    console.log('')
    console.log('🎉 TEST DATA CREATION COMPLETED!')
    console.log('=' .repeat(50))
    console.log('📊 Summary:')
    console.log('   👥 Users: 4 (2 approved, 1 pending, 1 rejected)')
    console.log('   💰 Wallets: 2 (with bank details)')
    console.log('   📦 Orders: 5 (3 delivered, 1 pending, 1 processing)')
    console.log('   💸 Withdrawals: 3 (1 processed, 1 pending, 1 rejected)')
    console.log('   🎫 Referral Requests: 2 (1 pending, 1 rejected)')
    console.log('   📢 Notices: 3 (2 active, 1 inactive)')
    console.log('   🔔 Notifications: 2')
    console.log('')
    console.log('🔗 Now test admin panel at: http://localhost:3001')
    console.log('   All pages should now show data!')

  } catch (error) {
    console.error('❌ Error creating test data:', error)
  }
}

createTestData().catch(console.error)
