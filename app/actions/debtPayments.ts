'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'

export async function processDebtPayment(formData: FormData) {
  try {
    const customerId = formData.get('customer_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const notes = formData.get('notes') as string | null

    if (!customerId) return { error: 'Customer ID is required' }
    if (isNaN(amount) || amount <= 0) return { error: 'Payment amount must be positive' }

    // Use atomic RPC function to ensure data consistency
    const { data, error } = await supabase.rpc('process_customer_payment', {
      p_customer_id: customerId,
      p_payment_amount: amount,
      p_notes: notes || `Payment of ${amount}`
    })

    if (error) return { error: error.message }

    const result = data as any
    if (!result?.success) {
      return { error: result?.error || 'Failed to process payment' }
    }

    revalidatePath('/dashboard/customers')
    revalidatePath(`/dashboard/customers/${customerId}`)
    return { success: true, data: result.data }
  } catch (error) {
    return { error: 'Failed to process debt payment' }
  }
}

export async function recordCreditSale(customerId: string, saleAmount: number, saleId: string, notes?: string) {
  try {
    if (!customerId) return { error: 'Customer ID is required' }
    if (isNaN(saleAmount) || saleAmount <= 0) return { error: 'Sale amount must be positive' }

    // Use atomic RPC function to ensure data consistency
    const { data, error } = await supabase.rpc('record_credit_sale', {
      p_customer_id: customerId,
      p_sale_amount: saleAmount,
      p_sale_id: saleId,
      p_notes: notes || `Credit sale of ${saleAmount}`
    })

    if (error) return { error: error.message }

    const result = data as any
    if (!result?.success) {
      return { error: result?.error || 'Failed to record credit sale' }
    }

    revalidatePath('/dashboard/customers')
    revalidatePath(`/dashboard/customers/${customerId}`)
    return { success: true, data: result.data }
  } catch (error) {
    return { error: 'Failed to record credit sale' }
  }
}
