'use server'

import { supabase } from '@/lib/supabaseClient'
import { getDailySalesAmount, getMonthlyPurchasesAmount, getSalesTrendFromLogs } from './stats'
import { getDailyExpenses, getMonthlyExpenses } from './expenses'

export async function getTodaySales() {
  return await getDailySalesAmount()
}

export async function getExpiringProducts() {
  try {
    const { data, error } = await supabase
      .from('expiring_products')
      .select('*')
      .order('days_until_expiry', { ascending: true })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export async function getCriticalExpiringProducts() {
  try {
    const { data, error } = await supabase
      .from('expiring_products')
      .select('*')
      .in('expiry_status', ['expired', 'critical'])
      .order('days_until_expiry', { ascending: true })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export async function getProductTurnover(days: number = 30) {
  try {
    const { data, error } = await supabase.rpc('get_product_turnover', {
      p_days: days,
    })

    if (error) return []
    return data ?? []
  } catch {
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
