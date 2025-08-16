// Database types for admin panel
export type KycStatus = 'pending' | 'approved' | 'rejected'
export type OrderStatus = 'processing' | 'delivered' | 'pending'
export type WithdrawalStatus = 'pending' | 'processed' | 'rejected'
export type ReferralRequestStatus = 'pending' | 'approved' | 'rejected'
export type NotificationType = 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected' | 'referral_code_requested' | 'referral_generated' | 'referral_sale' | 'commission_added' | 'withdrawal_processed' | 'withdrawal_rejected'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          phone: string
          aadhaar_name: string | null
          kyc_status: KycStatus
          referral_code: string | null
          aadhaar_url: string | null
          selfie_url: string | null
          profile_image: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone: string
          aadhaar_name?: string | null
          kyc_status?: KycStatus
          referral_code?: string | null
          aadhaar_url?: string | null
          selfie_url?: string | null
          profile_image?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          aadhaar_name?: string | null
          kyc_status?: KycStatus
          referral_code?: string | null
          aadhaar_url?: string | null
          selfie_url?: string | null
          profile_image?: string | null
          created_at?: string
        }
      }
      wallets: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          total_earnings?: number
          pending_earnings?: number
          available_balance?: number
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          upi_id?: string | null
          bank_details_submitted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_earnings?: number
          pending_earnings?: number
          available_balance?: number
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          upi_id?: string | null
          bank_details_submitted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          buyer_name: string
          order_id: string
          product_names: string
          quantity?: number
          price: number
          status?: OrderStatus
          commission?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          buyer_name?: string
          order_id?: string
          product_names?: string
          quantity?: number
          price?: number
          status?: OrderStatus
          commission?: number
          created_at?: string
          updated_at?: string
        }
      }
      withdrawals: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: WithdrawalStatus
          bank_details: any | null
          admin_notes: string | null
          requested_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status?: WithdrawalStatus
          bank_details?: any | null
          admin_notes?: string | null
          requested_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: WithdrawalStatus
          bank_details?: any | null
          admin_notes?: string | null
          requested_at?: string
          processed_at?: string | null
        }
      }
      notices: {
        Row: {
          id: string
          title: string
          content: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          message?: string
          read?: boolean
          created_at?: string
        }
      }
      referral_code_requests: {
        Row: {
          id: string
          user_id: string
          status: ReferralRequestStatus
          requested_at: string
          processed_at: string | null
          processed_by: string | null
          admin_notes: string | null
          referral_code: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: ReferralRequestStatus
          requested_at?: string
          processed_at?: string | null
          processed_by?: string | null
          admin_notes?: string | null
          referral_code?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: ReferralRequestStatus
          requested_at?: string
          processed_at?: string | null
          processed_by?: string | null
          admin_notes?: string | null
          referral_code?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Admin-specific types
export interface AdminUser {
  id: string
  email: string
  role: 'admin'
}

export interface DashboardStats {
  totalUsers: number
  kycApproved: number
  referralCodesAssigned: number
  totalSalesAdded: number
  totalPaidToUsers: number
  pendingWithdrawals: number
  pendingReferralRequests: number
}

export interface UserWithWallet {
  id: string
  full_name: string
  phone: string
  aadhaar_name: string | null
  kyc_status: KycStatus
  referral_code: string | null
  aadhaar_url: string | null
  selfie_url: string | null
  profile_image: string | null
  created_at: string
  wallet?: {
    total_earnings: number
    available_balance: number
    pending_earnings: number
  }
}

export interface OrderWithUser {
  id: string
  buyer_name: string
  order_id: string
  product_names: string
  quantity: number
  price: number
  status: OrderStatus
  commission: number
  created_at: string
  user: {
    full_name: string
    referral_code: string | null
  }
}

export interface WithdrawalWithUser {
  id: string
  user_id: string
  amount: number
  status: WithdrawalStatus
  bank_details: any
  admin_notes: string | null
  requested_at: string
  processed_at: string | null
  user: {
    full_name: string
    phone: string
    referral_code: string | null
  }
}

export interface ReferralRequestWithUser {
  id: string
  user_id: string
  status: ReferralRequestStatus
  requested_at: string
  processed_at: string | null
  processed_by: string | null
  admin_notes: string | null
  referral_code: string | null
  user: {
    full_name: string
    phone: string
    kyc_status: KycStatus
  }
}

// Additional types
export interface Notice {
  id: string
  title: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Form types
export interface AddSaleForm {
  referral_code: string
  buyer_name: string
  product_name: string
  quantity: number
  order_id: string
  total_amount: number
  status: OrderStatus
}

export interface NoticeForm {
  title: string
  content: string
  is_active: boolean
}

export interface KYCApprovalForm {
  referral_code: string
  admin_notes?: string
}

// Dashboard stats interface
export interface DashboardStats {
  totalUsers: number
  kycApproved: number
  referralCodesAssigned: number
  totalSalesAdded: number
  totalPaidToUsers: number
  pendingWithdrawals: number
  pendingReferralRequests: number
}

// Extended types for admin queries
export interface UserWithWallet {
  id: string
  full_name: string
  phone: string
  aadhaar_name: string | null
  kyc_status: KycStatus
  referral_code: string | null
  aadhaar_url: string | null
  selfie_url: string | null
  profile_image: string | null
  created_at: string
  wallet?: {
    total_earnings: number
    available_balance: number
    pending_earnings: number
  }
}

export interface WithdrawalWithUser {
  id: string
  user_id: string
  amount: number
  status: WithdrawalStatus
  bank_details: any
  admin_notes: string | null
  requested_at: string
  processed_at: string | null
  user: {
    full_name: string
    phone: string
    referral_code: string | null
  }
}