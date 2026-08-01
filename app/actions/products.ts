'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'
import { ProductInsert, ProductUpdate } from '@/lib/types/database'
import { getExchangeRate } from '@/app/actions/settings'

export type MovementType = 'sale' | 'purchase' | 'adjustment' | 'return'

/**
 * Helper function to log inventory movements
 * This ensures all stock changes are documented for audit trail
 */
export async function logInventoryMovement(
  productId: string,
  oldStock: number,
  newStock: number,
  movementType: MovementType,
  notes?: string
): Promise<{ error?: string }> {
  try {
    const stockDiff = newStock - oldStock
    
    // Only log if there's an actual stock change
    if (stockDiff === 0) {
      return {}
    }

    const { error } = await supabase.from('inventory_logs').insert({
      product_id: productId,
      old_stock: oldStock,
      new_stock: newStock,
      stock_diff: stockDiff,
      movement_type: movementType,
      notes: notes || `Stock ${movementType}: ${stockDiff > 0 ? '+' : ''}${stockDiff} units`
    })

    if (error) return { error: error.message }
    return {}
  } catch (error) {
    return { error: 'Failed to log inventory movement' }
  }
}

/**
 * Atomic operation: Update product stock with inventory logging
 * Uses PostgreSQL RPC to ensure both operations succeed or fail together
 */
export async function updateStockAtomically(
  productId: string,
  newStock: number,
  movementType: MovementType,
  notes?: string
): Promise<{ error?: string; data?: any }> {
  try {
    const { data, error } = await supabase.rpc('update_stock_atomically', {
      p_product_id: productId,
      p_new_stock: newStock,
      p_movement_type: movementType,
      p_notes: notes
    })

    if (error) return { error: error.message }
    
    const result = data as any
    if (!result?.success) {
      return { error: result?.error || 'Failed to update stock atomically' }
    }

    return { data: result.data }
  } catch (error) {
    return { error: 'Failed to execute atomic stock update' }
  }
}

export async function getProducts() {
  try {
    // جلب المنتجات النشطة فقط
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('is_active', true) 
      .order('name', { ascending: true })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export async function getProductById(id: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*, categories (id, name)`)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

export async function createProduct(formData: FormData) {
  try {
    const barcode = formData.get('barcode') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const category_id = formData.get('category_id') as string | null
    const cost_price = parseFloat(formData.get('cost_price') as string)
    const selling_price_usd = parseFloat(formData.get('selling_price_usd') as string)
    const selling_price_syp = parseFloat(formData.get('selling_price_syp') as string)
    const current_stock = parseInt(formData.get('current_stock') as string)
    const min_stock_level = parseInt(formData.get('min_stock_level') as string)
    const is_active = formData.get('is_active') === 'true'

    if (!barcode || !name) return { error: 'Barcode and Name are required' }

    // Validate and parse cost price
    const finalCostPrice = isNaN(cost_price) ? 0 : cost_price

    // Safeguard: cap cost price to prevent overflow
    const MAX_SAFE_COST_PRICE = 999999999999999.99 // NUMERIC(20,2) max value
    const safeCostPrice = Math.min(finalCostPrice, MAX_SAFE_COST_PRICE)

    const exchangeRate = await getExchangeRate() || 12500
    
    // Determine pricing mode based on which selling price is provided
    const hasUSD = !isNaN(selling_price_usd) && selling_price_usd > 0
    const hasSYP = !isNaN(selling_price_syp) && selling_price_syp > 0
    
    let finalSellingPriceUSD: number
    let finalSellingPriceSYP: number

    if (hasUSD && hasSYP) {
      // BOTH mode - use provided prices
      finalSellingPriceUSD = selling_price_usd
      finalSellingPriceSYP = selling_price_syp
    } else if (hasUSD) {
      // USD only mode
      finalSellingPriceUSD = selling_price_usd
      finalSellingPriceSYP = finalSellingPriceUSD * exchangeRate
    } else if (hasSYP) {
      // SYP only mode - no exchange rate conversion
      finalSellingPriceSYP = selling_price_syp
      finalSellingPriceUSD = finalSellingPriceSYP / exchangeRate
    } else {
      // Default to USD calculation
      finalSellingPriceUSD = safeCostPrice * 1.20
      finalSellingPriceSYP = finalSellingPriceUSD * exchangeRate
    }

    const finalStock = isNaN(current_stock) ? 0 : current_stock
    const finalMinStock = isNaN(min_stock_level) ? 0 : min_stock_level

    const productData: ProductInsert = {
      barcode,
      name,
      description: description || null,
      category_id: category_id || null,
      cost_price: safeCostPrice,
      cost_price_syp: safeCostPrice * exchangeRate,
      selling_price_usd: finalSellingPriceUSD,
      selling_price_syp: finalSellingPriceSYP,
      current_stock: finalStock,
      min_stock_level: finalMinStock,
      is_active,
    }

    // Insert product with initial stock of 0 to allow atomic logging
    const productDataWithZeroStock = { ...productData, current_stock: 0 }
    const { data, error } = await supabase.from('products').insert(productDataWithZeroStock).select().single()

    if (error) return { error: error.message }

    // If initial stock > 0, log it as a purchase movement atomically
    if (finalStock > 0) {
      const stockResult = await updateStockAtomically(
        data.id,
        finalStock,
        'purchase',
        `Initial stock setup: ${finalStock} units`
      )

      if (stockResult.error) {
        // Rollback product creation if stock logging fails
        await supabase.from('products').delete().eq('id', data.id)
        return { error: `Failed to log initial stock: ${stockResult.error}` }
      }
    }

    revalidatePath('/dashboard/products')
    return { success: true, data }
  } catch (error) {
    return { error: 'Failed to create product' }
  }
}

export async function updateProduct(formData: FormData) {
  try {
    const id = formData.get('id') as string
    const barcode = formData.get('barcode') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const category_id = formData.get('category_id') as string | null
    const cost_price = parseFloat(formData.get('cost_price') as string)
    const selling_price_usd = parseFloat(formData.get('selling_price_usd') as string)
    const selling_price_syp = parseFloat(formData.get('selling_price_syp') as string)
    const current_stock = parseInt(formData.get('current_stock') as string)
    const min_stock_level = parseInt(formData.get('min_stock_level') as string)
    const is_active = formData.get('is_active') === 'true'

    if (!id) return { error: 'Product ID is required' }

    // Fetch current product to get old stock value
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('current_stock, is_active')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (fetchError || !currentProduct) {
      return { error: 'Product not found or inactive' }
    }

    const oldStock = currentProduct.current_stock

    // Validate and parse cost price
    const finalCostPrice = isNaN(cost_price) ? 0 : cost_price

    // Safeguard: cap cost price to prevent overflow
    const MAX_SAFE_COST_PRICE = 999999999999999.99 // NUMERIC(20,2) max value
    const safeCostPrice = Math.min(finalCostPrice, MAX_SAFE_COST_PRICE)

    const finalStock = isNaN(current_stock) ? 0 : current_stock
    const finalMinStock = isNaN(min_stock_level) ? 0 : min_stock_level

    const exchangeRate = await getExchangeRate() || 12500
    
    // Determine pricing mode based on which selling price is provided
    const hasUSD = !isNaN(selling_price_usd) && selling_price_usd > 0
    const hasSYP = !isNaN(selling_price_syp) && selling_price_syp > 0
    
    let finalSellingPriceUSD: number
    let finalSellingPriceSYP: number

    if (hasUSD && hasSYP) {
      // BOTH mode - use provided prices
      finalSellingPriceUSD = selling_price_usd
      finalSellingPriceSYP = selling_price_syp
    } else if (hasUSD) {
      // USD only mode
      finalSellingPriceUSD = selling_price_usd
      finalSellingPriceSYP = finalSellingPriceUSD * exchangeRate
    } else if (hasSYP) {
      // SYP only mode - no exchange rate conversion
      finalSellingPriceSYP = selling_price_syp
      finalSellingPriceUSD = finalSellingPriceSYP / exchangeRate
    } else {
      // Default to USD calculation
      finalSellingPriceUSD = safeCostPrice * 1.20
      finalSellingPriceSYP = finalSellingPriceUSD * exchangeRate
    }

    // Calculate stock difference
    const stockDiff = finalStock - oldStock

    // Update non-stock fields first
    const productData: ProductUpdate = {
      barcode,
      name,
      description,
      category_id,
      cost_price: safeCostPrice,
      cost_price_syp: safeCostPrice * exchangeRate,
      selling_price_usd: finalSellingPriceUSD,
      selling_price_syp: finalSellingPriceSYP,
      min_stock_level: finalMinStock,
      is_active,
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .eq('is_active', true)

    if (updateError) return { error: updateError.message }

    // If stock changed, update atomically with inventory logging
    if (stockDiff !== 0) {
      const movementType: MovementType = stockDiff > 0 ? 'purchase' : 'adjustment'
      const notes = `Stock adjustment from ${oldStock} to ${finalStock} (diff: ${stockDiff > 0 ? '+' : ''}${stockDiff})`
      
      const stockResult = await updateStockAtomically(
        id,
        finalStock,
        movementType,
        notes
      )

      if (stockResult.error) {
        return { error: `Failed to update stock with logging: ${stockResult.error}` }
      }
    }

    revalidatePath('/dashboard/products')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update product' }
  }
}

// التعديل الأهم: الحذف الناعم (Soft Delete)
export async function deleteProduct(id: string) {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false }) // لن نحذف الصف، فقط سنعطله
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/products')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete product' }
  }
}

export async function getCategories() {
  try {
    const { data, error } = await supabase.from('categories').select('id, name').order('name')
    return error ? [] : data
  } catch {
    return []
  }
}

export async function adjustStockForStocktake(productId: string, physicalStock: number, notes?: string) {
  try {
    const { data, error } = await supabase.rpc('adjust_stock_for_stocktake', {
      p_product_id: productId,
      p_physical_stock: physicalStock,
      p_notes: notes,
    })

    if (error) {
      console.error('[STOCKTAKE] Error adjusting stock:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/inventory/stocktake')
    revalidatePath('/dashboard/products')
    return data
  } catch (error) {
    console.error('[STOCKTAKE] Unexpected error:', error)
    return { error: 'Unexpected error occurred' }
  }
}

export async function getProductByBarcode(barcode: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .eq('is_active', true)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}