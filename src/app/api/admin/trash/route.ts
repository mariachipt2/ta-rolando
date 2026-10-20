import {adminRoute} from '@/lib/admin-route';
import {trashEvent} from '@/lib/admin-actions';
export async function POST(req:Request){return adminRoute(req,async db=>trashEvent(db,(await req.json()).id,false))}

