'use server'

import { supabase } from '@/lib/supabaseClient'

export interface ReportMetrics {
  totalRevenue: number
  totalCost: number
  netProfit: number
  totalSales: number
  totalItemsSold: number
}

export interface DateRange {
  startDate: string
  endDate: string
}

/**
 * Get report metrics for a given date range
 * @param dateRange - Optional date range for filtering
 * @returns Report metrics including revenue, cost, and profit
 */
export async function getReportMetrics(dateRange?: DateRange): Promise<ReportMetrics> {
  let salesQuery = supabase.from('sales').select('total_amount')

  if (dateRange) {
    // Convert date strings to full ISO timestamps for proper timezone handling
    const startDateTime = new Date(dateRange.startDate).toISOString()
    const endDateTime = new Date(dateRange.endDate + 'T23:59:59.999Z').toISOString()
    
    salesQuery = salesQuery.gte('sale_date', startDateTime).lte('sale_date', endDateTime)
  }

  const { data: sales, error: salesError } = await salesQuery

  if (salesError) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      netProfit: 0,
      totalSales: 0,
      totalItemsSold: 0,
    }
  }

  const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
  const totalSales = sales?.length || 0

  // Get sale items to calculate cost and items sold
  let saleItemsQuery = supabase
    .from('sale_items')
    .select(`
      quantity,
      selling_price_usd,
      products (
        cost_price
      )
    `)

  if (dateRange) {
    const startDateTime = new Date(dateRange.startDate).toISOString()
    const endDateTime = new Date(dateRange.endDate + 'T23:59:59.999Z').toISOString()
    
    saleItemsQuery = saleItemsQuery
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime)
  }

  const { data: saleItems, error: itemsError } = await saleItemsQuery

  if (itemsError) {
    return {
      totalRevenue,
      totalCost: 0,
      netProfit: totalRevenue,
      totalSales,
      totalItemsSold: 0,
    }
  }

  let totalCost = 0
  let totalItemsSold = 0

  saleItems?.forEach((item: any) => {
    const quantity = item.quantity || 0
    const costPrice = item.products?.cost_price || 0
    totalCost += quantity * costPrice
    totalItemsSold += quantity
  })

  const netProfit = totalRevenue - totalCost

  return {
    totalRevenue,
    totalCost,
    netProfit,
    totalSales,
    totalItemsSold,
  }
}

/**
 * Get sales data for chart visualization
 * @param dateRange - Optional date range for filtering
 * @returns Array of daily sales data
 */
export async function getSalesData(dateRange?: DateRange) {
  let query = supabase
    .from('sales')
    .select('sale_date, total_amount')
    .order('sale_date', { ascending: true })

  if (dateRange) {
    const startDateTime = new Date(dateRange.startDate).toISOString()
    const endDateTime = new Date(dateRange.endDate + 'T23:59:59.999Z').toISOString()
    
    query = query.gte('sale_date', startDateTime).lte('sale_date', endDateTime)
  }

  const { data, error } = await query

  if (error) {
    return []
  }

  // Group by date
  const groupedData: Record<string, number> = {}
  data?.forEach((sale) => {
    const date = new Date(sale.sale_date).toISOString().split('T')[0]
    groupedData[date] = (groupedData[date] || 0) + Number(sale.total_amount)
  })

  return Object.entries(groupedData).map(([date, amount]) => ({
    date,
    amount,
  }))
}

/**
 * Get top selling products
 * @param dateRange - Optional date range for filtering
 * @param limit - Maximum number of products to return
 * @returns Array of top selling products
 */
export async function getTopSellingProducts(dateRange?: DateRange, limit: number = 10) {
  let query = supabase
    .from('sale_items')
    .select(`
      quantity,
      total_price,
      products (
        id,
        name,
        barcode
      )
    `)
    .order('quantity', { ascending: false })
    .limit(limit)

  if (dateRange) {
    const startDateTime = new Date(dateRange.startDate).toISOString()
    const endDateTime = new Date(dateRange.endDate + 'T23:59:59.999Z').toISOString()
    
    query = query
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime)
  }

  const { data, error } = await query

  if (error) {
    return []
  }

  // Group by product
  const productMap = new Map()

  data?.forEach((item: any) => {
    const productId = item.products?.id
    if (!productId) return

    const existing = productMap.get(productId) || {
      id: productId,
      name: item.products?.name || '',
      barcode: item.products?.barcode || '',
      totalQuantity: 0,
      totalRevenue: 0,
    }

    existing.totalQuantity += item.quantity
    existing.totalRevenue += item.total_price
    productMap.set(productId, existing)
  })

  return Array.from(productMap.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit)
}
