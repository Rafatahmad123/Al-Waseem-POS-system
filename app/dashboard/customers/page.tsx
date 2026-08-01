import { getCustomers, getCustomersWithDebt } from '@/app/actions/customers'
import { Users, DollarSign, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

export default async function CustomersPage() {
  const customers = await getCustomers()
  const customersWithDebt = await getCustomersWithDebt()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">العملاء</h2>
          <p className="text-slate-600 mt-1">إدارة حسابات العملاء والديون</p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          إضافة عميل
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">إجمالي العملاء</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">عملاء بديون</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{customersWithDebt.length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">إجمالي الديون</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${customersWithDebt.reduce((sum, c) => sum + (c.current_balance || 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">قائمة العملاء</h3>
        </div>
        
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">لا يوجد عملاء حالياً</p>
            <Link
              href="/dashboard/customers/new"
              className="text-blue-600 hover:text-blue-900 text-sm font-medium mt-2 inline-block"
            >
              إضافة عميل جديد
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الهاتف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الرصيد الحالي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                          {customer.email && (
                            <div className="text-sm text-slate-500">{customer.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.phone ? (
                        <div className="flex items-center text-sm text-slate-900">
                          <Phone className="h-4 w-4 ml-2 text-slate-400" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        (customer.current_balance || 0) > 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        ${(customer.current_balance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="text-blue-600 hover:text-blue-900 ml-3"
                      >
                        عرض السجل
                      </Link>
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
