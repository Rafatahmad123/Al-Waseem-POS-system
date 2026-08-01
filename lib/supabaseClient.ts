import { createClient } from '@supabase/supabase-js';

// Helper function to validate URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

if (!isValidUrl(supabaseUrl)) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

// 1. العميل العام (Standard Client): يستخدم للعمليات العادية عبر المتصفح
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 2. العميل الإداري (Admin Client): يستخدم فقط داخل Server Actions للعمليات التي تتطلب صلاحيات كاملة
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } })
  : null;