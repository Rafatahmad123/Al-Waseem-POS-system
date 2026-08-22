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

export async function createManualDebt(formData: FormData) {
  try {
    const customerId = formData.get('customer_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const notes = formData.get('notes') as string | null

    if (!customerId) return { error: 'Customer ID is required' }
    if (isNaN(amount) || amount <= 0) return { error: 'Debt amount must be positive' }

    // Get current customer balance
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('current_balance')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return { error: 'Customer not found' }
    }

    // Calculate new balance (debt increases the balance)
    const newBalance = customer.current_balance + amount

    // Update customer balance
    const { error: updateError } = await supabase
      .from('customers')
      .update({ current_balance: newBalance })
      .eq('id', customerId)

    if (updateError) {
      console.error('[DEBT CREATION] Error updating customer balance:', updateError)
      return { error: updateError.message }
    }

    // Record the debt in customer ledger
    const { error: ledgerError } = await supabase
      .from('customer_ledger')
      .insert({
        customer_id: customerId,
        transaction_type: 'debt',
        amount: amount,
        balance_after: newBalance,
        notes: notes || `Manual debt addition: ${amount}`
      })

    if (ledgerError) {
      console.error('[DEBT CREATION] Error recording in ledger:', ledgerError)
      return { error: ledgerError.message }
    }

    revalidatePath('/dashboard/customers')
    revalidatePath(`/dashboard/customers/${customerId}`)
    return { 
      success: true, 
      newBalance,
      message: `Debt of ${amount} added successfully. New balance: ${newBalance}`
    }
  } catch (error) {
    console.error('[DEBT CREATION] Error:', error)
    return { error: 'Failed to create debt' }
  }
}
