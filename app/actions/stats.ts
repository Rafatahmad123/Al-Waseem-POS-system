'use server'

import { supabase } from '@/lib/supabaseClient'

/**
 * Get daily sales quantity from inventory_logs
 * Sums the stock_diff where movement_type = 'sale' and created_at is today
 */
export async function getDailySalesQuantity() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('inventory_logs')
    .select('stock_diff')
    .eq('movement_type', 'sale')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())

  if (error) {
    console.error('Error fetching daily sales quantity:', error)
    return 0
  }

  // Sum the absolute stock_diff (sales are negative in stock_diff)
  const totalQuantity = data.reduce((sum, log) => sum + Math.abs(log.stock_diff || 0), 0)
  return totalQuantity
}

/**
 * Get monthly purchases quantity from inventory_logs
 * Sums the stock_diff where movement_type = 'purchase' and created_at is within the current month
 */
export async function getMonthlyPurchasesQuantity() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const { data, error } = await supabase
    .from('inventory_logs')
    .select('stock_diff')
    .eq('movement_type', 'purchase')
    .gte('created_at', firstDay.toISOString())
    .lte('created_at', lastDay.toISOString())

  if (error) {
    console.error('Error fetching monthly purchases quantity:', error)
    return 0
  }

  // Sum the stock_diff (purchases are positive in stock_diff)
  const totalQuantity = data.reduce((sum, log) => sum + (log.stock_diff || 0), 0)
  return totalQuantity
}

/**
 * Get daily sales with monetary values
 * Queries the sales table directly instead of inventory_logs
 */
export async function getDailySalesAmount() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('sales')
    .select('total_amount')
    .gte('sale_date', today.toISOString())
    .lt('sale_date', tomorrow.toISOString())

  console.log('[DEBUG] Daily sales query - today:', today.toISOString(), 'tomorrow:', tomorrow.toISOString())
  console.log('[DEBUG] Daily sales data:', data)
  console.log('[DEBUG] Daily sales error:', error)

  if (error) {
    console.error('[ERROR] Error fetching daily sales:', error)
    return { totalUSD: 0, totalSYP: 0 }
  }

  if (!data || data.length === 0) {
    console.log('[DEBUG] No sales found for today')
    return { totalUSD: 0, totalSYP: 0 }
  }

  const totalUSD = data.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
  const totalSYP = totalUSD * 12500

  console.log('[DEBUG] Daily sales totalUSD:', totalUSD, 'totalSYP:', totalSYP)

  return { totalUSD, totalSYP }
}

/**
 * Get monthly purchases with monetary values
 * Joins inventory_logs with products to calculate actual purchases amount
 */
export async function getMonthlyPurchasesAmount() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const { data, error } = await supabase
    .from('inventory_logs')
    .select(`
      stock_diff,
      products!inner (
        selling_price_usd
      )
    `)
    .eq('movement_type', 'purchase')
    .gte('created_at', firstDay.toISOString())
    .lte('created_at', lastDay.toISOString())

  if (error) {
    return 0
  }

  if (!data || data.length === 0) {
    return 0
  }

  const totalUSD = data.reduce((sum, log: any) => {
    const quantity = log.stock_diff || 0
    const price = log.products?.selling_price_usd || 0
    return sum + (quantity * price)
  }, 0)

  return totalUSD
}

/**
 * Get sales trend from sales table
 * Groups sales by date for the specified number of days
 */
export async function getSalesTrendFromLogs(days: number = 7) {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - days + 1)
  startDate.setHours(0, 0, 0, 0)

  console.log('[DEBUG] Sales trend query - startDate:', startDate.toISOString(), 'endDate:', endDate.toISOString())

  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, total_amount')
    .gte('sale_date', startDate.toISOString())
    .lte('sale_date', endDate.toISOString())
    .order('sale_date', { ascending: true })

  console.log('[DEBUG] Sales trend data:', data)
  console.log('[DEBUG] Sales trend error:', error)

  if (error) {
    console.error('[ERROR] Error fetching sales trend:', error)
    const trend = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      trend.push({
        date: dateStr,
        amount: 0,
      })
    }
    return trend
  }

  if (!data || data.length === 0) {
    console.log('[DEBUG] No sales found for trend period')
    const trend = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      trend.push({
        date: dateStr,
        amount: 0,
      })
    }
    return trend
  }

  const grouped = data.reduce((acc: Record<string, number>, sale: any) => {
    const date = new Date(sale.sale_date).toISOString().split('T')[0]
    const amount = sale.total_amount || 0
    acc[date] = (acc[date] || 0) + amount
    return acc
  }, {})

  console.log('[DEBUG] Grouped sales by date:', grouped)

  const trend = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    trend.push({
      date: dateStr,
      amount: grouped[dateStr] || 0,
    })
  }

  return trend
}
