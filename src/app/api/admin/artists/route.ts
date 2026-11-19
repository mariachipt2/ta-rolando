import { adminRoute } from '@/lib/admin-route';
import { loadArtists, saveArtist } from '@/lib/artist-actions';
export async function GET(req: Request) { return adminRoute(req, db => loadArtists(db, true)); }
export async function POST(req: Request) { return adminRoute(req, async db => saveArtist(db, await req.json())); }
