import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // Use supabaseAdmin to bypass RLS and use service role permissions
    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('settings')
      .select('value')
      .eq('key', 'pricing_mode')
      .single()

    if (error || !data) {
      return NextResponse.json({ mode: 'USD' }, { status: 200 })
    }

    const mode = data.value as 'USD' | 'SYP'
    return NextResponse.json({ mode: mode === 'SYP' ? 'SYP' : 'USD' })
  } catch (error) {
    console.error('Error fetching pricing mode:', error)
    return NextResponse.json({ mode: 'USD' }, { status: 200 })
  }
}
