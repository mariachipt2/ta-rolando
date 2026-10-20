import {adminRoute} from '@/lib/admin-route';
import {restoreVersion,getVersions} from '@/lib/admin-actions';
export async function POST(req:Request){return adminRoute(req,async db=>restoreVersion(db,(await req.json()).version_id))}
export async function GET(req:Request){return adminRoute(req,async db=>({versions:await getVersions(db,new URL(req.url).searchParams.get('event_id')||'')}))}
