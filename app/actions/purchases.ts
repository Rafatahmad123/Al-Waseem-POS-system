'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'
import { PurchaseInsert, PurchaseItemInsert, StockBatchInsert } from '@/lib/types/database'
import { updateStockAtomically } from './products'

export async function getPurchases() {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers (
        id,
        name
      ),
      purchase_items (
        *,
        products (
          id,
          name,
          barcode
        )
      )
    `)
    .order('purchase_date', { ascending: false })

  if (error) {
    console.error('Error fetching purchases:', error)
    return []
  }

  return data
}

export async function getPurchaseById(id: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers (
        id,
        name
      ),
      purchase_items (
        *,
        products (
          id,
          name,
          barcode
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching purchase:', error)
    return null
  }

  return data
}

export async function createPurchase(formData: FormData) {
  const supplier_id = formData.get('supplier_id') as string | null
  const purchase_date = formData.get('purchase_date') as string
  const notes = formData.get('notes') as string | null
  const itemsJson = formData.get('items') as string

  if (!itemsJson) {
    return { error: 'No items provided' }
  }

  const items = JSON.parse(itemsJson)

  // Calculate total amount
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.costPerUnit * item.quantity), 0)
  
  // Safeguard: cap total amount to prevent overflow
  const MAX_SAFE_TOTAL = 999999999999999.99 // NUMERIC(20,2) max value
  const safeTotalAmount = Math.min(totalAmount, MAX_SAFE_TOTAL)

  // Create purchase record
  const purchaseData: PurchaseInsert = {
    supplier_id: supplier_id || null,
    purchase_date: purchase_date ? new Date(purchase_date).toISOString() : new Date().toISOString(),
    total_amount: safeTotalAmount,
    notes: notes || null,
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert(purchaseData)
    .select()
    .single()

  if (purchaseError) {
    console.error('Error creating purchase:', purchaseError)
    return { error: purchaseError.message }
  }

  // Create purchase items and stock batches
  for (const item of items) {
    // Safeguard: cap individual item costs to prevent overflow
    const MAX_SAFE_COST = 999999999999999.99 // NUMERIC(20,2) max value
    const safeCostPerUnit = Math.min(item.costPerUnit, MAX_SAFE_COST)
    const safeTotalCost = Math.min(safeCostPerUnit * item.quantity, MAX_SAFE_COST)
    
    // Create purchase item
    const purchaseItemData: PurchaseItemInsert = {
      purchase_id: purchase.id,
      product_id: item.productId,
      quantity: item.quantity,
      cost_per_unit: safeCostPerUnit,
      total_cost: safeTotalCost,
    }

    const { error: itemError } = await supabase
      .from('purchase_items')
      .insert(purchaseItemData)

    if (itemError) {
      console.error('Error creating purchase item:', itemError)
      return { error: itemError.message }
    }

    // Create stock batch
    const stockBatchData: StockBatchInsert = {
      product_id: item.productId,
      supplier_id: supplier_id || null,
      batch_number: item.batchNumber || null,
      quantity: item.quantity,
      cost_per_unit: safeCostPerUnit,
      purchase_date: purchase_date ? new Date(purchase_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiry_date: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : null,
    }

    const { error: batchError } = await supabase
      .from('stock_batches')
      .insert(stockBatchData)

    if (batchError) {
      console.error('Error creating stock batch:', batchError)
      return { error: batchError.message }
    }

    // Update product current_stock atomically with inventory logging
    const { data: product } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', item.productId)
      .eq('is_active', true)
      .single()

    if (product) {
      const newStock = product.current_stock + item.quantity
      const stockResult = await updateStockAtomically(
        item.productId,
        newStock,
        'purchase',
        `Purchase stock addition: ${purchase.id} - ${item.quantity} units added`
      )

      if (stockResult.error) {
        console.error('[STOCK UPDATE] Error updating stock:', stockResult.error)
        return { error: stockResult.error }
      }
    }
  }

  revalidatePath('/dashboard/purchases')
  revalidatePath('/dashboard/products')
  return { success: true, data: purchase }
}

export async function deletePurchase(id: string) {
  // Get purchase items to reverse stock
  const { data: purchaseItems } = await supabase
    .from('purchase_items')
    .select('*')
    .eq('purchase_id', id)

  if (purchaseItems) {
    // Reverse stock atomically with inventory logging (adjustment movement)
    for (const item of purchaseItems) {
      const { data: product } = await supabase
        .from('products')
        .select('current_stock')
      .eq('id', item.product_id)
      .eq('is_active', true)
      .single()

      if (product) {
        const newStock = Math.max(0, product.current_stock - item.quantity)
        const stockResult = await updateStockAtomically(
          item.product_id,
          newStock,
          'adjustment',
          `Purchase deletion reversal: ${id} - ${item.quantity} units removed`
        )

        if (stockResult.error) {
          console.error('[STOCK REVERSAL] Error reversing stock:', stockResult.error)
          return { error: stockResult.error }
        }
      }
    }
  }

  const { error } = await supabase.from('purchases').delete().eq('id', id)

  if (error) {
    console.error('Error deleting purchase:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/purchases')
  revalidatePath('/dashboard/products')
  return { success: true }
}
