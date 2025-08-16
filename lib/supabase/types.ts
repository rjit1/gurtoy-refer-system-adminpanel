// Shared DB types and helpers
export type KycStatus = 'pending' | 'approved' | 'rejected'
export type OrderStatus = 'processing' | 'delivered' | 'pending'
export type WithdrawalStatus = 'pending' | 'processed' | 'rejected'
export type ReferralRequestStatus = 'pending' | 'approved' | 'rejected'
export type NotificationType = 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected' | 'referral_code_requested' | 'referral_generated' | 'referral_sale' | 'commission_added' | 'withdrawal_processed' | 'withdrawal_rejected'

export interface Profile {
  id: string // auth.user id
  full_name: string
  phone: string
  aadhaar_name?: string | null
  kyc_status: KycStatus
  referral_code: string | null
  aadhaar_url: string | null
  selfie_url: string | null
  profile_image: string | null
  created_at: string
}

export interface Wallet {
  id: string
  user_id: string
  total_earnings: number
  pending_earnings: number
  available_balance: number
  bank_account_holder: string | null
  bank_account_number: string | null
  bank_ifsc: string | null
  upi_id: string | null
  bank_details_submitted: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  buyer_name: string
  order_id: string
  product_names: string
  quantity: number
  price: number
  status: OrderStatus
  commission: number
  created_at: string
  updated_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  status: WithdrawalStatus
  bank_details: any | null // jsonb
  admin_notes: string | null
  requested_at: string
  processed_at: string | null
}

export interface Notice {
  id: string
  title: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  created_at: string
}

export interface ReferralCodeRequest {
  id: string
  user_id: string
  status: ReferralRequestStatus
  requested_at: string
  processed_at: string | null
  processed_by: string | null
  admin_notes: string | null
  referral_code: string | null
}

// Dashboard tab types
export type DashboardTab = 'dashboard' | 'wallet' | 'referral-activity' | 'withdrawals' | 'notices'

// Bank details interface for forms
export interface BankDetails {
  account_holder: string
  account_number: string
  ifsc: string
  upi_id?: string
}