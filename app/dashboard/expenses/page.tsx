import { getExpenses, getMonthlyExpenses, getDailyExpenses, getExpensesByCategory } from '@/app/actions/expenses'
import { DollarSign, TrendingDown, Calendar, Plus, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { deleteExpense } from '@/app/actions/expenses'
import { redirect } from 'next/navigation'
import DeleteExpenseButton from '@/components/expenses/DeleteExpenseButton'

export default async function ExpensesPage() {
  const expenses = await getExpenses()
  const monthlyExpenses = await getMonthlyExpenses()
  const dailyExpenses = await getDailyExpenses()
  const expensesByCategory = await getExpensesByCategory()

  async function handleDelete(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const result = await deleteExpense(id)
    if (result.error) {
      throw new Error(result.error)
    }
    redirect('/dashboard/expenses')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">المصروفات</h2>
          <p className="text-slate-600 mt-1">إدارة مصروفات الشركة</p>
        </div>
        <Link
          href="/dashboard/expenses/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          إضافة مصروف
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">مصروفات اليوم</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${dailyExpenses.toFixed(2)}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">مصروفات الشهر</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${monthlyExpenses.toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">إجمالي المصروفات</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${expenses.reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount : e.amount / 12500), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Expenses by Category */}
      {expensesByCategory.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">المصروفات حسب الفئة</h3>
          <div className="space-y-3">
            {expensesByCategory.map((item) => (
              <div key={item.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-900">{item.category}</span>
                <span className="font-bold text-red-600">${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">سجل المصروفات</h3>
        </div>
        
        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">لا توجد مصروفات مسجلة</p>
            <Link
              href="/dashboard/expenses/new"
              className="text-blue-600 hover:text-blue-900 text-sm font-medium mt-2 inline-block"
            >
              إضافة مصروف جديد
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الوصف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الفئة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-sm text-slate-500">{expense.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">
                        {expense.category || 'غير مصنف'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-red-600">
                        {expense.currency === 'USD' ? '$' : ''}{expense.amount.toFixed(2)}
                        {expense.currency === 'SYP' ? ' SYP' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(expense.expense_date).toLocaleDateString('ar-SY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <form action={handleDelete}>
                        <input type="hidden" name="id" value={expense.id} />
                        <DeleteExpenseButton expenseId={expense.id} />
                      </form>
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
