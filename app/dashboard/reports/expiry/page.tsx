import { getExpiringProducts } from '@/app/actions/analytics'
import { ArrowLeft, Calendar, Package, AlertTriangle, Filter } from 'lucide-react'
import Link from 'next/link'

export default async function ExpiryReportPage() {
  const expiringProducts = await getExpiringProducts()

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
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">جميع المنتجات القريبة من الانتهاء</h3>
          </div>
        </div>

        {expiringProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">لا توجد منتجات تنتهي صلاحيتها قريباً</p>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {expiringProducts.map((product) => (
                  <tr key={`${product.id}-${product.expiry_date}`} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {product.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {product.batch_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(product.expiry_date).toLocaleDateString('ar-SY')}
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
    </div>
  )
}
