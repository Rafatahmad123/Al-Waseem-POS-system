'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, User } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { createSale } from '@/app/actions/sales'
import { formatCurrency, getExchangeRate, usdToSyp } from '@/lib/pricing'

// نستخدم نفس واجهة المنتج التي تعتمد عليها قاعدة البيانات الجديدة
interface Product {
  id: string
  barcode: string
  name: string
  selling_price_usd: number
  selling_price_syp: number
  current_stock: number
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

  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalUSD, getTotalItems } = useCartStore()

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
    // التحقق المباشر من قاعدة البيانات (product.current_stock)
    const availableStock = product.current_stock || 0
    const cartItem = items.find((i) => i.productId === product.id)
    const currentQty = cartItem ? cartItem.quantity : 0

    if (currentQty >= availableStock) {
      setError(`المخزون غير كافٍ. المتاح: ${availableStock}`)
      setTimeout(() => setError(''), 3000)
      return
    }

    addItem({
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      sellingPriceUSD: product.selling_price_usd,
      sellingPriceSYP: 0, // سيتم حسابه في السلة
      currentStock: availableStock,
    })
    setError('')
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
                <p>المخزون: {p.current_stock}</p>
                <p className="text-blue-600 font-semibold">
                  ${p.selling_price_usd.toFixed(2)}
                </p>
                <p className="text-indigo-600 font-semibold">
                  {p.selling_price_syp.toLocaleString()} SYP
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 border rounded shadow">
          <h3 className="font-bold mb-4">السلة</h3>
          
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
          {items.map(item => (
            <div key={item.productId} className="flex justify-between mb-2">
              <div className="flex-1">
                <div>{item.name} x {item.quantity}</div>
                <div className="text-sm text-slate-600">
                  ${(item.sellingPriceUSD * item.quantity).toFixed(2)}
                </div>
                <div className="text-sm text-indigo-600">
                  {(item.sellingPriceUSD * item.quantity * exchangeRate).toLocaleString()} SYP
                </div>
              </div>
              <button onClick={() => removeItem(item.productId)} className="text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
          
          {/* Total */}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
              <span>الإجمالي:</span>
              <div className="text-right">
                <div>${getTotalUSD().toFixed(2)}</div>
                <div className="text-indigo-600 font-semibold">
                  {(getTotalUSD() * exchangeRate).toLocaleString()} SYP
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