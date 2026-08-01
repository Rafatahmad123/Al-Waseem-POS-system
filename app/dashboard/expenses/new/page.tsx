import { createExpense } from '@/app/actions/expenses'
import { ArrowLeft, DollarSign, Calendar, Tag, FileText } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default function NewExpensePage() {
  async function handleCreateExpense(formData: FormData) {
    'use server'
    const result = await createExpense(formData)
    if (result.error) {
      throw new Error(result.error)
    }
    redirect('/dashboard/expenses')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/expenses"
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">إضافة مصروف جديد</h2>
          <p className="text-slate-600 mt-1">تسجيل مصروف جديد</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <form action={handleCreateExpense} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                الوصف *
              </label>
              <input
                type="text"
                name="description"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="وصف المصروف"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                المبلغ *
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                العملة *
              </label>
              <select
                name="currency"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="SYP">ليرة سورية (SYP)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                الفئة
              </label>
              <div className="relative">
                <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="category"
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: إيجار، مرافق، رواتب"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                التاريخ *
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  name="expense_date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ملاحظات
              </label>
              <div className="relative">
                <FileText className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ملاحظات إضافية (اختياري)"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              حفظ المصروف
            </button>
            <Link
              href="/dashboard/expenses"
              className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 transition-colors"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
