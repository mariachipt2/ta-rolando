import { createClient } from '@supabase/supabase-js';
import { loadArtists } from '@/lib/artist-actions';
export async function GET() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
    return Response.json(await loadArtists(db), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Não foi possível carregar os artistas.' }, { status: 503 }); }
}
