import { supabase } from './supabaseClient'

/**
 * Calculate total stock for a product by aggregating quantities from stock_batches
 * Uses simple aggregate sum (can be extended to FIFO/LIFO logic later)
 * @param productId - The product ID to calculate stock for
 * @returns Total stock quantity
 */
export async function calculateTotalStock(productId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('stock_batches')
      .select('quantity')
      .eq('product_id', productId)

    if (error) {
      console.error('Error fetching stock batches:', error)
      return 0
    }

    if (!data || data.length === 0) {
      return 0
    }

    // Aggregate all quantities
    const totalStock = data.reduce((sum, batch) => sum + batch.quantity, 0)
    return totalStock
  } catch (error) {
    console.error('Error in calculateTotalStock:', error)
    return 0
  }
}

/**
 * Get stock batches for a product with detailed information
 * @param productId - The product ID
 * @returns Array of stock batches
 */
export async function getProductStockBatches(productId: string) {
  try {
    const { data, error } = await supabase
      .from('stock_batches')
      .select(`
        *,
        suppliers (
          id,
          name
        )
      `)
      .eq('product_id', productId)
      .order('purchase_date', { ascending: false })

    if (error) {
      console.error('Error fetching stock batches:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getProductStockBatches:', error)
    return []
  }
}

/**
 * Check if a product is low on stock
 * @param productId - The product ID
 * @param minStockLevel - Minimum stock level threshold
 * @returns True if stock is below minimum level
 */
export async function isLowStock(productId: string, minStockLevel: number): Promise<boolean> {
  const totalStock = await calculateTotalStock(productId)
  return totalStock <= minStockLevel
}

/**
 * Get stock summary for a product including total stock and batch count
 * @param productId - The product ID
 * @returns Stock summary object
 */
export async function getStockSummary(productId: string) {
  try {
    const { data, error } = await supabase
      .from('stock_batches')
      .select('quantity, purchase_date, expiry_date')
      .eq('product_id', productId)

    if (error) {
      console.error('Error fetching stock batches:', error)
      return {
        totalStock: 0,
        batchCount: 0,
        expiringSoon: 0,
      }
    }

    if (!data || data.length === 0) {
      return {
        totalStock: 0,
        batchCount: 0,
        expiringSoon: 0,
      }
    }

    const totalStock = data.reduce((sum, batch) => sum + batch.quantity, 0)
    const batchCount = data.length

    // Check for batches expiring within 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const expiringSoon = data.filter(
      (batch) => batch.expiry_date && new Date(batch.expiry_date) <= thirtyDaysFromNow
    ).length

    return {
      totalStock,
      batchCount,
      expiringSoon,
    }
  } catch (error) {
    console.error('Error in getStockSummary:', error)
    return {
      totalStock: 0,
      batchCount: 0,
      expiringSoon: 0,
    }
  }
}
