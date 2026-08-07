'use server'

import { supabase } from '@/lib/supabaseClient'
import { getDailySalesAmount, getMonthlyPurchasesAmount, getSalesTrendFromLogs } from './stats'
import { getDailyExpenses, getMonthlyExpenses } from './expenses'

export async function getTodaySales() {
  return await getDailySalesAmount()
}

export async function getExpiringProducts() {
  try {
    // Fetch all active products with expiry dates
    const { data, error } = await supabase
      .from('products')
      .select('id, name, barcode, current_stock, expiry_date, selling_price_usd, selling_price_syp')
      .eq('is_active', true)
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true })

    if (error) {
      console.error('[EXPIRY] Error fetching products:', error)
      return []
    }

    if (!data || data.length === 0) {
      console.log('[EXPIRY] No products with expiry dates found')
      return []
    }

    // Calculate expiry status for each product
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset to start of day for accurate comparison

    const categorizedProducts = data.map((product) => {
      const expiryDate = new Date(product.expiry_date)
      expiryDate.setHours(0, 0, 0, 0) // Reset to start of day
      
      const diffTime = expiryDate.getTime() - today.getTime()
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let expiryStatus: 'expired' | 'critical' | 'warning' | 'ok'
      
      if (daysUntilExpiry < 0) {
        expiryStatus = 'expired'
      } else if (daysUntilExpiry <= 7) {
        expiryStatus = 'critical'
      } else if (daysUntilExpiry <= 30) {
        expiryStatus = 'warning'
      } else {
        expiryStatus = 'ok'
      }

      return {
        ...product,
        days_until_expiry: daysUntilExpiry,
        expiry_status: expiryStatus,
        batch_quantity: product.current_stock, // Use current_stock as batch_quantity
        cost_per_unit: 0, // Not available in products table
      }
    })

    // Filter to only show products that are expiring within 30 days or already expired
    const expiringProducts = categorizedProducts.filter(
      (product) => product.expiry_status !== 'ok'
    )

    console.log('[EXPIRY] Total products with expiry dates:', data.length)
    console.log('[EXPIRY] Products expiring within 30 days:', expiringProducts.length)
    console.log('[EXPIRY] Expired:', expiringProducts.filter(p => p.expiry_status === 'expired').length)
    console.log('[EXPIRY] Critical:', expiringProducts.filter(p => p.expiry_status === 'critical').length)
    console.log('[EXPIRY] Warning:', expiringProducts.filter(p => p.expiry_status === 'warning').length)

    return expiringProducts
  } catch (error) {
    console.error('[EXPIRY] Unexpected error:', error)
    return []
  }
}

export async function getCriticalExpiringProducts() {
  try {
    const allExpiringProducts = await getExpiringProducts()
    return allExpiringProducts.filter(
      (product) => product.expiry_status === 'expired' || product.expiry_status === 'critical'
    )
  } catch {
    return []
  }
}

export async function getProductTurnover(days: number = 30) {
  try {
    // Calculate the start date for the period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateIso = startDate.toISOString()

    console.log('[TURNOVER] Fetching product turnover for last', days, 'days')
    console.log('[TURNOVER] Start date:', startDateIso)

    // Query products with their sales data for the specified period
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        barcode,
        current_stock,
        categories (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (productsError) {
      console.error('[TURNOVER] Error fetching products:', productsError)
      return []
    }

    if (!products || products.length === 0) {
      console.log('[TURNOVER] No products found')
      return []
    }

    console.log('[TURNOVER] Found', products.length, 'active products')

    // Fetch sales data for each product in the specified period
    const productIds = products.map(p => p.id)
    
    const { data: saleItems, error: salesError } = await supabase
      .from('sale_items')
      .select(`
        product_id,
        quantity,
        sales!inner (
          created_at
        )
      `)
      .in('product_id', productIds)
      .gte('sales.created_at', startDateIso)

    if (salesError) {
      console.error('[TURNOVER] Error fetching sales:', salesError)
      // Continue with zero sales for all products
    }

    // Aggregate sales by product
    const salesByProduct = new Map<string, number>()
    
    if (saleItems) {
      saleItems.forEach((item: any) => {
        const currentSales = salesByProduct.get(item.product_id) || 0
        salesByProduct.set(item.product_id, currentSales + item.quantity)
      })
    }

    console.log('[TURNOVER] Sales data aggregated for', salesByProduct.size, 'products')

    // Calculate turnover metrics and categorize products
    const turnoverData = products.map((product: any) => {
      const totalSold = salesByProduct.get(product.id) || 0
      const currentStock = product.current_stock || 0
      
      // Calculate turnover rate (sold / (stock + sold) to avoid division by zero)
      const turnoverRate = currentStock + totalSold > 0 
        ? (totalSold / (currentStock + totalSold)) * 100 
        : 0

      // Categorize based on sales volume and turnover rate
      let movementSpeed: 'Fast' | 'Normal' | 'Slow'
      
      if (totalSold === 0) {
        movementSpeed = 'Slow' // No sales at all
      } else if (turnoverRate > 50 || totalSold > currentStock) {
        movementSpeed = 'Fast' // High turnover or sold more than current stock
      } else if (turnoverRate > 20 || totalSold > currentStock * 0.5) {
        movementSpeed = 'Normal' // Moderate turnover
      } else {
        movementSpeed = 'Slow' // Low turnover
      }

      return {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        category: product.categories?.name || 'Uncategorized',
        current_stock: currentStock,
        total_sold: totalSold,
        turnover_rate: Math.round(turnoverRate * 100) / 100, // Round to 2 decimal places
        movement_speed: movementSpeed
      }
    })

    // Sort by movement speed (Fast first, then Normal, then Slow) and by total sold
    const sortOrder = { 'Fast': 0, 'Normal': 1, 'Slow': 2 }
    turnoverData.sort((a, b) => {
      const speedDiff = sortOrder[a.movement_speed] - sortOrder[b.movement_speed]
      if (speedDiff !== 0) return speedDiff
      return b.total_sold - a.total_sold // Then by total sold (descending)
    })

    console.log('[TURNOVER] Final turnover data:', {
      total: turnoverData.length,
      fast: turnoverData.filter(p => p.movement_speed === 'Fast').length,
      normal: turnoverData.filter(p => p.movement_speed === 'Normal').length,
      slow: turnoverData.filter(p => p.movement_speed === 'Slow').length
    })

    return turnoverData
  } catch (error) {
    console.error('[TURNOVER] Unexpected error:', error)
    return []
  }
}

export async function getLowStockItems() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, barcode, current_stock, min_stock_level')
    .lte('current_stock', 'min_stock_level')
    .order('current_stock', { ascending: true })

  if (error) {
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  const itemsWithConsistentStock = await Promise.all(
    data.map(async (product) => {
      const { data: batches, error: batchesError } = await supabase
        .from('stock_batches')
        .select('quantity')
        .eq('product_id', String(product.id))

      if (batchesError) {
        return null
      }

      const actualStock = batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0
      return {
        ...product,
        current_stock: actualStock,
      }
    })
  )

  const filteredItems = itemsWithConsistentStock
    .filter((item): item is { id: any; name: any; barcode: any; current_stock: number; min_stock_level: any } => item !== null)
    .filter(item => item.current_stock <= item.min_stock_level)
  return filteredItems
}

export async function getMonthPurchases() {
  return await getMonthlyPurchasesAmount()
}

export async function getSalesTrend(days: number = 7) {
  return await getSalesTrendFromLogs(days)
}

export async function getDashboardStats() {
  const [todaySales, lowStockItems, monthPurchases, salesTrend, todayExpenses, monthExpenses] = await Promise.all([
    getTodaySales(),
    getLowStockItems(),
    getMonthPurchases(),
    getSalesTrend(7),
    getDailyExpenses(),
    getMonthlyExpenses(),
  ])

  console.log('[DEBUG] Dashboard stats - todaySales:', todaySales)
  console.log('[DEBUG] Dashboard stats - lowStockItems count:', lowStockItems?.length)
  console.log('[DEBUG] Dashboard stats - monthPurchases:', monthPurchases)
  console.log('[DEBUG] Dashboard stats - salesTrend:', salesTrend)
  console.log('[DEBUG] Dashboard stats - todayExpenses:', todayExpenses)
  console.log('[DEBUG] Dashboard stats - monthExpenses:', monthExpenses)

  // Calculate monthly sales from sales trend data
  const monthSalesTotal = salesTrend.reduce((sum: number, day: any) => sum + (day.amount || 0), 0)

  console.log('[DEBUG] Calculated monthSalesTotal from trend:', monthSalesTotal)

  // Calculate net profit: (Total Sales - Total Expenses)
  // Sales profit is calculated as 20% of sales amount (based on pricing logic)
  const todaySalesProfit = todaySales.totalUSD * 0.20
  const monthSalesProfit = monthSalesTotal * 0.20

  const todayNetProfit = todaySalesProfit - todayExpenses
  const monthNetProfit = monthSalesProfit - monthExpenses

  console.log('[DEBUG] Profit calculations:')
  console.log('[DEBUG] - todaySalesProfit:', todaySalesProfit)
  console.log('[DEBUG] - monthSalesProfit:', monthSalesProfit)
  console.log('[DEBUG] - todayNetProfit:', todayNetProfit)
  console.log('[DEBUG] - monthNetProfit:', monthNetProfit)

  return {
    todaySales,
    lowStockItems,
    monthPurchases,
    salesTrend,
    todayExpenses,
    monthExpenses,
    todayNetProfit,
    monthNetProfit,
  }
}
