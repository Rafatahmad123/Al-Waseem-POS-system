'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '@/app/actions/products'
import { convertPrice, formatCurrency } from '@/lib/pricing'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  barcode: string
  name: string
  description: string | null
  category_id: string | null
  categories: Category | null
  cost_price: number
  selling_price_usd: number
  selling_price_syp: number
  current_stock: number
  min_stock_level: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProductsManagerProps {
  initialProducts: Product[]
  initialCategories: Category[]
}

export default function ProductsManager({
  initialProducts,
  initialCategories,
}: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>(Array.isArray(initialProducts) ? initialProducts : [])
  const [categories, setCategories] = useState<Category[]>(Array.isArray(initialCategories) ? initialCategories : [])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pricingMode, setPricingMode] = useState<'USD' | 'SYP'>('USD')
  const [exchangeRate, setExchangeRate] = useState<number>(12500)
  const [formPricingMode, setFormPricingMode] = useState<'SYP' | 'USD' | 'BOTH'>('BOTH')
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    cost_price: '',
    selling_price_usd: '',
    selling_price_syp: '',
    current_stock: '0',
    min_stock_level: '0',
    is_active: true,
  })

  // Auto-calculate selling prices when cost price changes
  const handleCostPriceChange = (value: string) => {
    const costPrice = parseFloat(value) || 0
    // Safeguard: cap cost price to prevent overflow
    const MAX_SAFE_COST_PRICE = 999999999999999.99 // NUMERIC(20,2) max value
    const safeCostPrice = Math.min(costPrice, MAX_SAFE_COST_PRICE)
    
    // Calculate prices based on selected pricing mode using centralized exchange rate
    if (formPricingMode === 'USD') {
      const autoSellingPriceUSD = safeCostPrice * 1.20 // 20% markup
      setFormData({
        ...formData,
        cost_price: value,
        selling_price_usd: autoSellingPriceUSD.toFixed(2),
        selling_price_syp: '',
      })
    } else if (formPricingMode === 'SYP') {
      const autoSellingPriceSYP = safeCostPrice * 1.20 // 20% markup (cost is in SYP)
      setFormData({
        ...formData,
        cost_price: value,
        selling_price_usd: '',
        selling_price_syp: autoSellingPriceSYP.toFixed(2),
      })
    } else {
      // BOTH mode - cost is in USD, calculate both prices
      const autoSellingPriceUSD = safeCostPrice * 1.20 // 20% markup
      const autoSellingPriceSYP = autoSellingPriceUSD * exchangeRate // Use centralized exchange rate
      setFormData({
        ...formData,
        cost_price: value,
        selling_price_usd: autoSellingPriceUSD.toFixed(2),
        selling_price_syp: autoSellingPriceSYP.toFixed(2),
      })
    }
  }
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch pricing mode and exchange rate on mount
  useEffect(() => {
    const fetchPricingSettings = async () => {
      try {
        const modeResponse = await fetch('/api/settings/pricing-mode')
        if (modeResponse.ok) {
          const modeData = await modeResponse.json()
          setPricingMode(modeData.mode || 'USD')
        }

        const rateResponse = await fetch('/api/settings/exchange-rate')
        if (rateResponse.ok) {
          const rateData = await rateResponse.json()
          setExchangeRate(rateData.rate || 12500)
        }
      } catch {
        // Silently fail - use defaults
      }
    }

    fetchPricingSettings()
  }, [])

  const filteredProducts = Array.isArray(products) ? products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  // Handle price field changes with automatic conversion
  const handlePriceChange = (
    field: 'selling_price_usd' | 'selling_price_syp',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0
    // Safeguard: cap price to prevent overflow
    const MAX_SAFE_PRICE = 999999999999999.99 // NUMERIC(20,2) max value
    const safeValue = Math.min(numValue, MAX_SAFE_PRICE)

    // Only sync prices in BOTH mode using centralized exchange rate
    if (formPricingMode === 'BOTH') {
      if (field === 'selling_price_usd') {
        setFormData({
          ...formData,
          selling_price_usd: value,
          selling_price_syp: convertPrice(safeValue, 'USD', 'SYP', exchangeRate).toFixed(2),
        })
      } else {
        setFormData({
          ...formData,
          selling_price_syp: value,
          selling_price_usd: convertPrice(safeValue, 'SYP', 'USD', exchangeRate).toFixed(2),
        })
      }
    } else {
      // In single currency mode, just update the field without syncing
      setFormData({
        ...formData,
        [field]: value,
      })
    }
  }

  // Handle pricing mode change - recalculate all prices
  const handlePricingModeChange = async (newMode: 'USD' | 'SYP') => {
    setPricingMode(newMode)

    // Recalculate form prices if form is open
    if (showForm && formData.selling_price_usd && formData.selling_price_syp) {
      const usdPrice = parseFloat(formData.selling_price_usd) || 0
      const sypPrice = parseFloat(formData.selling_price_syp) || 0

      if (newMode === 'USD' && sypPrice > 0) {
        setFormData({
          ...formData,
          selling_price_usd: convertPrice(sypPrice, 'SYP', 'USD', exchangeRate).toFixed(2),
        })
      } else if (newMode === 'SYP' && usdPrice > 0) {
        setFormData({
          ...formData,
          selling_price_syp: convertPrice(usdPrice, 'USD', 'SYP', exchangeRate).toFixed(2),
        })
      }
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value.toString())
    })

    const result = await createProduct(formDataObj)

    if (result.error) {
      setError(result.error)
    } else {
      setShowForm(false)
      resetForm()
      const updated = await getProducts()
      setProducts(updated)
    }

    setIsSubmitting(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formDataObj = new FormData()
    formDataObj.append('id', editingProduct!.id)
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value.toString())
    })

    const result = await updateProduct(formDataObj)

    if (result.error) {
      setError(result.error)
    } else {
      setEditingProduct(null)
      setShowForm(false)
      resetForm()
      const updated = await getProducts()
      setProducts(updated)
    }

    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      return
    }

    const result = await deleteProduct(id)
    if (result.error) {
      setError(result.error)
    } else {
      const updated = await getProducts()
      setProducts(updated)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    
    // Determine pricing mode based on existing prices
    let pricingMode: 'SYP' | 'USD' | 'BOTH' = 'BOTH'
    const hasUSD = product.selling_price_usd > 0
    const hasSYP = product.selling_price_syp > 0
    
    if (hasUSD && hasSYP) {
      pricingMode = 'BOTH'
    } else if (hasUSD) {
      pricingMode = 'USD'
    } else if (hasSYP) {
      pricingMode = 'SYP'
    }
    
    setFormPricingMode(pricingMode)
    setFormData({
      barcode: product.barcode,
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      cost_price: product.cost_price.toString(),
      selling_price_usd: product.selling_price_usd.toString(),
      selling_price_syp: product.selling_price_syp.toString(),
      current_stock: product.current_stock.toString(),
      min_stock_level: product.min_stock_level.toString(),
      is_active: product.is_active,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormPricingMode('BOTH')
    setFormData({
      barcode: '',
      name: '',
      description: '',
      category_id: '',
      cost_price: '',
      selling_price_usd: '',
      selling_price_syp: '',
      current_stock: '0',
      min_stock_level: '0',
      is_active: true,
    })
    setError('')
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
    resetForm()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">المنتجات</h2>
          <p className="text-slate-600 mt-1">إدارة مخزون المنتجات</p>
        </div>
        <div className="flex items-center gap-4">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              إضافة منتج
            </button>
          )}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-slate-700">وضع التسعير:</span>
            <button
              onClick={() => handlePricingModeChange('USD')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                pricingMode === 'USD'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              دولار
            </button>
            <button
              onClick={() => handlePricingModeChange('SYP')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                pricingMode === 'SYP'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ليرة
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingProduct ? 'تعديل المنتج' : 'منتج جديد'}
            </h3>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={editingProduct ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-slate-700 mb-1">
                  الباركود *
                </label>
                <input
                  type="text"
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 mb-1">
                التصنيف
              </label>
              <select
                id="category_id"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر تصنيفاً</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                الوصف
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="form_pricing_mode" className="block text-sm font-medium text-slate-700 mb-1">
                وضع التسعير
              </label>
              <select
                id="form_pricing_mode"
                value={formPricingMode}
                onChange={(e) => {
                  const newMode = e.target.value as 'SYP' | 'USD' | 'BOTH'
                  setFormPricingMode(newMode)
                  // Clear price fields when switching modes
                  if (newMode === 'USD') {
                    setFormData({ ...formData, selling_price_syp: '' })
                  } else if (newMode === 'SYP') {
                    setFormData({ ...formData, selling_price_usd: '' })
                  }
                  // Recalculate if cost price exists
                  if (formData.cost_price) {
                    handleCostPriceChange(formData.cost_price)
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BOTH">كلا العملتين (دولار وليرة)</option>
                <option value="USD">دولار فقط (USD)</option>
                <option value="SYP">ليرة فقط (SYP)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">اختر العملة التي تريد استخدامها لهذا المنتج</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cost_price" className="block text-sm font-medium text-slate-700 mb-1">
                  سعر التكلفة *
                </label>
                <input
                  type="number"
                  id="cost_price"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => handleCostPriceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">سيتم حساب سعر البيع تلقائياً (هامش ربح 20%)</p>
              </div>

              {formPricingMode === 'USD' || formPricingMode === 'BOTH' ? (
                <div>
                  <label htmlFor="selling_price_usd" className="block text-sm font-medium text-slate-700 mb-1">
                    سعر البيع (دولار) - تلقائي
                  </label>
                  <input
                    type="number"
                    id="selling_price_usd"
                    step="0.01"
                    value={formData.selling_price_usd}
                    onChange={(e) => handlePriceChange('selling_price_usd', e.target.value)}
                    readOnly={formPricingMode !== 'BOTH'}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formPricingMode !== 'BOTH' ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              ) : null}

              {formPricingMode === 'SYP' || formPricingMode === 'BOTH' ? (
                <div>
                  <label htmlFor="selling_price_syp" className="block text-sm font-medium text-slate-700 mb-1">
                    سعر البيع (ليرة) - تلقائي
                  </label>
                  <input
                    type="number"
                    id="selling_price_syp"
                    step="0.01"
                    value={formData.selling_price_syp}
                    onChange={(e) => handlePriceChange('selling_price_syp', e.target.value)}
                    readOnly={formPricingMode !== 'BOTH'}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formPricingMode !== 'BOTH' ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="current_stock" className="block text-sm font-medium text-slate-700 mb-1">
                  المخزون الحالي
                </label>
                <input
                  type="number"
                  id="current_stock"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="min_stock_level" className="block text-sm font-medium text-slate-700 mb-1">
                  الحد الأدنى للمخزون
                </label>
                <input
                  type="number"
                  id="min_stock_level"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label
                htmlFor="is_active"
                className="mr-2 block text-sm text-slate-700"
              >
                نشط
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'جاري الحفظ...' : editingProduct ? 'تحديث' : 'إنشاء'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث عن المنتجات بالاسم أو الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  الباركود
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  الاسم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  التصنيف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  سعر البيع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  المخزون
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    لا توجد منتجات حالياً. ابدأ بإضافة أول منتج.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  return (
                    <tr key={product?.id ?? ''} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{product?.barcode ?? ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{product?.name ?? ''}</div>
                        {product?.description && (
                          <div className="text-sm text-slate-500">{product.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
                          {product?.categories?.name ?? '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          ${(product?.selling_price_usd ?? 0).toFixed(2)} / {((product?.selling_price_usd ?? 0) * exchangeRate).toLocaleString()} SYP
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {product?.current_stock ?? 0}
                          {(product?.current_stock ?? 0) <= (product?.min_stock_level ?? 0) && (
                            <span className="mr-2 text-xs text-red-600 font-medium">
                              (منخفض)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product?.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product?.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 ml-3"
                        >
                          <Pencil className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(product?.id ?? '')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
