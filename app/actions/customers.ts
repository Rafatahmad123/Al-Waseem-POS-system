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

export async function deleteCustomer(id: string) {
  try {
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
          total_amount
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
