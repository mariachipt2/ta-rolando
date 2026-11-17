import { adminRoute } from '@/lib/admin-route';
import { loadOrganizerProfiles, saveOrganizerProfile } from '@/lib/organizer-profiles';

export async function GET(req: Request) {
  return adminRoute(req, loadOrganizerProfiles);
}
export async function POST(req: Request) {
  return adminRoute(req, async db => saveOrganizerProfile(db, await req.json()));
}
