import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json([])
  }

  try {
    // Search by sale ID (partial match) or customer name
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers (
          id,
          name,
          current_balance
        ),
        sale_items (
          *,
          products (
            id,
            name,
            barcode
          )
        )
      `)
      .or(`id.ilike.%${query}%,customers.name.ilike.%${query}%`)
      .order('sale_date', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error searching sales:', error)
      return NextResponse.json({ error: 'Failed to search sales' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in sales search API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
