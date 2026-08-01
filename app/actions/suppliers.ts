'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'
import { SupplierInsert, SupplierUpdate } from '@/lib/types/database'

export async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }

  return data
}

export async function getSupplierById(id: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching supplier:', error)
    return null
  }

  return data
}

export async function createSupplier(formData: FormData) {
  const name = formData.get('name') as string
  const contact_person = formData.get('contact_person') as string | null
  const phone = formData.get('phone') as string | null
  const email = formData.get('email') as string | null
  const address = formData.get('address') as string | null

  if (!name) {
    return { error: 'Name is required' }
  }

  const supplierData: SupplierInsert = {
    name,
    contact_person: contact_person || null,
    phone: phone || null,
    email: email || null,
    address: address || null,
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplierData)
    .select()
    .single()

  if (error) {
    console.error('Error creating supplier:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/purchases')
  return { success: true, data }
}

export async function updateSupplier(formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const contact_person = formData.get('contact_person') as string | null
  const phone = formData.get('phone') as string | null
  const email = formData.get('email') as string | null
  const address = formData.get('address') as string | null

  if (!id || !name) {
    return { error: 'ID and Name are required' }
  }

  const supplierData: SupplierUpdate = {
    name,
    contact_person: contact_person || null,
    phone: phone || null,
    email: email || null,
    address: address || null,
  }

  const { data, error } = await supabase
    .from('suppliers')
    .update(supplierData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating supplier:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/purchases')
  return { success: true, data }
}

export async function deleteSupplier(id: string) {
  // Check if supplier has purchases
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id')
    .eq('supplier_id', id)
    .limit(1)

  if (purchases && purchases.length > 0) {
    return { error: 'Cannot delete supplier with associated purchases' }
  }

  const { error } = await supabase.from('suppliers').delete().eq('id', id)

  if (error) {
    console.error('Error deleting supplier:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/purchases')
  return { success: true }
}
