import { supabase, supabaseAdmin } from './supabaseClient'

/**
 * Get the current exchange rate from settings
 */
export async function getExchangeRate(): Promise<number> {
  try {
    // Use supabaseAdmin to bypass RLS and use service role permissions
    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('settings')
      .select('value')
      .eq('key', 'exchange_rate')
      .single()

    if (error || !data) {
      console.warn('Exchange rate not found in settings, defaulting to 12500')
      return 12500
    }

    const rate = parseFloat(data.value)
    return isNaN(rate) || rate <= 0 ? 12500 : rate
  } catch (error) {
    console.error('Error in getExchangeRate:', error)
    return 12500
  }
}

/**
 * Get the current pricing mode from settings
 */
export async function getPricingMode(): Promise<'USD' | 'SYP'> {
  try {
    // Use supabaseAdmin to bypass RLS and use service role permissions
    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('settings')
      .select('value')
      .eq('key', 'pricing_mode')
      .maybeSingle()

    if (error || !data || !data.value) {
      console.warn('Pricing mode not found, defaulting to USD')
      return 'USD'
    }

    return data.value === 'SYP' ? 'SYP' : 'USD'
  } catch (error) {
    console.error('Error in getPricingMode:', error)
    return 'USD'
  }
}

// --- الدوال الحسابية (بقيت كما هي لأن منطقها سليم تماماً) ---

export function sypToUsd(amountSYP: number, exchangeRate: number): number {
  if (exchangeRate <= 0) return 0
  // Safeguard against overflow: check if the multiplication would exceed safe integer range
  const MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER / 100
  if (amountSYP > MAX_SAFE_VALUE) {
    console.warn('sypToUsd: amountSYP exceeds safe integer range, may lose precision')
  }
  const amountInCents = Math.round((amountSYP * 100) / exchangeRate)
  return amountInCents / 100
}

export function usdToSyp(amountUSD: number, exchangeRate: number): number {
  if (exchangeRate <= 0) return 0
  // Safeguard against overflow: check if the multiplication would exceed safe integer range
  const MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER / (exchangeRate * 100)
  if (amountUSD > MAX_SAFE_VALUE) {
    console.warn('usdToSyp: amountUSD exceeds safe integer range, may lose precision')
  }
  const amountInCents = Math.round(amountUSD * exchangeRate * 100)
  return amountInCents / 100
}

export async function sypToUsdWithCurrentRate(amountSYP: number): Promise<number> {
  const exchangeRate = await getExchangeRate()
  return sypToUsd(amountSYP, exchangeRate)
}

export async function usdToSypWithCurrentRate(amountUSD: number): Promise<number> {
  const exchangeRate = await getExchangeRate()
  return usdToSyp(amountUSD, exchangeRate)
}

export function formatCurrency(amount: number, currency: 'USD' | 'SYP' = 'USD'): string {
  const roundedAmount = Math.round(amount * 100) / 100
  return currency === 'USD' 
    ? `$${roundedAmount.toFixed(2)}` 
    : `${roundedAmount.toFixed(0)} SYP` // اليرة السورية غالباً لا تحتاج لكسور
}

/**
 * Format amount in both USD and SYP for display
 * @param amountUSD - Amount in USD
 * @param exchangeRate - Current exchange rate
 * @returns Formatted string like "$124.20 (1,552,500 SYP)"
 */
export function formatDualCurrency(amountUSD: number, exchangeRate: number): string {
  const amountSYP = usdToSyp(amountUSD, exchangeRate)
  const formattedUSD = formatCurrency(amountUSD, 'USD')
  const formattedSYP = formatCurrency(amountSYP, 'SYP')
  return `${formattedUSD} (${formattedSYP})`
}

export function getPriceInMode(priceUSD: number, priceSYP: number, targetMode: 'USD' | 'SYP'): number {
  return targetMode === 'USD' ? priceUSD : priceSYP
}

export function convertPrice(amount: number, from: 'USD'|'SYP', to: 'USD'|'SYP', rate: number): number {
  if (from === to) return amount
  return from === 'USD' ? usdToSyp(amount, rate) : sypToUsd(amount, rate)
}

export function ensureBothPrices(priceUSD: number, priceSYP: number, exchangeRate: number) {
  // Safeguard: ensure prices are within safe range
  const MAX_SAFE_PRICE = Number.MAX_SAFE_INTEGER / 10000 // Allow for large exchange rates
  
  if (priceUSD > MAX_SAFE_PRICE) {
    console.warn('ensureBothPrices: priceUSD exceeds safe range, capping to maximum safe value')
    priceUSD = MAX_SAFE_PRICE
  }
  if (priceSYP > MAX_SAFE_PRICE) {
    console.warn('ensureBothPrices: priceSYP exceeds safe range, capping to maximum safe value')
    priceSYP = MAX_SAFE_PRICE
  }
  
  if (priceUSD > 0 && priceSYP > 0) return { priceUSD, priceSYP }
  if (priceUSD > 0) return { priceUSD, priceSYP: usdToSyp(priceUSD, exchangeRate) }
  if (priceSYP > 0) return { priceUSD: sypToUsd(priceSYP, exchangeRate), priceSYP }
  return { priceUSD: 0, priceSYP: 0 }
}