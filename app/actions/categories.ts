'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'
import { CategoryInsert, CategoryUpdate } from '@/lib/types/database'

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}

export async function getCategoryById(id: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data
}

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null

  if (!name) {
    return { error: 'Name is required' }
  }

  const categoryData: CategoryInsert = {
    name,
    description: description || null,
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/categories')
  return { success: true, data }
}

export async function updateCategory(formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null

  if (!id || !name) {
    return { error: 'ID and Name are required' }
  }

  const categoryData: CategoryUpdate = {
    name,
    description: description || null,
  }

  const { data, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/categories')
  return { success: true, data }
}

export async function deleteCategory(id: string) {
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id)
    .limit(1)

  if (products && products.length > 0) {
    return { error: 'Cannot delete category with associated products' }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/categories')
  return { success: true }
}
