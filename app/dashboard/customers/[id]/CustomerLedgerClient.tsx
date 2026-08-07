'use client'

import { ArrowLeft, DollarSign, Calendar, User, Phone, ChevronDown, ChevronRight, Package } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getExchangeRate, formatDualCurrency } from '@/lib/pricing'

interface SaleItem {
  id: string
  quantity: number
  selling_price_usd: number
  selling_price_syp: number
  total_price: number
  products: {
    id: string
    name: string
    barcode: string
  }
}

interface Sale {
  id: string
  sale_date: string
  total_amount: number
  sale_items: SaleItem[]
}

interface LedgerEntry {
  id: string
  customer_id: string
  transaction_type: 'purchase' | 'payment'
  amount: number
  balance_after: number
  notes: string | null
  created_at: string
  sale_id: string | null
  sales: Sale | null
}

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  current_balance: number
}

interface CustomerLedgerClientProps {
  customer: Customer
  ledger: LedgerEntry[]
  handlePayment: (formData: FormData) => Promise<void>
}

export default function CustomerLedgerClient({
  customer,
  ledger,
  handlePayment
}: CustomerLedgerClientProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [exchangeRate, setExchangeRate] = useState<number>(12500)

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const rate = await getExchangeRate()
        if (rate) setExchangeRate(rate)
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
      }
    }
    fetchExchangeRate()
  }, [])

  const toggleEntry = (entryId: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
    }
    setExpandedEntries(newExpanded)
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
                {formatDualCurrency(customer.current_balance || 0, exchangeRate)}
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
                <p className="text-xs text-slate-500 mt-1">
                  الحد الأقصى: {formatDualCurrency(customer.current_balance, exchangeRate)}
                </p>
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
          <div className="divide-y divide-slate-200">
            {ledger.map((entry) => (
              <div key={entry.id} className="hover:bg-slate-50">
                {/* Main Transaction Row */}
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => entry.transaction_type === 'purchase' && entry.sales && toggleEntry(entry.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-sm text-slate-900 whitespace-nowrap w-32">
                        {new Date(entry.created_at).toLocaleDateString('ar-SY')}
                      </div>
                      
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        entry.transaction_type === 'purchase'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.transaction_type === 'purchase' ? 'شراء (دين)' : 'دفع'}
                      </span>

                      <span className={`text-sm font-medium ${
                        entry.transaction_type === 'purchase'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {entry.transaction_type === 'purchase' ? '+' : '-'}
                        {formatDualCurrency(entry.amount, exchangeRate)}
                      </span>

                      <span className="text-sm text-slate-900">
                        الرصيد: {formatDualCurrency(entry.balance_after, exchangeRate)}
                      </span>
                    </div>

                    {entry.transaction_type === 'purchase' && entry.sales && (
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        {expandedEntries.has(entry.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-slate-600">
                    {entry.notes || '-'}
                  </div>
                </div>

                {/* Expanded Product Details */}
                {expandedEntries.has(entry.id) && entry.transaction_type === 'purchase' && entry.sales && (
                  <div className="px-6 pb-6 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4 mt-4">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">تفاصيل المنتجات</span>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                              المنتج
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase">
                              الكمية
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                              السعر
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                              المجموع
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {entry.sales.sale_items.map((item) => (
                            <tr key={item.id} className="text-sm">
                              <td className="px-4 py-3 text-slate-900">
                                <div>
                                  <div className="font-medium">{item.products.name}</div>
                                  <div className="text-xs text-slate-500">{item.products.barcode}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-900">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-left text-slate-900">
                                {formatDualCurrency(item.selling_price_usd, exchangeRate)}
                              </td>
                              <td className="px-4 py-3 text-left text-slate-900 font-medium">
                                {formatDualCurrency(item.selling_price_usd * item.quantity, exchangeRate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right font-medium text-slate-700">
                              إجمالي الفاتورة
                            </td>
                            <td className="px-4 py-3 text-left font-bold text-slate-900">
                              {formatDualCurrency(entry.sales.total_amount, exchangeRate)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
