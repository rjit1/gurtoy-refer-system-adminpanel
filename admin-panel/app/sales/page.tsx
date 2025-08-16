'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase/client'
import { AddSaleForm, UserWithWallet, OrderStatus } from '@/lib/supabase/types'
import { formatCurrency, maskName } from '@/lib/utils'
import { validateSaleForm, sanitizeInput } from '@/lib/validation'
import { updateUserWalletAfterOrder } from '@/lib/wallet-utils'
import { 
  Search, 
  ShoppingCart, 
  User, 
  Hash, 
  Package,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function AddSalePage() {
  const [form, setForm] = useState<AddSaleForm>({
    referral_code: '',
    buyer_name: '',
    product_name: '',
    quantity: 1,
    order_id: '',
    total_amount: 0,
    status: 'pending'
  })
  const [foundUser, setFoundUser] = useState<UserWithWallet | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const searchUser = async () => {
    if (!form.referral_code.trim()) {
      setError('Please enter a referral code')
      return
    }

    setSearching(true)
    setError('')
    setFoundUser(null)

    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          wallets (
            total_earnings,
            available_balance,
            pending_earnings
          )
        `)
        .eq('referral_code', form.referral_code.trim())
        .eq('kyc_status', 'approved')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('No approved user found with this referral code')
        } else {
          throw error
        }
        return
      }

      const user: UserWithWallet = {
        ...data,
        wallet: data.wallets?.[0] || undefined
      }

      setFoundUser(user)
    } catch (err: any) {
      setError('Error searching for user: ' + err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!foundUser) {
      setError('Please search and select a user first')
      return
    }

    // Enhanced validation using validation utility
    const sanitizedForm = {
      referral_code: sanitizeInput(form.referral_code),
      buyer_name: sanitizeInput(form.buyer_name),
      product_name: sanitizeInput(form.product_name),
      quantity: form.quantity,
      order_id: sanitizeInput(form.order_id),
      total_amount: form.total_amount
    }

    const validation = validateSaleForm(sanitizedForm)
    if (!validation.isValid) {
      setError(validation.error || 'Validation failed')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Calculate commission (5%)
      const commission = sanitizedForm.total_amount * 0.05

      // Create the order using sanitized data
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: foundUser.id,
          buyer_name: maskName(sanitizedForm.buyer_name),
          order_id: sanitizedForm.order_id,
          product_names: sanitizedForm.product_name,
          quantity: sanitizedForm.quantity,
          price: sanitizedForm.total_amount,
          status: form.status,
          commission: form.status === 'delivered' ? commission : 0
        })

      if (orderError) throw orderError

      // Update wallet using the utility function
      const walletUpdateSuccess = await updateUserWalletAfterOrder(
        foundUser.id,
        sanitizedForm.total_amount,
        form.status
      )

      if (!walletUpdateSuccess) {
        console.warn('Failed to update wallet, but order was created successfully')
      }

      // Create notification for commission
      await supabase
        .from('notifications')
        .insert({
          user_id: foundUser.id,
          type: 'commission_added',
          title: 'Commission Earned',
          message: `You earned ${formatCurrency(commission)} commission from order ${form.order_id}`
        })

      setSuccess(`Sale added successfully! ${form.status === 'delivered' ? `Commission of ${formatCurrency(commission)} credited to user.` : 'Commission will be credited when order is delivered.'}`)

      // Reset form
      setForm({
        referral_code: '',
        buyer_name: '',
        product_name: '',
        quantity: 1,
        order_id: '',
        total_amount: 0,
        status: 'pending'
      })
      setFoundUser(null)

    } catch (err: any) {
      setError('Error adding sale: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AddSaleForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Referral Sale</h1>
          <p className="mt-2 text-gray-600">
            Add a new sale and credit commission to the referrer. Follow the 2-step process below.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              !foundUser ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              1
            </div>
            <span className={`font-medium ${!foundUser ? 'text-blue-900' : 'text-green-900'}`}>
              Select Commission Recipient
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              !foundUser ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white'
            }`}>
              2
            </div>
            <span className={`font-medium ${!foundUser ? 'text-gray-500' : 'text-blue-900'}`}>
              Enter Sale Details
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: Select Commission Recipient */}
          <Card className={foundUser ? 'border-green-300 bg-green-50' : 'border-blue-300'}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5 text-blue-600" />
                Step 1: Select Commission Recipient
              </CardTitle>
              <CardDescription>
                <strong>Important:</strong> Enter the referral code of the user who will receive commission for this sale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="referralCode">Referral Code</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="referralCode"
                    placeholder="Enter referral code"
                    value={form.referral_code}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('referral_code', e.target.value)}
                  />
                  <Button
                    onClick={searchUser}
                    disabled={searching || !form.referral_code.trim()}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {foundUser && (
                <div className="p-4 bg-green-100 border-2 border-green-300 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-green-900">✓ Commission Recipient Selected</p>
                      <p className="font-medium text-green-800">{foundUser.full_name}</p>
                      <p className="text-sm text-green-700">Phone: {foundUser.phone}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Hash className="h-3 w-3 text-green-700" />
                        <span className="text-sm font-mono text-green-800 font-medium">{foundUser.referral_code}</span>
                      </div>
                      {foundUser.wallet && (
                        <p className="text-xs text-green-600 mt-1">
                          Current Balance: {formatCurrency(foundUser.wallet.available_balance)}
                        </p>
                      )}
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 p-2 bg-green-200 rounded text-center">
                    <p className="text-sm font-medium text-green-800">
                      🎯 This user will receive 5% commission from the sale
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Sale Form */}
          <Card className={!foundUser ? 'opacity-50' : 'border-blue-300'}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5 text-orange-600" />
                Step 2: Enter Sale Details
              </CardTitle>
              <CardDescription>
                {foundUser
                  ? `Commission will be credited to: ${foundUser.full_name} (${foundUser.referral_code})`
                  : 'Please select a commission recipient first'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!foundUser && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-800">
                      Please complete Step 1 first to select who will receive the commission
                    </p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="buyerName">Buyer Name</Label>
                  <Input
                    id="buyerName"
                    placeholder="Enter buyer's full name"
                    value={form.buyer_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('buyer_name', e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Name will be masked as R***i for privacy
                  </p>
                </div>

                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="Enter product name"
                    value={form.product_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('product_name', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalAmount">Total Amount (₹)</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.total_amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="Enter order ID"
                    value={form.order_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('order_id', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => handleInputChange('status', e.target.value as OrderStatus)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Commission (5%) will be credited only when status is &quot;Delivered&quot;
                  </p>
                </div>

                {form.total_amount > 0 && foundUser && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span className="text-lg font-bold text-blue-900">
                          Commission: {formatCurrency(form.total_amount * 0.05)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-800">Will be credited to:</p>
                        <p className="text-sm font-bold text-green-900">{foundUser.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-700">
                        {form.status === 'delivered'
                          ? '✓ Will be credited immediately'
                          : '⏳ Will be credited when order is delivered'
                        }
                      </span>
                      <span className="text-green-700 font-medium">
                        Code: {foundUser.referral_code}
                      </span>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !foundUser}
                >
                  {loading ? 'Adding Sale...' : 'Add Sale'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  )
}