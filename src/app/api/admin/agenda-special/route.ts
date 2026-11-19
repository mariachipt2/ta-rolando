import { adminRoute } from '@/lib/admin-route';
import { loadAgendaSpecial, saveAgendaSpecial } from '@/lib/agenda-special-actions';
export async function GET(req: Request) { return adminRoute(req, loadAgendaSpecial); }
export async function POST(req: Request) { return adminRoute(req, async db => saveAgendaSpecial(db, await req.json())); }
