'use client'

import { useState, useEffect } from 'react'
import { Search, ArrowLeft, Package, Plus, Minus, Trash2, ShoppingCart, Scale } from 'lucide-react'
import Link from 'next/link'
import { processDirectReturn } from '@/app/actions/sales'

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

interface ReturnItem {
  productId: string
  barcode: string
  name: string
  sellingPriceUSD: number
  sellingPriceSYP: number
  quantity: number
  isBulk: boolean
}

export default function ReturnsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notes, setNotes] = useState('')
  const [exchangeRate, setExchangeRate] = useState<number>(12500)

  useEffect(() => {
    fetchProducts()
    fetchExchangeRate()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

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

  const filteredProducts = products.filter(
    (product) =>
      product.is_active &&
      (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddToReturn = (product: Product) => {
    const existingItem = returnItems.find((item) => item.productId === product.id)
    
    if (existingItem) {
      // Increment quantity for existing item
      setReturnItems((prev) =>
        prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + (product.is_bulk ? 0.5 : 1) }
            : item
        )
      )
    } else {
      // Add new item
      setReturnItems((prev) => [
        ...prev,
        {
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          sellingPriceUSD: product.selling_price_usd,
          sellingPriceSYP: product.selling_price_syp || (product.selling_price_usd * exchangeRate),
          quantity: product.is_bulk ? 0.5 : 1,
          isBulk: product.is_bulk,
        },
      ])
    }
    setSearchQuery('')
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setReturnItems((prev) => prev.filter((item) => item.productId !== productId))
      return
    }

    setReturnItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const handlePriceChange = (productId: string, newPriceUSD: number, newPriceSYP: number) => {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, sellingPriceUSD: newPriceUSD, sellingPriceSYP: newPriceSYP }
          : item
      )
    )
  }

  const handleRemoveItem = (productId: string) => {
    setReturnItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const handleReturnSubmit = async () => {
    if (returnItems.length === 0) {
      setError('Please add at least one item to return')
      return
    }

    setIsProcessing(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('items', JSON.stringify(returnItems))
      formData.append('notes', notes)

      const result = await processDirectReturn(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(result.message || 'Return processed successfully!')
        setReturnItems([])
        setNotes('')
      }
    } catch (error) {
      setError('Failed to process return')
    } finally {
      setIsProcessing(false)
    }
  }

  const calculateReturnTotal = () => {
    return returnItems.reduce(
      (sum, item) => sum + item.sellingPriceUSD * item.quantity,
      0
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sales" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">مرتجع المبيعات</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <input
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="ابحث عن منتج أو امسح الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border p-4 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleAddToReturn(product)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{product.name}</h3>
                    <p className="text-sm text-slate-600">المخزون: {product.current_stock} {product.is_bulk ? 'kg' : ''}</p>
                    {product.is_bulk && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">بيع بالوزن</span>
                    )}
                  </div>
                  <Scale className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="mt-2">
                  <p className="text-blue-600 font-semibold">
                    ${product.selling_price_usd.toFixed(2)}
                  </p>
                  <p className="text-indigo-600 font-semibold">
                    {(product.selling_price_syp || (product.selling_price_usd * exchangeRate)).toLocaleString()} SYP
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 border rounded-lg shadow">
          <h3 className="font-bold mb-4">المنتجات المرتجعة</h3>

          {returnItems.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p>لا توجد منتجات في قائمة المرتجع</p>
            </div>
          ) : (
            <>
              {returnItems.map((item) => (
                <div key={item.productId} className="flex justify-between mb-3 border-b pb-3">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-600">{item.barcode}</div>
                    
                    {/* USD Price Input */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-slate-600">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.sellingPriceUSD.toFixed(2)}
                        onChange={(e) => {
                          const newPriceUSD = parseFloat(e.target.value) || 0
                          const newPriceSYP = newPriceUSD * exchangeRate
                          handlePriceChange(item.productId, newPriceUSD, newPriceSYP)
                        }}
                        className="w-20 p-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">
                        {item.isBulk ? '/kg' : ''}
                      </span>
                    </div>
                    
                    {/* SYP Price Input */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-indigo-600">SYP</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={Math.round(item.sellingPriceSYP)}
                        onChange={(e) => {
                          const newPriceSYP = parseFloat(e.target.value) || 0
                          const newPriceUSD = newPriceSYP / exchangeRate
                          handlePriceChange(item.productId, newPriceUSD, newPriceSYP)
                        }}
                        className="w-24 p-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity - (item.isBulk ? 0.5 : 1))}
                        className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center hover:bg-slate-300"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-16 text-center font-medium">
                        {item.quantity} {item.isBulk ? 'kg' : ''}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity + (item.isBulk ? 0.5 : 1))}
                        className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center hover:bg-slate-300"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      ${(item.sellingPriceUSD * item.quantity).toFixed(2)}
                    </div>
                    <div className="text-sm text-indigo-600">
                      {(item.sellingPriceSYP * item.quantity).toLocaleString()} SYP
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="text-red-500 hover:text-red-700 mt-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-3 mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="أضف ملاحظات حول المرتجع..."
                />
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>المبلغ المرتجع:</span>
                  <div className="text-right">
                    <div>${calculateReturnTotal().toFixed(2)}</div>
                    <div className="text-indigo-600 font-semibold">
                      {(calculateReturnTotal() * exchangeRate).toLocaleString()} SYP
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleReturnSubmit}
                disabled={isProcessing || returnItems.length === 0}
                className="w-full bg-indigo-600 text-white p-3 mt-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'جاري المعالجة...' : 'تأكيد المرتجع'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
