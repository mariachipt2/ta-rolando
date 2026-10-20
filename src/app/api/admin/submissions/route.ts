import {adminRoute} from '@/lib/admin-route';
import {reviewSuggestion} from '@/lib/admin-actions';
export async function POST(req:Request){return adminRoute(req,async db=>reviewSuggestion(db,await req.json()))}

