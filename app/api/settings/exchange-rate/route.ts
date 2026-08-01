import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // Use supabaseAdmin to bypass RLS and use service role permissions
    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('settings')
      .select('value')
      .eq('key', 'exchange_rate')
      .single()

    if (error || !data) {
      return NextResponse.json({ rate: 12500 }, { status: 200 })
    }

    const rate = parseFloat(data.value)
    return NextResponse.json({ rate: isNaN(rate) ? 12500 : rate })
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return NextResponse.json({ rate: 12500 }, { status: 200 })
  }
}
