// Admin panel validation utilities
export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Input sanitization
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .slice(0, 1000) // Limit length
}

// Referral code validation
export function validateReferralCode(code: string): ValidationResult {
  if (!code) {
    return { isValid: false, error: 'Referral code is required' }
  }
  
  // Referral codes should be alphanumeric, 6-12 characters
  const codeRegex = /^[A-Z0-9]{6,12}$/
  if (!codeRegex.test(code)) {
    return { isValid: false, error: 'Referral code must be 6-12 characters long and contain only uppercase letters and numbers' }
  }
  
  return { isValid: true }
}

// Buyer name validation
export function validateBuyerName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Buyer name is required' }
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Buyer name must be at least 2 characters long' }
  }
  
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Buyer name must be less than 100 characters' }
  }
  
  // Allow letters, spaces, dots, and common name characters
  const nameRegex = /^[a-zA-Z\s\.\-']+$/
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: 'Buyer name can only contain letters, spaces, dots, hyphens, and apostrophes' }
  }
  
  return { isValid: true }
}

// Product name validation
export function validateProductName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Product name is required' }
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Product name must be at least 2 characters long' }
  }
  
  if (name.trim().length > 200) {
    return { isValid: false, error: 'Product name must be less than 200 characters' }
  }
  
  return { isValid: true }
}

// Quantity validation
export function validateQuantity(quantity: number): ValidationResult {
  if (!quantity || quantity <= 0) {
    return { isValid: false, error: 'Quantity must be greater than 0' }
  }
  
  if (quantity > 1000) {
    return { isValid: false, error: 'Quantity cannot exceed 1000' }
  }
  
  if (!Number.isInteger(quantity)) {
    return { isValid: false, error: 'Quantity must be a whole number' }
  }
  
  return { isValid: true }
}

// Order ID validation
export function validateOrderId(orderId: string): ValidationResult {
  if (!orderId || orderId.trim().length === 0) {
    return { isValid: false, error: 'Order ID is required' }
  }
  
  if (orderId.trim().length < 3) {
    return { isValid: false, error: 'Order ID must be at least 3 characters long' }
  }
  
  if (orderId.trim().length > 50) {
    return { isValid: false, error: 'Order ID must be less than 50 characters' }
  }
  
  // Allow alphanumeric characters, hyphens, and underscores
  const orderIdRegex = /^[a-zA-Z0-9\-_]+$/
  if (!orderIdRegex.test(orderId.trim())) {
    return { isValid: false, error: 'Order ID can only contain letters, numbers, hyphens, and underscores' }
  }
  
  return { isValid: true }
}

// Amount validation
export function validateAmount(amount: number, minAmount: number = 1): ValidationResult {
  if (!amount || amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' }
  }
  
  if (amount < minAmount) {
    return { isValid: false, error: `Minimum amount is ₹${minAmount}` }
  }
  
  if (amount > 10000000) { // 1 crore max
    return { isValid: false, error: 'Amount exceeds maximum limit of ₹1,00,00,000' }
  }
  
  // Check for reasonable decimal places (max 2)
  if (amount.toString().split('.')[1]?.length > 2) {
    return { isValid: false, error: 'Amount can have maximum 2 decimal places' }
  }
  
  return { isValid: true }
}

// Validate sale form
export function validateSaleForm(form: {
  referral_code: string
  buyer_name: string
  product_name: string
  quantity: number
  order_id: string
  total_amount: number
}): ValidationResult {
  const referralValidation = validateReferralCode(form.referral_code)
  if (!referralValidation.isValid) return referralValidation
  
  const buyerValidation = validateBuyerName(form.buyer_name)
  if (!buyerValidation.isValid) return buyerValidation
  
  const productValidation = validateProductName(form.product_name)
  if (!productValidation.isValid) return productValidation
  
  const quantityValidation = validateQuantity(form.quantity)
  if (!quantityValidation.isValid) return quantityValidation
  
  const orderValidation = validateOrderId(form.order_id)
  if (!orderValidation.isValid) return orderValidation
  
  const amountValidation = validateAmount(form.total_amount)
  if (!amountValidation.isValid) return amountValidation
  
  return { isValid: true }
}
