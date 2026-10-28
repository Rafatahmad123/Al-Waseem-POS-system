'use client'

import { useState, useEffect } from 'react'
import { getExpiringProducts, disposeExpiredProduct } from '@/app/actions/analytics'
import { ArrowLeft, Calendar, Package, AlertTriangle, Filter, Trash2, XCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ExpiryReportPage() {
  const [expiringProducts, setExpiringProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDisposeModal, setShowDisposeModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isDisposing, setIsDisposing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadExpiringProducts()
  }, [])

  const loadExpiringProducts = async () => {
    setIsLoading(true)
    const products = await getExpiringProducts()
    setExpiringProducts(products)
    setIsLoading(false)
  }

  const handleDisposeClick = (product: any) => {
    setSelectedProduct(product)
    setShowDisposeModal(true)
    setError('')
    setSuccess('')
  }

  const handleDisposeConfirm = async () => {
    if (!selectedProduct) return

    setIsDisposing(true)
    setError('')

    const result = await disposeExpiredProduct(
      selectedProduct.id,
      selectedProduct.name,
      selectedProduct.current_stock
    )

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('تم إتلاف المنتج بنجاح')
      setShowDisposeModal(false)
      setSelectedProduct(null)
      // Refresh the list
      await loadExpiringProducts()
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    }

    setIsDisposing(false)
  }

  const expired = expiringProducts.filter(p => p.expiry_status === 'expired')
  const critical = expiringProducts.filter(p => p.expiry_status === 'critical')
  const warning = expiringProducts.filter(p => p.expiry_status === 'warning')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 border-red-500 text-red-800'
      case 'critical':
        return 'bg-orange-100 border-orange-500 text-orange-800'
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800'
      default:
        return 'bg-green-100 border-green-500 text-green-800'
    }
  }

  const getStatusText = (status: string, days: number) => {
    switch (status) {
      case 'expired':
        return 'منتهي الصلاحية'
      case 'critical':
        return `ينتهي خلال ${Math.abs(days)} أيام`
      case 'warning':
        return `ينتهي خلال ${days} أيام`
      default:
        return 'ساري'
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">تقرير انتهاء الصلاحية</h2>
          <p className="text-slate-600 mt-1">منتجات تنتهي صلاحيتها قريباً</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">منتهية الصلاحية</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{expired.length}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">حرجة (7 أيام)</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{critical.length}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">تحذير (30 يوم)</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{warning.length}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">جميع المنتجات القريبة من الانتهاء</h3>
            </div>
            <div className="text-sm text-slate-500">
              المجموع: {expiringProducts.length} منتج
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">جاري تحميل البيانات...</p>
          </div>
        ) : expiringProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">لا توجد منتجات تنتهي صلاحيتها قريباً</p>
            <p className="text-sm text-slate-500">تأكد من إضافة تواريخ الصلاحية للمنتجات في صفحة إدارة المنتجات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    المنتج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الباركود
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الكمية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    تاريخ الانتهاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الأيام المتبقية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {expiringProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {product.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {product.current_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('ar-SY') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={product.days_until_expiry <= 0 ? 'text-red-600' : 'text-slate-900'}>
                        {product.days_until_expiry <= 0 ? '0' : product.days_until_expiry} يوم
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.expiry_status)}`}>
                        {getStatusText(product.expiry_status, product.days_until_expiry)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.expiry_status === 'expired' && product.current_stock > 0 ? (
                        <button
                          onClick={() => handleDisposeClick(product)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
                        >
                          <Trash2 className="h-4 w-4" />
                          تم الإتلاف
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {expiringProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">توصيات</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            {expired.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>قم بإزالة {expired.length} منتج منتهية الصلاحية فوراً لتجنب المخاطر الصحية</span>
              </li>
            )}
            {critical.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>فكر في تقديم خصومات على {critical.length} منتج تنتهي صلاحيتها خلال 7 أيام</span>
              </li>
            )}
            {warning.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>راقب {warning.length} منتج تنتهي صلاحيتها خلال 30 يوم وخطط لبيعها</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Disposal Confirmation Modal */}
      {showDisposeModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">تأكيد إتلاف المنتج</h3>
              </div>

              <p className="text-slate-600 mb-4">
                هل أنت متأكد من إتلاف المنتج "{selectedProduct.name}"؟
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-2">تفاصيل المنتج:</p>
                  <p>الاسم: {selectedProduct.name}</p>
                  <p>الباركود: {selectedProduct.barcode}</p>
                  <p>الكمية: {selectedProduct.current_stock}</p>
                  <p>تاريخ الانتهاء: {selectedProduct.expiry_date ? new Date(selectedProduct.expiry_date).toLocaleDateString('ar-SY') : 'N/A'}</p>
                </div>
              </div>

              <p className="text-sm text-red-600 mb-4 font-medium">
                ⚠️ سيتم إزالة الكمية ({selectedProduct.current_stock}) من المخزون وتسجيل العملية في سجل المخزون. هذا الإجراء لا يمكن التراجع عنه.
              </p>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDisposeModal(false)
                    setSelectedProduct(null)
                    setError('')
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={isDisposing}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDisposeConfirm}
                  disabled={isDisposing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-slate-400"
                >
                  {isDisposing ? 'جاري الإتلاف...' : 'تأكيد الإتلاف'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
