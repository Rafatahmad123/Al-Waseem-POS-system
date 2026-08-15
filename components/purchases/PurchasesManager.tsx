'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Search } from 'lucide-react'
import { getProducts } from '@/app/actions/products'
import { getSuppliers } from '@/app/actions/suppliers'
import { createPurchase } from '@/app/actions/purchases'

interface Product {
  id: string
  barcode: string
  name: string
  description: string | null
  category_id: string | null
  categories: { id: string; name: string } | null
  cost_price: number
  selling_price_usd: number
  selling_price_syp: number
  current_stock: number
  min_stock_level: number
  is_bulk: boolean
  is_active: boolean
}

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
}

interface PurchaseItem {
  productId: string
  productName: string
  productBarcode: string
  quantity: number
  costPerUnit: number
  batchNumber: string
  expiryDate: string
}

interface PurchasesManagerProps {
  initialProducts: Product[]
  initialSuppliers: Supplier[]
}

export default function PurchasesManager({
  initialProducts,
  initialSuppliers,
}: PurchasesManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [itemFormData, setItemFormData] = useState({
    quantity: '1',
    costPerUnit: '',
    batchNumber: '',
    expiryDate: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredProducts = products.filter(
    (product) =>
      product.is_active &&
      (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddItem = () => {
    if (!selectedProduct) {
      setError('الرجاء اختيار منتج')
      return
    }

    const quantity = parseInt(itemFormData.quantity) || 0
    const costPerUnit = parseFloat(itemFormData.costPerUnit) || 0

    if (quantity <= 0) {
      setError('يجب أن تكون الكمية أكبر من 0')
      return
    }

    if (costPerUnit <= 0) {
      setError('يجب أن يكون التكلفة للوحدة أكبر من 0')
      return
    }

    const newItem: PurchaseItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productBarcode: selectedProduct.barcode,
      quantity,
      costPerUnit,
      batchNumber: itemFormData.batchNumber,
      expiryDate: itemFormData.expiryDate,
    }

    setPurchaseItems([...purchaseItems, newItem])
    setSelectedProduct(null)
    setItemFormData({
      quantity: '1',
      costPerUnit: '',
      batchNumber: '',
      expiryDate: '',
    })
    setError('')
  }

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setItemFormData({
      ...itemFormData,
      costPerUnit: product.cost_price.toString(),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (purchaseItems.length === 0) {
      setError('الرجاء إضافة عنصر واحد على الأقل')
      return
    }

    setIsSubmitting(true)

    const formDataObj = new FormData()
    formDataObj.append('supplier_id', formData.supplier_id)
    formDataObj.append('purchase_date', formData.purchase_date)
    formDataObj.append('notes', formData.notes)
    formDataObj.append('items', JSON.stringify(purchaseItems))

    const result = await createPurchase(formDataObj)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('تم إنشاء الشراء بنجاح!')
      setShowForm(false)
      resetForm()
      const updated = await getProducts()
      setProducts(updated)
      setTimeout(() => setSuccess(''), 3000)
    }

    setIsSubmitting(false)
  }

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setPurchaseItems([])
    setSelectedProduct(null)
    setItemFormData({
      quantity: '1',
      costPerUnit: '',
      batchNumber: '',
      expiryDate: '',
    })
    setError('')
  }

  const handleCancel = () => {
    setShowForm(false)
    resetForm()
  }

  const totalAmount = purchaseItems.reduce((sum, item) => sum + item.costPerUnit * item.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">المشتريات</h2>
          <p className="text-slate-600 mt-1">إدارة مشتريات المخزون وإدخالات المخزون</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            شراء جديد
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">شراء جديد</h3>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="supplier_id" className="block text-sm font-medium text-slate-700 mb-1">
                  المورد
                </label>
                <select
                  id="supplier_id"
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر مورد</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="purchase_date" className="block text-sm font-medium text-slate-700 mb-1">
                  تاريخ الشراء
                </label>
                <input
                  type="date"
                  id="purchase_date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                ملاحظات
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Items Section */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-4">إضافة عناصر</h4>

              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن المنتجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedProduct && (
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-medium text-slate-900">{selectedProduct.name}</h5>
                      <p className="text-sm text-slate-600">{selectedProduct.barcode}</p>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        الكمية
                      </label>
                      <input
                        type="number"
                        value={itemFormData.quantity}
                        onChange={(e) => setItemFormData({ ...itemFormData, quantity: e.target.value })}
                        min="1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        التكلفة للوحدة
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemFormData.costPerUnit}
                        onChange={(e) => setItemFormData({ ...itemFormData, costPerUnit: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        رقم الدفعة
                      </label>
                      <input
                        type="text"
                        value={itemFormData.batchNumber}
                        onChange={(e) => setItemFormData({ ...itemFormData, batchNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        تاريخ الانتهاء
                      </label>
                      <input
                        type="date"
                        value={itemFormData.expiryDate}
                        onChange={(e) => setItemFormData({ ...itemFormData, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    إضافة للشراء
                  </button>
                </div>
              )}

              {!selectedProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <h5 className="font-medium text-slate-900">{product.name}</h5>
                      <p className="text-sm text-slate-600">{product.barcode}</p>
                      <p className="text-sm text-slate-500">المخزون الحالي: {product.current_stock}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Items List */}
            {purchaseItems.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3">عناصر الشراء</h4>
                <div className="space-y-2">
                  {purchaseItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{item.productName}</p>
                        <p className="text-sm text-slate-600">
                          الكمية: {item.quantity} × ${item.costPerUnit.toFixed(2)} = ${(item.quantity * item.costPerUnit).toFixed(2)}
                        </p>
                        {item.batchNumber && <p className="text-xs text-slate-500">الدفعة: {item.batchNumber}</p>}
                        {item.expiryDate && <p className="text-xs text-slate-500">الانتهاء: {item.expiryDate}</p>}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-900">المبلغ الإجمالي</span>
                    <span className="font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || purchaseItems.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الشراء'}
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
    </div>
  )
}
