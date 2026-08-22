'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, User, X } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { createSale } from '@/app/actions/sales'
import { formatCurrency, getExchangeRate, usdToSyp } from '@/lib/pricing'
import { normalizeNumberInput } from '@/lib/numberNormalization'

// نستخدم نفس واجهة المنتج التي تعتمد عليها قاعدة البيانات الجديدة
interface Product {
  id: string
  barcode: string
  name: string
  selling_price_usd: number
  selling_price_syp: number
  current_stock: number
  is_bulk: boolean
  is_active: boolean
}

interface Customer {
  id: string
  name: string
  phone: string | null
  current_balance: number
}

interface SalesManagerProps {
  initialProducts: Product[]
}

export default function SalesManager({ initialProducts }: SalesManagerProps) {
  const [products] = useState<Product[]>(initialProducts)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [paymentType, setPaymentType] = useState<'Cash' | 'Credit'>('Cash')
  const [exchangeRate, setExchangeRate] = useState<number>(12500)
  const [showWeightPopover, setShowWeightPopover] = useState(false)
  const [selectedBulkProduct, setSelectedBulkProduct] = useState<Product | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const weightInputRef = useRef<HTMLInputElement>(null)

  const { items, addItem, removeItem, updateQuantity, updateItemPrice, clearCart, getTotalUSD, getTotalSYP, getTotalItems } = useCartStore()

  // Fetch customers and exchange rate on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers')
        if (response.ok) {
          const data = await response.json()
          setCustomers(data)
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error)
      }
    }
    fetchCustomers()

    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('/api/settings/exchange-rate')
        if (response.ok) {
          const data = await response.json()
          setExchangeRate(data.rate || 12500)
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
      }
    }
    fetchExchangeRate()
  }, [])

  const filteredProducts = products.filter(
    (product) =>
      product.is_active &&
      (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddToCart = (product: Product) => {
    // Check if product is bulk item
    if (product.is_bulk) {
      setSelectedBulkProduct(product)
      setShowWeightPopover(true)
      setWeightInput('0.5') // Set reasonable default weight
      return
    }

    // التحقق المباشر من قاعدة البيانات (product.current_stock)
    const availableStock = product.current_stock || 0
    const cartItem = items.find((i) => i.productId === product.id)
    const currentQty = cartItem ? cartItem.quantity : 0

    if (currentQty >= availableStock) {
      setError(`المخزون غير كافٍ. المتاح: ${availableStock}`)
      setTimeout(() => setError(''), 3000)
      return
    }

    // Calculate SYP price for the item
    const sellingPriceSYP = product.selling_price_syp || (product.selling_price_usd * exchangeRate)

    addItem({
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      sellingPriceUSD: product.selling_price_usd,
      sellingPriceSYP: sellingPriceSYP,
      currentStock: availableStock,
    })
    setError('')
  }

  const handleWeightSubmit = useCallback(async (directWeight?: number) => {
    if (!selectedBulkProduct || isAddingToCart) return

    setIsAddingToCart(true)
    setError('')

    // If direct weight is provided (from quick buttons), use it directly
    let finalWeight: number
    if (directWeight !== undefined && directWeight > 0) {
      finalWeight = directWeight
    } else {
      // Read value directly from ref instead of relying on async state
      const inputValue = weightInputRef.current?.value || weightInput
      
      // Parse weight as float to handle decimal values like 0.5, 1.25
      const weight = parseFloat(inputValue) || 0
      
      // Apply normalization to handle Arabic numerals and comma decimals
      const normalizedWeight = normalizeNumberInput(inputValue)
      
      // Use the normalized weight if it's valid, otherwise use the direct parse
      finalWeight = !isNaN(normalizedWeight) ? normalizedWeight : weight
    }
    
    // STRICT VALIDATION DISABLED - Allow any positive value to proceed
    // Only reject if truly invalid or non-positive
    if (isNaN(finalWeight) || finalWeight <= 0) {
      setError('الرجاء إدخال وزن صحيح أكبر من 0')
      setTimeout(() => setError(''), 3000)
      setIsAddingToCart(false)
      return
    }

    const availableStock = selectedBulkProduct.current_stock || 0
    const cartItem = items.find((i) => i.productId === selectedBulkProduct.id)
    const currentQty = cartItem ? cartItem.quantity : 0

    if (currentQty + finalWeight > availableStock) {
      setError(`المخزون غير كافٍ. المتاح: ${availableStock} kg`)
      setTimeout(() => setError(''), 3000)
      setIsAddingToCart(false)
      return
    }

    // Calculate SYP price for the item
    const sellingPriceSYP = selectedBulkProduct.selling_price_syp || (selectedBulkProduct.selling_price_usd * exchangeRate)

    // Log the final weight to verify correct parsing
    console.log('Adding bulk item to cart with weight:', finalWeight, 'kg')

    // Add item to cart with proper weight and SYP price
    // Note: quantity is passed as second parameter, not in the item object
    addItem({
      productId: selectedBulkProduct.id,
      barcode: selectedBulkProduct.barcode,
      name: selectedBulkProduct.name,
      sellingPriceUSD: selectedBulkProduct.selling_price_usd,
      sellingPriceSYP: sellingPriceSYP,
      currentStock: availableStock,
    }, finalWeight)

    // Ensure state is updated before closing popover
    await new Promise(resolve => setTimeout(resolve, 100))

    setShowWeightPopover(false)
    setSelectedBulkProduct(null)
    setWeightInput('')
    setIsAddingToCart(false)
    setError('') // Clear error state immediately on success
  }, [selectedBulkProduct, isAddingToCart, items, addItem, exchangeRate])

  const handleWeightCancel = () => {
    setShowWeightPopover(false)
    setSelectedBulkProduct(null)
    setWeightInput('')
    setError('') // Clear any error state when canceling
  }

  const handleCheckout = async () => {
    if (items.length === 0) return

    // Validate credit sale requirements
    if (paymentType === 'Credit' && !selectedCustomer) {
      setError('يجب اختيار عميل للمبيعات الآجلة')
      setTimeout(() => setError(''), 3000)
      return
    }

    setIsProcessing(true)
    const formData = new FormData()
    formData.append('items', JSON.stringify(items))
    formData.append('payment_method', 'cash')
    formData.append('customer_id', selectedCustomer)
    formData.append('payment_type', paymentType)

    const result = await createSale(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('تمت العملية بنجاح!')
      clearCart()
      setSelectedCustomer('')
      setPaymentType('Cash')
      setTimeout(() => setSuccess(''), 3000)
    }
    setIsProcessing(false)
  }

  return (
    <div className="space-y-6">
      {/* عرض رسائل الخطأ والنجاح */}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <input
            className="w-full p-2 border rounded"
            placeholder="ابحث عن منتج..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {filteredProducts.map((p) => (
              <div key={p.id} className="border p-4 rounded cursor-pointer hover:bg-slate-50" onClick={() => handleAddToCart(p)}>
                <h3 className="font-bold">{p.name}</h3>
                <p>المخزون: {p.current_stock} {p.is_bulk ? 'kg' : ''}</p>
                {p.is_bulk && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">بيع بالوزن</span>}
                <p className="text-blue-600 font-semibold">
                  ${p.selling_price_usd.toFixed(2)}
                </p>
                <p className="text-indigo-600 font-semibold">
                  {p.selling_price_syp.toLocaleString('en-US')} SYP
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 border rounded shadow relative">
          <h3 className="font-bold mb-4">السلة</h3>
          
          {/* Compact Weight Input Popover for Bulk Items */}
          {showWeightPopover && selectedBulkProduct && (
            <div className="absolute top-16 right-0 z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-4 w-64 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-slate-900">{selectedBulkProduct.name}</h4>
                <button 
                  onClick={handleWeightCancel}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>
              
              <p className="text-xs text-slate-600 mb-2">
                متاح: {selectedBulkProduct.current_stock} kg
              </p>
              
              <div className="flex gap-2 mb-3">
                <input
                  ref={weightInputRef}
                  type="text"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="flex-1 p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  placeholder="0.5"
                  autoFocus
                  disabled={isAddingToCart}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleWeightSubmit()
                    } else if (e.key === 'Escape') {
                      handleWeightCancel()
                    }
                  }}
                />
                <button
                  onClick={() => handleWeightSubmit()}
                  disabled={isAddingToCart}
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {isAddingToCart ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Plus size={16} />
                  )}
                </button>
              </div>
              
              {/* Quick weight buttons */}
              <div className="flex gap-1 flex-wrap">
                {[0.5, 1, 1.5, 2].map((weight) => (
                  <button
                    key={weight}
                    onClick={async () => {
                      if (isAddingToCart) return
                      setWeightInput(weight.toString())
                      await handleWeightSubmit(weight) // Pass weight directly to avoid state timing issues
                    }}
                    disabled={isAddingToCart}
                    className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700 disabled:opacity-50"
                  >
                    {weight}kg
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Customer Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <User className="inline h-4 w-4 ml-1" />
              العميل (اختياري)
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">بدون عميل (نقدي)</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              نوع الدفع
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('Cash')}
                className={`flex-1 p-2 rounded border ${
                  paymentType === 'Cash'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                نقدي
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('Credit')}
                className={`flex-1 p-2 rounded border ${
                  paymentType === 'Credit'
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
                disabled={!selectedCustomer}
              >
                آجل
              </button>
            </div>
            {paymentType === 'Credit' && selectedCustomer && (
              <p className="text-sm text-slate-600 mt-2">
                الرصيد الحالي: ${(customers.find(c => c.id === selectedCustomer)?.current_balance || 0).toFixed(2)}
              </p>
            )}
          </div>

          {/* Cart Items */}
          {items.map(item => {
            const product = products.find(p => p.id === item.productId)
            const isBulk = product?.is_bulk || false
            const itemTotalUSD = item.sellingPriceUSD * item.quantity
            const itemTotalSYP = item.sellingPriceSYP * item.quantity
            return (
              <div key={item.productId} className="flex justify-between mb-2">
                <div className="flex-1">
                  <div>{item.name} x {item.quantity} {isBulk ? 'kg' : ''}</div>
                  
                  {/* USD Price Input */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.sellingPriceUSD.toFixed(2)}
                      onChange={(e) => {
                        const newPriceUSD = parseFloat(e.target.value) || 0
                        const newPriceSYP = newPriceUSD * exchangeRate
                        updateItemPrice(item.productId, newPriceUSD, newPriceSYP)
                      }}
                      className="w-20 p-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">
                      = ${itemTotalUSD.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* SYP Price Input */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-indigo-600">SYP</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={item.sellingPriceSYP > 0 ? Math.round(item.sellingPriceSYP) : Math.round(item.sellingPriceUSD * exchangeRate)}
                      onChange={(e) => {
                        const newPriceSYP = parseFloat(e.target.value) || 0
                        const newPriceUSD = newPriceSYP / exchangeRate
                        updateItemPrice(item.productId, newPriceUSD, newPriceSYP)
                      }}
                      className="w-24 p-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-indigo-600">
                      = {itemTotalSYP > 0 ? itemTotalSYP.toLocaleString() : (itemTotalUSD * exchangeRate).toLocaleString()} SYP
                    </span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-red-500"><Trash2 size={16}/></button>
              </div>
            )
          })}
          
          {/* Total */}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
              <span>الإجمالي:</span>
              <div className="text-right">
                <div>${getTotalUSD().toFixed(2)}</div>
                <div className="text-indigo-600 font-semibold">
                  {getTotalSYP() > 0 ? getTotalSYP().toLocaleString() : (getTotalUSD() * exchangeRate).toLocaleString()} SYP
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCheckout} 
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white p-2 mt-4 rounded disabled:bg-slate-400"
          >
            {isProcessing ? 'جاري المعالجة...' : paymentType === 'Credit' ? 'بيع آجل' : 'إتمام البيع'}
          </button>
        </div>
      </div>
    </div>
  )
}