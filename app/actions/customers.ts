'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'

export async function getCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export async function getCustomerById(id: string) {
  try {
    const { data, error } = await supabase
      .from('customers')
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

export async function createCustomer(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string | null
    const email = formData.get('email') as string | null
    const address = formData.get('address') as string | null

    if (!name) return { error: 'Name is required' }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        current_balance: 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/customers')
    return { success: true, data }
  } catch (error) {
    return { error: 'Failed to create customer' }
  }
}

export async function updateCustomer(formData: FormData) {
  try {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string | null
    const email = formData.get('email') as string | null
    const address = formData.get('address') as string | null

    if (!id) return { error: 'Customer ID is required' }
    if (!name) return { error: 'Name is required' }

    const { error } = await supabase
      .from('customers')
      .update({
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
      })
      .eq('id', id)
      .eq('is_active', true)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/customers')
    revalidatePath(`/dashboard/customers/${id}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update customer' }
  }
}

export async function deleteCustomer(id: string, force: boolean = false) {
  try {
    // Check if customer has active balance or debt
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('current_balance')
      .eq('id', id)
      .single()

    if (customerError || !customer) {
      return { error: 'Customer not found' }
    }

    // Check if customer has any transactions in ledger
    const { data: ledger, error: ledgerError } = await supabase
      .from('customer_ledger')
      .select('count')
      .eq('customer_id', id)

    if (ledgerError) {
      return { error: 'Failed to check customer transactions' }
    }

    const hasTransactions = ledger && ledger.length > 0 && ledger[0].count > 0

    // Check if customer has associated sales
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('count')
      .eq('customer_id', id)

    if (salesError) {
      return { error: 'Failed to check customer sales' }
    }

    const hasSales = sales && sales.length > 0 && sales[0].count > 0

    // Prevent deletion if customer has active balance (unless forced)
    if (customer.current_balance !== 0 && !force) {
      return { 
        error: `Cannot delete customer with active balance of ${customer.current_balance}. Please settle the balance first.` 
      }
    }

    // Prevent deletion if customer has transaction history (unless forced)
    if ((hasTransactions || hasSales) && !force) {
      return { 
        error: 'Cannot delete customer with transaction history. Consider soft deactivating instead.' 
      }
    }

    // If force delete, we need to handle foreign key constraints
    if (force) {
      // Delete ledger entries first
      const { error: ledgerDeleteError } = await supabase
        .from('customer_ledger')
        .delete()
        .eq('customer_id', id)

      if (ledgerDeleteError) {
        console.error('[DELETE CUSTOMER] Error deleting ledger entries:', ledgerDeleteError)
        return { error: 'Failed to delete customer ledger entries' }
      }

      // Note: We don't delete sales as they are important business records
      // We just nullify the customer_id in sales
      const { error: salesUpdateError } = await supabase
        .from('sales')
        .update({ customer_id: null })
        .eq('customer_id', id)

      if (salesUpdateError) {
        console.error('[DELETE CUSTOMER] Error updating sales:', salesUpdateError)
        return { error: 'Failed to update associated sales' }
      }
    }

    // Proceed with soft delete
    const { error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/customers')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete customer' }
  }
}

export async function getCustomerLedger(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('customer_ledger')
      .select(`
        *,
        sales (
          id,
          sale_date,
          total_amount,
          sale_items (
            id,
            quantity,
            selling_price_usd,
            selling_price_syp,
            total_price,
            products (
              id,
              name,
              barcode
            )
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export async function getCustomersWithDebt() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .gt('current_balance', 0)
      .order('current_balance', { ascending: false })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}
