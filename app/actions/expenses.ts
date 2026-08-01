'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'
import { ExpenseInsert, ExpenseUpdate } from '@/lib/types/database'
import { getExchangeRate, sypToUsd } from '@/lib/pricing'

export async function getExpenses() {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('is_active', true)
      .order('expense_date', { ascending: false })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export async function getExpenseById(id: string) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

export async function createExpense(formData: FormData) {
  try {
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const currency = formData.get('currency') as string
    const category = formData.get('category') as string | null
    const expense_date = formData.get('expense_date') as string
    const notes = formData.get('notes') as string | null

    if (!description) return { error: 'Description is required' }
    if (isNaN(amount) || amount <= 0) return { error: 'Amount must be a positive number' }
    if (!currency || !['USD', 'SYP'].includes(currency)) return { error: 'Invalid currency' }
    if (!expense_date) return { error: 'Expense date is required' }

    const expenseData: ExpenseInsert = {
      description,
      amount,
      currency: currency as 'USD' | 'SYP',
      category: category || null,
      expense_date,
      notes: notes || null,
      is_active: true,
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/expenses')
    return { success: true, data }
  } catch (error) {
    return { error: 'Failed to create expense' }
  }
}

export async function updateExpense(formData: FormData) {
  try {
    const id = formData.get('id') as string
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const currency = formData.get('currency') as string
    const category = formData.get('category') as string | null
    const expense_date = formData.get('expense_date') as string
    const notes = formData.get('notes') as string | null

    if (!id) return { error: 'Expense ID is required' }
    if (!description) return { error: 'Description is required' }
    if (isNaN(amount) || amount <= 0) return { error: 'Amount must be a positive number' }
    if (!currency || !['USD', 'SYP'].includes(currency)) return { error: 'Invalid currency' }
    if (!expense_date) return { error: 'Expense date is required' }

    const expenseData: ExpenseUpdate = {
      description,
      amount,
      currency: currency as 'USD' | 'SYP',
      category: category || null,
      expense_date,
      notes: notes || null,
    }

    const { error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id)
      .eq('is_active', true)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/expenses')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update expense' }
  }
}

export async function deleteExpense(id: string) {
  try {
    const { error } = await supabase
      .from('expenses')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/expenses')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete expense' }
  }
}

export async function getTotalExpensesUSD(startDate?: Date, endDate?: Date) {
  try {
    let query = supabase
      .from('expenses')
      .select('amount, currency')
      .eq('is_active', true)

    if (startDate) {
      query = query.gte('expense_date', startDate.toISOString())
    }
    if (endDate) {
      query = query.lte('expense_date', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) return 0
    if (!data || data.length === 0) return 0

    const exchangeRate = await getExchangeRate()
    let totalUSD = 0

    for (const expense of data) {
      if (expense.currency === 'USD') {
        totalUSD += expense.amount
      } else if (expense.currency === 'SYP') {
        totalUSD += sypToUsd(expense.amount, exchangeRate)
      }
    }

    return totalUSD
  } catch {
    return 0
  }
}

export async function getMonthlyExpenses() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  return await getTotalExpensesUSD(firstDay, lastDay)
}

export async function getDailyExpenses() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return await getTotalExpensesUSD(today, tomorrow)
}

export async function getExpensesByCategory() {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount, currency')
      .eq('is_active', true)

    if (error) return []
    if (!data || data.length === 0) return []

    const exchangeRate = await getExchangeRate()
    const categoryTotals: Record<string, number> = {}

    for (const expense of data) {
      const category = expense.category || 'Uncategorized'
      const amountUSD = expense.currency === 'USD' 
        ? expense.amount 
        : sypToUsd(expense.amount, exchangeRate)
      
      categoryTotals[category] = (categoryTotals[category] || 0) + amountUSD
    }

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
    }))
  } catch {
    return []
  }
}
