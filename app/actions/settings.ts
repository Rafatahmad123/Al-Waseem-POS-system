'use server'

import { supabase, supabaseAdmin } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'

// دالة لجلب سعر الصرف مع التعامل مع حالات عدم وجود بيانات
export async function getExchangeRate() {
  try {
    // Use supabaseAdmin to bypass RLS and use service role permissions
    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('settings')
      .select('value')
      .eq('key', 'exchange_rate')
      .single()

    if (error) {
      console.error('Error fetching exchange rate:', error)
      return null
    }

    return data?.value ? parseFloat(data.value) : null
  } catch (err) {
    console.error('Unexpected error in getExchangeRate:', err)
    return null
  }
}

// دالة لتحديث سعر الصرف
export async function updateExchangeRate(newRate: number) {
  try {
    // Validate input
    if (typeof newRate !== 'number' || isNaN(newRate) || newRate <= 0) {
      return { success: false, error: 'سعر الصرف يجب أن يكون رقماً موجباً' }
    }

    const dataToUpsert = { 
      key: 'exchange_rate',
      value: newRate.toString(),
      description: 'USD to SYP exchange rate'
    }

    console.log('Attempting to upsert exchange rate:', dataToUpsert)
    console.log('Table: public.settings')

    // Use supabaseAdmin to bypass RLS and use service role permissions
    const client = supabaseAdmin || supabase
    const { error, data } = await client
      .from('settings')
      .upsert(dataToUpsert, { onConflict: 'key' })

    if (error) {
      console.error('Supabase upsert error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // Return specific error message based on error code
      if (error.code === '23505') {
        return { success: false, error: 'تعارض في البيانات: المفتاح موجود بالفعل' }
      } else if (error.code === '23503') {
        return { success: false, error: 'خطأ في المفتاح الخارجي' }
      } else {
        // Return the actual database error message for debugging
        return { success: false, error: `خطأ في قاعدة البيانات: ${error.message} (Code: ${error.code})` }
      }
    }

    console.log('Successfully upserted exchange rate:', data)

    // تحديث الصفحات التي تعتمد على سعر الصرف لتعكس القيمة الجديدة فوراً
    revalidatePath('/dashboard/products')
    revalidatePath('/dashboard/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating exchange rate:', error)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return { success: false, error: 'حدث خطأ غير متوقع أثناء تحديث سعر الصرف' }
  }
}