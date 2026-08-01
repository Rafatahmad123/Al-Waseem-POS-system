import { NextResponse } from 'next/server'
import { getCustomers } from '@/app/actions/customers'

export async function GET() {
  try {
    const customers = await getCustomers()
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}
