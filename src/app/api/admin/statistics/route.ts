import { admin } from '@/lib/supabase';
import { loadStatistics } from '@/lib/admin-statistics';

export async function GET() {
  const db = await admin();
  if (!db) return Response.json({ error: 'Acesso negado.' }, { status: 401 });
  try {
    return Response.json(await loadStatistics(db), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Não foi possível consultar as estatísticas. Tente novamente.' }, { status: 503 });
  }
}
