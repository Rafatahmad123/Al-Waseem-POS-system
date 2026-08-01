'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { recordPayment } from '@/app/actions/debts'

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

interface PaymentFormProps {
  debt: Debt
  debtLogs: DebtLog[]
  onSuccess: () => void
  onCancel: () => void
}

export default function PaymentForm({ debt, debtLogs, onSuccess, onCancel }: PaymentFormProps) {
  const [paymentAmount, setPaymentAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const remainingBalance = debt.total_amount - debt.paid_amount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const amount = parseFloat(paymentAmount)

    if (isNaN(amount) || amount <= 0) {
      setError('المبلغ يجب أن يكون أكبر من صفر')
      setIsSubmitting(false)
      return
    }

    if (amount > remainingBalance) {
      setError(`المبلغ لا يمكن أن يتجاوز الرصيد المتبقي (${remainingBalance.toFixed(2)})`)
      setIsSubmitting(false)
      return
    }

    const formData = new FormData()
    formData.append('debt_id', debt.id)
    formData.append('payment_amount', paymentAmount)
    if (notes) {
      formData.append('notes', notes)
    }

    const result = await recordPayment(formData)

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess()
    }

    setIsSubmitting(false)
  }

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">تسجيل دفعة</h3>
          <p className="text-sm text-slate-600">العميل: {debt.customer_name}</p>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-slate-600">المبلغ الكلي</p>
            <p className="text-lg font-semibold text-slate-900">${debt.total_amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">المدفوع</p>
            <p className="text-lg font-semibold text-green-600">${debt.paid_amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">المتبقي</p>
            <p className="text-lg font-semibold text-red-600">${remainingBalance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="payment_amount" className="block text-sm font-medium text-slate-700 mb-1">
            مبلغ الدفعة *
          </label>
          <input
            type="number"
            id="payment_amount"
            step="0.01"
            max={remainingBalance}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-slate-500 mt-1">الحد الأقصى: ${remainingBalance.toFixed(2)}</p>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
            ملاحظات (اختياري)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>

      {debtLogs.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">سجل المدفوعات السابقة</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {debtLogs.map((log) => (
              <div key={log.id} className="bg-slate-50 rounded p-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-600">+${log.payment_amount.toFixed(2)}</span>
                  <span className="text-slate-600">
                    {new Date(log.created_at).toLocaleDateString('ar-SY')} {new Date(log.created_at).toLocaleTimeString('ar-SY')}
                  </span>
                </div>
                {log.notes && (
                  <p className="text-slate-600 mt-1">{log.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
