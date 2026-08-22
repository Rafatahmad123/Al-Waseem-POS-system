'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'
import { SaleInsert, SaleItemInsert } from '@/lib/types/database'
import { updateStockAtomically } from './products'
import { recordCreditSale } from './debtPayments'

export async function getSales() {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        *,
        products (
          id,
          name,
          barcode
        )
      )
    `)
    .order('sale_date', { ascending: false })

  if (error) {
    console.error('Error fetching sales:', error)
    return []
  }

  console.log('[DEBUG] Raw sales data from database:', JSON.stringify(data, null, 2))
  console.log('[DEBUG] Number of sales fetched:', data?.length || 0)

  return data
}

export async function getSaleById(id: string) {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
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
    console.error('Error fetching sale:', error)
    return null
  }

  return data
}

/**
 * Deduct stock using FIFO approach
 * @param productId - Product ID
 * @param quantity - Quantity to deduct
 * @returns Success or error
 */
async function deductStockFIFO(productId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Get stock batches ordered by purchase_date (FIFO - oldest first)
    const { data: batches, error } = await supabase
      .from('stock_batches')
      .select('*')
      .eq('product_id', productId)
      .gt('quantity', 0)
      .order('purchase_date', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!batches || batches.length === 0) {
      return { success: false, error: 'No stock available' }
    }

    let remainingQuantity = quantity

    for (const batch of batches) {
      if (remainingQuantity <= 0) break

      const deductAmount = Math.min(batch.quantity, remainingQuantity)
      const newQuantity = batch.quantity - deductAmount

      const { error: updateError } = await supabase
        .from('stock_batches')
        .update({ quantity: newQuantity })
        .eq('id', batch.id)

      if (updateError) {
        console.error('Error updating stock batch:', updateError)
        return { success: false, error: updateError.message }
      }

      remainingQuantity -= deductAmount
    }

    if (remainingQuantity > 0) {
      return { success: false, error: 'Insufficient stock available' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deductStockFIFO:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function createSale(formData: FormData) {
  const customer_id = formData.get('customer_id') as string | null
  const payment_type = formData.get('payment_type') as string | null
  const payment_method = formData.get('payment_method') as string | null
  const notes = formData.get('notes') as string | null
  const itemsJson = formData.get('items') as string

  if (!itemsJson) {
    return { error: 'No items provided' }
  }

  const items = JSON.parse(itemsJson)

  // Validate payment_type
  if (payment_type && !['Cash', 'Credit'].includes(payment_type)) {
    return { error: 'Invalid payment type. Must be Cash or Credit' }
  }

  // If payment_type is Credit, customer_id is required
  if (payment_type === 'Credit' && !customer_id) {
    return { error: 'Customer is required for credit sales' }
  }

  // Validate stock availability before creating sale
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', item.productId)
      .single()

    if (!product || product.current_stock < item.quantity) {
      return { error: `Insufficient stock for ${item.name}` }
    }
  }

  // Create sale record
  const totalUSD = items.reduce((sum: number, item: any) => sum + (item.sellingPriceUSD * item.quantity), 0)
  const totalSYP = items.reduce((sum: number, item: any) => sum + (item.sellingPriceSYP * item.quantity), 0)
  
  // Safeguard: cap total amount to prevent overflow
  const MAX_SAFE_TOTAL = 999999999999999.99 // NUMERIC(20,2) max value
  const safeTotalUSD = Math.min(totalUSD, MAX_SAFE_TOTAL)

  const saleData: SaleInsert = {
    total_amount: safeTotalUSD,
    customer_id: customer_id || null,
    payment_type: payment_type || 'Cash',
    payment_method: payment_method || null,
    notes: notes || null,
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert(saleData)
    .select()
    .single()

  if (saleError) {
    console.error('Error creating sale:', saleError)
    return { error: saleError.message }
  }

  // Create sale items
  const saleItems: SaleItemInsert[] = items.map((item: any) => {
    // Safeguard: cap individual item prices to prevent overflow
    const MAX_SAFE_PRICE = 999999999999999.99 // NUMERIC(20,2) max value
    const safeSellingPriceUSD = Math.min(item.sellingPriceUSD, MAX_SAFE_PRICE)
    const safeSellingPriceSYP = Math.min(item.sellingPriceSYP, MAX_SAFE_PRICE)
    const safeTotalPrice = Math.min(safeSellingPriceUSD * item.quantity, MAX_SAFE_PRICE)
    
    return {
      sale_id: sale.id,
      product_id: item.productId,
      quantity: item.quantity,
      selling_price_usd: safeSellingPriceUSD,
      selling_price_syp: safeSellingPriceSYP,
      total_price: safeTotalPrice,
    }
  })

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems)

  if (itemsError) {
    console.error('Error creating sale items:', itemsError)
    return { error: itemsError.message }
  }

  // Deduct stock atomically with inventory logging
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', item.productId)
      .eq('is_active', true)
      .single()

    if (product) {
      const newStock = product.current_stock - item.quantity

      const stockResult = await updateStockAtomically(
        item.productId,
        newStock,
        'sale',
        `Sale deduction: ${sale.id} - ${item.quantity} units sold`
      )

      if (stockResult.error) {
        return { error: stockResult.error }
      }
    }
  }

  // Record credit sale if payment_type is Credit
  if (payment_type === 'Credit' && customer_id) {
    const creditResult = await recordCreditSale(
      customer_id,
      totalUSD,
      sale.id,
      `Credit sale #${sale.id}`
    )

    if (creditResult.error) {
      console.error('[CREDIT SALE] Error recording credit sale:', creditResult.error)
      return { error: creditResult.error }
    }
  }

  revalidatePath('/dashboard/sales')
  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/customers')
  return { success: true, data: sale }
}

export async function deleteSale(id: string) {
  // Get sale items to restore stock
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', id)

  if (saleItems) {
    // Restore stock atomically with inventory logging (return movement)
    for (const item of saleItems) {
      const { data: product } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', item.product_id)
        .eq('is_active', true)
        .single()

      if (product) {
        const newStock = product.current_stock + item.quantity
        const stockResult = await updateStockAtomically(
          item.product_id,
          newStock,
          'return',
          `Sale deletion reversal: ${id} - ${item.quantity} units returned`
        )

        if (stockResult.error) {
          console.error('[STOCK RESTORATION] Error restoring stock:', stockResult.error)
          return { error: stockResult.error }
        }
      }
    }
  }

  const { error } = await supabase.from('sales').delete().eq('id', id)

  if (error) {
    console.error('Error deleting sale:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/sales')
  revalidatePath('/dashboard/products')
  return { success: true }
}

export async function processReturn(formData: FormData) {
  const saleId = formData.get('sale_id') as string
  const itemsJson = formData.get('items') as string
  const notes = formData.get('notes') as string | null

  if (!saleId) {
    return { error: 'Sale ID is required' }
  }

  if (!itemsJson) {
    return { error: 'Items to return are required' }
  }

  const returnItems = JSON.parse(itemsJson)

  // Get the original sale details
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('*, customers(name, current_balance)')
    .eq('id', saleId)
    .single()

  if (saleError || !sale) {
    return { error: 'Sale not found' }
  }

  // Get original sale items
  const { data: originalSaleItems, error: itemsError } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', saleId)

  if (itemsError || !originalSaleItems) {
    return { error: 'Failed to fetch sale items' }
  }

  // Validate return quantities
  for (const returnItem of returnItems) {
    const originalItem = originalSaleItems.find(
      (item: any) => item.product_id === returnItem.productId
    )

    if (!originalItem) {
      return { error: `Item ${returnItem.productId} not found in original sale` }
    }

    if (returnItem.quantity > originalItem.quantity) {
      return { error: `Cannot return more than sold quantity for item ${returnItem.productId}` }
    }
  }

  // Process return - restore stock
  for (const returnItem of returnItems) {
    const { data: product } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', returnItem.productId)
      .eq('is_active', true)
      .single()

    if (product) {
      const newStock = product.current_stock + returnItem.quantity
      const stockResult = await updateStockAtomically(
        returnItem.productId,
        newStock,
        'return',
        `Return from sale ${saleId} - ${returnItem.quantity} units returned`
      )

      if (stockResult.error) {
        console.error('[RETURN] Error restoring stock:', stockResult.error)
        return { error: stockResult.error }
      }
    }
  }

  // Calculate return amount
  const returnAmountUSD = returnItems.reduce(
    (sum: number, item: any) => sum + (item.sellingPriceUSD * item.quantity),
    0
  )

  // If the sale was on credit, update customer balance
  if (sale.payment_type === 'Credit' && sale.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('current_balance')
      .eq('id', sale.customer_id)
      .single()

    if (customer) {
      const newBalance = customer.current_balance - returnAmountUSD
      const { error: balanceError } = await supabase
        .from('customers')
        .update({ current_balance: newBalance })
        .eq('id', sale.customer_id)

      if (balanceError) {
        console.error('[RETURN] Error updating customer balance:', balanceError)
        return { error: balanceError.message }
      }

      // Record the return in customer ledger
      const { error: ledgerError } = await supabase
        .from('customer_ledger')
        .insert({
          customer_id: sale.customer_id,
          sale_id: saleId,
          transaction_type: 'return',
          amount: -returnAmountUSD,
          balance_after: newBalance,
          notes: notes || `Return from sale ${saleId}`
        })

      if (ledgerError) {
        console.error('[RETURN] Error recording in ledger:', ledgerError)
        return { error: ledgerError.message }
      }
    }
  }

  revalidatePath('/dashboard/sales')
  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/customers')
  return { 
    success: true, 
    returnAmount: returnAmountUSD,
    message: `Return processed successfully. $${returnAmountUSD.toFixed(2)} refunded.`
  }
}

export async function processDirectReturn(formData: FormData) {
  const itemsJson = formData.get('items') as string
  const notes = formData.get('notes') as string | null

  if (!itemsJson) {
    return { error: 'Items to return are required' }
  }

  const returnItems = JSON.parse(itemsJson)

  if (returnItems.length === 0) {
    return { error: 'At least one item is required for return' }
  }

  // Process return - restore stock
  for (const returnItem of returnItems) {
    const { data: product } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', returnItem.productId)
      .eq('is_active', true)
      .single()

    if (product) {
      const newStock = product.current_stock + returnItem.quantity
      const stockResult = await updateStockAtomically(
        returnItem.productId,
        newStock,
        'return',
        `Direct return - ${returnItem.quantity} units returned. ${notes || ''}`
      )

      if (stockResult.error) {
        console.error('[DIRECT RETURN] Error restoring stock:', stockResult.error)
        return { error: stockResult.error }
      }
    }
  }

  // Calculate return amount
  const returnAmountUSD = returnItems.reduce(
    (sum: number, item: any) => sum + (item.sellingPriceUSD * item.quantity),
    0
  )

  revalidatePath('/dashboard/sales')
  revalidatePath('/dashboard/products')
  return { 
    success: true, 
    returnAmount: returnAmountUSD,
    message: `Return processed successfully. $${returnAmountUSD.toFixed(2)} refunded to customer.`
  }
}
