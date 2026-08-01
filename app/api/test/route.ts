import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("test").select("*").limit(1);

  if (error) {
    return Response.json({ ok: false, error: error.message });
  }

  return Response.json({ ok: true, data });
}
