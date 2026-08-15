'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Search, AlertTriangle } from 'lucide-react'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/app/actions/products'
import { convertPrice } from '@/lib/pricing'

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
  expiry_date: string | null // <-- أضفنا حقل الصلاحية هنا
  is_bulk: boolean
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
    expiry_date: '', // <-- أضفنا خانة الصلاحية في النموذج
    is_bulk: false,
    is_active: true,
  })

  // بقية الدوال (handleCostPriceChange, handlePriceChange, إلخ...) تبقى كما هي...
  // تأكد من تمرير expiry_date ضمن formData عند الإرسال إلى createProduct / updateProduct

  const handleCostPriceChange = (value: string) => {
    const costPrice = parseFloat(value) || 0
    const MAX_SAFE_COST_PRICE = 999999999999999.99
    const safeCostPrice = Math.min(costPrice, MAX_SAFE_COST_PRICE)
    
    if (formPricingMode === 'USD') {
      const autoSellingPriceUSD = safeCostPrice * 1.20
      setFormData((prev) => ({
        ...prev,
        cost_price: value,
        selling_price_usd: autoSellingPriceUSD.toFixed(2),
        selling_price_syp: '',
      }))
    } else if (formPricingMode === 'SYP') {
      const autoSellingPriceSYP = safeCostPrice * 1.20
      setFormData((prev) => ({
        ...prev,
        cost_price: value,
        selling_price_usd: '',
        selling_price_syp: autoSellingPriceSYP.toFixed(2),
      }))
    } else {
      const autoSellingPriceUSD = safeCostPrice * 1.20
      const autoSellingPriceSYP = autoSellingPriceUSD * exchangeRate
      setFormData((prev) => ({
        ...prev,
        cost_price: value,
        selling_price_usd: autoSellingPriceUSD.toFixed(2),
        selling_price_syp: autoSellingPriceSYP.toFixed(2),
      }))
    }
  }

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        // Silently fail
      }
    }
    fetchPricingSettings()
  }, [])

  const filteredProducts = Array.isArray(products) ? products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  const handlePriceChange = (
    field: 'selling_price_usd' | 'selling_price_syp',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0
    const MAX_SAFE_PRICE = 999999999999999.99
    const safeValue = Math.min(numValue, MAX_SAFE_PRICE)

    if (formPricingMode === 'BOTH') {
      if (field === 'selling_price_usd') {
        setFormData((prev) => ({
          ...prev,
          selling_price_usd: value,
          selling_price_syp: convertPrice(safeValue, 'USD', 'SYP', exchangeRate).toFixed(2),
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          selling_price_syp: value,
          selling_price_usd: convertPrice(safeValue, 'SYP', 'USD', exchangeRate).toFixed(2),
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
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
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return

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
    let mode: 'SYP' | 'USD' | 'BOTH' = 'BOTH'
    const hasUSD = product.selling_price_usd > 0
    const hasSYP = product.selling_price_syp > 0
    
    if (hasUSD && hasSYP) mode = 'BOTH'
    else if (hasUSD) mode = 'USD'
    else if (hasSYP) mode = 'SYP'
    
    setFormPricingMode(mode)
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
      expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : '', // جلب تاريخ الصلاحية
      is_bulk: product.is_bulk,
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
      expiry_date: '',
      is_bulk: false,
      is_active: true,
    })
    setError('')
  }

  // دالة مساعدة للتحقق مما إذا كان المنتج منتهي الصلاحية أو على وشك الانتهاء
  const checkExpiryStatus = (dateString: string | null) => {
    if (!dateString) return null
    const today = new Date()
    const expiry = new Date(dateString)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: 'expired', label: 'منتهي الصلاحية', color: 'bg-red-100 text-red-800' }
    } else if (diffDays <= 30) {
      return { status: 'warning', label: `يصادف خلال ${diffDays} يوم`, color: 'bg-amber-100 text-amber-800' }
    }
    return { status: 'valid', label: dateString, color: 'text-slate-600' }
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة وأزرار التحكم */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">المنتجات</h2>
          <p className="text-slate-600 mt-1">إدارة مخزون المنتجات وتواريخ الصلاحية</p>
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
        </div>
      </div>

      {/* نموذج الإضافة والتعديل */}
      {showForm && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingProduct ? 'تعديل المنتج' : 'منتج جديد'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={editingProduct ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الباركود *</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* حقل تاريخ الصلاحية المضاف حديثاً في النموذج */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  تاريخ الصلاحية (اختياري)
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">يُستخدم لتتبع المنتجات قاربت على الانتهاء أو انتهت صلاحيتها.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">بيع بالوزن</label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="is_bulk"
                    checked={formData.is_bulk}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_bulk: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="is_bulk" className="ml-2 text-sm text-slate-600">
                    هذا المنتج يباع بالوزن (kg)
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">عند التفعيل، سيطلب من المستخدم إدخال الوزن عند البيع.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التصنيف</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر تصنيفاً</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* بقية حقول الأسعار والمخزون */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">سعر التكلفة *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => handleCostPriceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">سعر البيع (دولار)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.selling_price_usd}
                  onChange={(e) => handlePriceChange('selling_price_usd', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">سعر البيع (ليرة)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.selling_price_syp}
                  onChange={(e) => handlePriceChange('selling_price_syp', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* حقول المخزون */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المخزون الحالي {formData.is_bulk ? '(kg)' : ''}</label>
                <input
                  type="number"
                  step={formData.is_bulk ? "0.001" : "1"}
                  value={formData.current_stock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, current_stock: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.is_bulk ? 'الوزن بالكيلوجرام (يدعم الأرقام العشرية)' : 'الكمية الصحيحة'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">حد المخزون الأدنى</label>
                <input
                  type="number"
                  step="1"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData((prev) => ({ ...prev, min_stock_level: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-slate-600">
                  نشط
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الحفظ...' : editingProduct ? 'تحديث' : 'إنشاء'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* جدول عرض المنتجات مع عمود الصلاحية */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث عن المنتجات بالاسم أو الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">الباركود</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">تاريخ الصلاحية</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">بيع بالوزن</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">سعر البيع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">المخزون</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    لا توجد منتجات مطابقة.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const expiryInfo = checkExpiryStatus(product.expiry_date)
                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {product.barcode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {product.name}
                      </td>
                      {/* عرض حالة وعنوان الصلاحية في الجدول */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {expiryInfo ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${expiryInfo.color}`}>
                            {expiryInfo.status !== 'valid' && <AlertTriangle className="h-3.5 w-3.5" />}
                            {expiryInfo.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">غير محدد</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.is_bulk ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                            نعم
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">لا</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        ${product.selling_price_usd.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {product.current_stock} {product.is_bulk ? 'kg' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900 ml-3">
                          <Pencil className="h-4 w-4 inline" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
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