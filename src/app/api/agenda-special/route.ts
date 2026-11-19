import { createClient } from '@supabase/supabase-js';
import { loadAgendaSpecial } from '@/lib/agenda-special-actions';
export async function GET() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
    return Response.json(await loadAgendaSpecial(db), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Especial indisponível.' }, { status: 503 }); }
}
