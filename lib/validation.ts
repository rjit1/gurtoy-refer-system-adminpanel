// Comprehensive validation utilities for the application

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// File validation constants
export const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_AADHAAR_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  ALLOWED_SELFIE_TYPES: ['image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: {
    pdf: ['application/pdf'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    png: ['image/png']
  }
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email address is too long' }
  }
  
  return { isValid: true }
}

// Phone validation (Indian format)
export function validatePhone(phone: string): ValidationResult {
  const phoneRegex = /^[6-9]\d{9}$/
  
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' }
  }
  
  // Remove any spaces, dashes, or plus signs
  const cleanPhone = phone.replace(/[\s\-\+]/g, '')
  
  // Check if it starts with +91 and remove it
  const phoneNumber = cleanPhone.startsWith('91') && cleanPhone.length === 12 
    ? cleanPhone.substring(2) 
    : cleanPhone
  
  if (!phoneRegex.test(phoneNumber)) {
    return { isValid: false, error: 'Please enter a valid 10-digit Indian phone number' }
  }
  
  return { isValid: true }
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long (max 128 characters)' }
  }
  
  // Check for at least one uppercase, one lowercase, one number
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    }
  }
  
  return { isValid: true }
}

// Name validation
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, error: 'Name is required' }
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' }
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Name is too long (max 100 characters)' }
  }
  
  // Allow only letters, spaces, and common name characters
  const nameRegex = /^[a-zA-Z\s\.\-\']+$/
  if (!nameRegex.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, dots, hyphens, and apostrophes' }
  }
  
  return { isValid: true }
}

// File validation with enhanced security checks
export function validateFile(file: File, type: 'aadhaar' | 'selfie'): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'File is required' }
  }
  
  // Check file size
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    return { isValid: false, error: `File size must be under ${FILE_VALIDATION.MAX_SIZE / (1024 * 1024)}MB` }
  }
  
  if (file.size === 0) {
    return { isValid: false, error: 'File appears to be empty' }
  }
  
  // Check file type based on type parameter
  const allowedTypes = type === 'aadhaar' 
    ? FILE_VALIDATION.ALLOWED_AADHAAR_TYPES 
    : FILE_VALIDATION.ALLOWED_SELFIE_TYPES
  
  if (!allowedTypes.includes(file.type)) {
    const typeDescription = type === 'aadhaar' ? 'PDF, JPG, or PNG' : 'JPG or PNG'
    return { isValid: false, error: `File must be a ${typeDescription} file` }
  }
  
  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension) {
    return { isValid: false, error: 'File must have a valid extension' }
  }
  
  const expectedMimeTypes = FILE_VALIDATION.ALLOWED_EXTENSIONS[extension as keyof typeof FILE_VALIDATION.ALLOWED_EXTENSIONS]
  if (!expectedMimeTypes || !expectedMimeTypes.includes(file.type)) {
    return { isValid: false, error: 'File extension does not match file type' }
  }
  
  // Additional security checks
  if (file.name.length > 255) {
    return { isValid: false, error: 'Filename is too long' }
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|pif|com)$/i,
    /\.(js|vbs|jar|app)$/i,
    /\.(php|asp|jsp|py|rb)$/i
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return { isValid: false, error: 'File type not allowed for security reasons' }
    }
  }
  
  return { isValid: true }
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

// Amount validation for withdrawals
export function validateAmount(amount: number, minAmount: number = 500): ValidationResult {
  if (!amount || amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' }
  }
  
  if (amount < minAmount) {
    return { isValid: false, error: `Minimum amount is ₹${minAmount}` }
  }
  
  if (amount > 1000000) { // 10 lakh max
    return { isValid: false, error: 'Amount exceeds maximum limit of ₹10,00,000' }
  }
  
  // Check for reasonable decimal places (max 2)
  if (amount.toString().split('.')[1]?.length > 2) {
    return { isValid: false, error: 'Amount can have maximum 2 decimal places' }
  }
  
  return { isValid: true }
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Bank account validation
export function validateBankAccount(accountNumber: string): ValidationResult {
  if (!accountNumber) {
    return { isValid: false, error: 'Bank account number is required' }
  }

  // Remove spaces and special characters
  const cleanAccountNumber = accountNumber.replace(/[\s\-]/g, '')

  // Check length (Indian bank accounts are typically 9-18 digits)
  if (cleanAccountNumber.length < 9 || cleanAccountNumber.length > 18) {
    return { isValid: false, error: 'Bank account number must be 9-18 digits long' }
  }

  // Check if it contains only numbers
  if (!/^\d+$/.test(cleanAccountNumber)) {
    return { isValid: false, error: 'Bank account number can only contain numbers' }
  }

  return { isValid: true }
}

// IFSC code validation
export function validateIFSC(ifsc: string): ValidationResult {
  if (!ifsc) {
    return { isValid: false, error: 'IFSC code is required' }
  }

  // IFSC format: 4 letters + 7 characters (letters/numbers)
  const ifscRegex = /^[A-Z]{4}[A-Z0-9]{7}$/
  const cleanIFSC = ifsc.toUpperCase().replace(/\s/g, '')

  if (!ifscRegex.test(cleanIFSC)) {
    return { isValid: false, error: 'Invalid IFSC code format (e.g., SBIN0001234)' }
  }

  return { isValid: true }
}

// UPI ID validation
export function validateUPI(upiId: string): ValidationResult {
  if (!upiId) {
    return { isValid: true } // UPI is optional
  }

  // UPI format: username@provider
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/

  if (!upiRegex.test(upiId)) {
    return { isValid: false, error: 'Invalid UPI ID format (e.g., user@paytm)' }
  }

  return { isValid: true }
}

// Bank details validation
export function validateBankDetails(details: {
  account_holder: string
  account_number: string
  ifsc: string
  upi_id?: string
}): ValidationResult {
  const nameValidation = validateName(details.account_holder)
  if (!nameValidation.isValid) {
    return { isValid: false, error: `Account holder name: ${nameValidation.error}` }
  }

  const accountValidation = validateBankAccount(details.account_number)
  if (!accountValidation.isValid) return accountValidation

  const ifscValidation = validateIFSC(details.ifsc)
  if (!ifscValidation.isValid) return ifscValidation

  if (details.upi_id) {
    const upiValidation = validateUPI(details.upi_id)
    if (!upiValidation.isValid) return upiValidation
  }

  return { isValid: true }
}

// Validate and sanitize form data
export function validateRegistrationForm(data: {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}): ValidationResult {
  const nameValidation = validateName(data.fullName)
  if (!nameValidation.isValid) return nameValidation

  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) return emailValidation

  const phoneValidation = validatePhone(data.phone)
  if (!phoneValidation.isValid) return phoneValidation

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) return passwordValidation

  if (data.password !== data.confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }

  return { isValid: true }
}
