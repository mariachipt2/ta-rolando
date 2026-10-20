import {adminRoute} from '@/lib/admin-route';
import {saveEvent,trashEvent} from '@/lib/admin-actions';
export async function POST(req:Request){return adminRoute(req,async db=>saveEvent(db,await req.json()))}
export async function DELETE(req:Request){return adminRoute(req,async db=>trashEvent(db,(await req.json()).id,true))}
