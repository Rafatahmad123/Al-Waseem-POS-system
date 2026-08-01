'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Search, DollarSign } from 'lucide-react'
import {
  getDebts,
  addDebt,
  recordPayment,
  deleteDebt,
  getDebtLogs,
} from '@/app/actions/debts'
import PaymentForm from './PaymentForm'

interface Debt {
  id: string
  customer_name: string
  total_amount: number
  paid_amount: number
  status: 'pending' | 'partially_paid' | 'paid'
  created_at: string
  updated_at: string
}

interface DebtLog {
  id: string
  debt_id: string
  old_paid_amount: number
  new_paid_amount: number
  payment_amount: number
  notes: string | null
  created_at: string
}

interface DebtsManagerProps {
  initialDebts: Debt[]
}

export default function DebtsManager({ initialDebts }: DebtsManagerProps) {
  const [debts, setDebts] = useState<Debt[]>(Array.isArray(initialDebts) ? initialDebts : [])
  const [showForm, setShowForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [debtLogs, setDebtLogs] = useState<DebtLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    total_amount: '',
  })

  const filteredDebts = Array.isArray(debts)
    ? debts.filter((debt) =>
        debt.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formDataObj = new FormData()
    formDataObj.append('customer_name', formData.customer_name)
    formDataObj.append('total_amount', formData.total_amount)

    const result = await addDebt(formDataObj)

    if (result.error) {
      setError(result.error)
    } else {
      setShowForm(false)
      resetForm()
      const updated = await getDebts()
      setDebts(updated)
    }

    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدين؟')) {
      return
    }

    const result = await deleteDebt(id)
    if (result.error) {
      setError(result.error)
    } else {
      const updated = await getDebts()
      setDebts(updated)
    }
  }

  const handlePaymentClick = async (debt: Debt) => {
    setSelectedDebt(debt)
    const logs = await getDebtLogs(debt.id)
    setDebtLogs(logs)
    setShowPaymentForm(true)
  }

  const handlePaymentSuccess = async () => {
    setShowPaymentForm(false)
    setSelectedDebt(null)
    setDebtLogs([])
    const updated = await getDebts()
    setDebts(updated)
  }

  const resetForm = () => {
    setFormData({
      customer_name: '',
      total_amount: '',
    })
    setError('')
  }

  const handleCancel = () => {
    setShowForm(false)
    resetForm()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-red-100', text: 'text-red-800', label: 'معلق' },
      partially_paid: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'مدفوع جزئياً' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'مدفوع بالكامل' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getRemainingBalance = (debt: Debt) => {
    return debt.total_amount - debt.paid_amount
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">إدارة الديون</h2>
          <p className="text-slate-600 mt-1">تتبع ديون العملاء والمدفوعات</p>
        </div>
        {!showForm && !showPaymentForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            إضافة دين جديد
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">دين جديد</h3>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="customer_name" className="block text-sm font-medium text-slate-700 mb-1">
                اسم العميل *
              </label>
              <input
                type="text"
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="total_amount" className="block text-sm font-medium text-slate-700 mb-1">
                المبلغ الكلي *
              </label>
              <input
                type="number"
                id="total_amount"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'إنشاء'}
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

      {showPaymentForm && selectedDebt && (
        <PaymentForm
          debt={selectedDebt}
          debtLogs={debtLogs}
          onSuccess={handlePaymentSuccess}
          onCancel={() => {
            setShowPaymentForm(false)
            setSelectedDebt(null)
            setDebtLogs([])
          }}
        />
      )}

      <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث عن الديون باسم العميل..."
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
                  اسم العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  المبلغ الكلي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  المدفوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  المتبقي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    لا توجد ديون حالياً. ابدأ بإضافة أول دين.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{debt.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">${debt.total_amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">${debt.paid_amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        ${getRemainingBalance(debt).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(debt.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">
                        {new Date(debt.created_at).toLocaleDateString('ar-SY')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <button
                        onClick={() => handlePaymentClick(debt)}
                        disabled={debt.status === 'paid'}
                        className="text-green-600 hover:text-green-900 ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="تسجيل دفعة"
                      >
                        <DollarSign className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(debt.id)}
                        className="text-red-600 hover:text-red-900"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
