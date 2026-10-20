import {adminRoute} from '@/lib/admin-route';
import {reviewReport} from '@/lib/admin-actions';
export async function POST(req:Request){return adminRoute(req,async db=>reviewReport(db,await req.json()))}

