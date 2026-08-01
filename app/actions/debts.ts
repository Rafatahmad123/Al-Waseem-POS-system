'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'
import { DebtInsert, DebtLogInsert } from '@/lib/types/database'

/**
 * Get all debts with their payment history
 */
export async function getDebts() {
  try {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

/**
 * Get a single debt by ID with its payment logs
 */
export async function getDebtById(id: string) {
  try {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

/**
 * Get payment logs for a specific debt
 */
export async function getDebtLogs(debtId: string) {
  try {
    const { data, error } = await supabase
      .from('debt_logs')
      .select('*')
      .eq('debt_id', debtId)
      .order('created_at', { ascending: false })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

/**
 * Add a new debt
 * This creates a debt entry with initial status 'pending'
 */
export async function addDebt(formData: FormData): Promise<{ error?: string; data?: any; success?: boolean }> {
  try {
    const customer_name = formData.get('customer_name') as string
    const total_amount = parseFloat(formData.get('total_amount') as string)

    if (!customer_name) return { error: 'Customer name is required' }
    if (isNaN(total_amount) || total_amount <= 0) return { error: 'Total amount must be greater than 0' }

    const debtData: DebtInsert = {
      customer_name,
      total_amount,
      paid_amount: 0,
      status: 'pending'
    }

    const { data, error } = await supabase.from('debts').insert(debtData).select().single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/debts')
    return { success: true, data }
  } catch (error) {
    return { error: 'Failed to create debt' }
  }
}

/**
 * Record a payment for a debt
 * Uses atomic RPC function to ensure both the log and debt update succeed or fail together
 */
export async function recordPayment(formData: FormData): Promise<{ error?: string; data?: any; success?: boolean }> {
  try {
    const debt_id = formData.get('debt_id') as string
    const payment_amount = parseFloat(formData.get('payment_amount') as string)
    const notes = formData.get('notes') as string | null

    if (!debt_id) return { error: 'Debt ID is required' }
    if (isNaN(payment_amount) || payment_amount <= 0) return { error: 'Payment amount must be greater than 0' }

    // Use atomic RPC function to record payment with logging
    const { data, error } = await supabase.rpc('record_debt_payment_with_log', {
      p_debt_id: debt_id,
      p_payment_amount: payment_amount,
      p_notes: notes
    })

    if (error) return { error: error.message }

    const result = data as any
    if (!result?.success) {
      return { error: result?.error || 'Failed to record payment' }
    }

    revalidatePath('/dashboard/debts')
    return { success: true, data: result.data }
  } catch (error) {
    return { error: 'Failed to record payment' }
  }
}

/**
 * Delete a debt (soft delete by marking as paid with zero balance or actual delete)
 * For now, we'll use actual delete but could be changed to soft delete
 */
export async function deleteDebt(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const { error } = await supabase.from('debts').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/debts')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete debt' }
  }
}
