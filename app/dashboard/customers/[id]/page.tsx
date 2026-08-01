import { getCustomerById, getCustomerLedger } from '@/app/actions/customers'
import { processDebtPayment } from '@/app/actions/debtPayments'
import { ArrowLeft, DollarSign, Calendar, User, Phone, MapPin, Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CustomerLedgerPage({
  params,
}: {
  params: { id: string }
}) {
  const customer = await getCustomerById(params.id)
  const ledger = await getCustomerLedger(params.id)

  if (!customer) {
    redirect('/dashboard/customers')
  }

  async function handlePayment(formData: FormData) {
    'use server'
    const result = await processDebtPayment(formData)
    if (result.error) {
      throw new Error(result.error)
    }
    redirect(`/dashboard/customers/${params.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customers"
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{customer.name}</h2>
            <p className="text-slate-600 mt-1">سجل المعاملات والديون</p>
          </div>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">الاسم</p>
              <p className="font-medium text-slate-900">{customer.name}</p>
            </div>
          </div>

          {customer.phone && (
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">الهاتف</p>
                <p className="font-medium text-slate-900">{customer.phone}</p>
              </div>
            </div>
          )}

          {customer.email && (
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">البريد الإلكتروني</p>
                <p className="font-medium text-slate-900">{customer.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${(customer.current_balance || 0) > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <DollarSign className={`h-5 w-5 ${(customer.current_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-sm text-slate-600">الرصيد الحالي</p>
              <p className={`font-bold ${(customer.current_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${(customer.current_balance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {(customer.current_balance || 0) > 0 && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900">تسديد دفعة</h3>
          </div>
          <form action={handlePayment} className="space-y-4">
            <input type="hidden" name="customer_id" value={customer.id} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  مبلغ الدفعة
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  max={customer.current_balance}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <input
                  type="text"
                  name="notes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ملاحظات الدفعة"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              تسجيل الدفعة
            </button>
          </form>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">سجل المعاملات</h3>
          </div>
        </div>

        {ledger.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">لا توجد معاملات لهذا العميل</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الرصيد بعد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ملاحظات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(entry.created_at).toLocaleDateString('ar-SY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        entry.transaction_type === 'purchase'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.transaction_type === 'purchase' ? 'شراء (دين)' : 'دفع'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        entry.transaction_type === 'purchase'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {entry.transaction_type === 'purchase' ? '+' : '-'}
                        ${entry.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      ${entry.balance_after.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
