import { getSales } from '@/app/actions/sales'
import { Plus, Calendar, DollarSign, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function SalesPage() {
  const sales = await getSales()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">المبيعات</h1>
          <p className="text-slate-600 mt-1">سجل جميع المبيعات</p>
        </div>
        <Link
          href="/dashboard/sales/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>بيع جديد</span>
        </Link>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {sales.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-600">لا توجد مبيعات بعد</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">رقم الفاتورة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">التاريخ</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">العميل</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">طريقة الدفع</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">المجموع</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sales.map((sale: any) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                    #{sale.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(sale.sale_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {sale.customer_id ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>عميل مسجل</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">عميل نقدي</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sale.payment_type === 'Credit'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {sale.payment_type === 'Credit' ? 'آجل' : 'نقدي'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    ${sale.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/dashboard/sales/${sale.id}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-900 font-medium"
                    >
                      <span>التفاصيل</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {sales.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${sales.reduce((sum: number, sale: any) => sum + sale.total_amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600">عدد الفواتير</p>
              <p className="text-2xl font-bold text-slate-900">{sales.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
