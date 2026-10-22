import {adminRoute} from '@/lib/admin-route';
import {loadDiscoveryMarks,saveDiscoveryMark} from '@/lib/discovery-mark-actions';
export async function GET(req:Request){return adminRoute(req,loadDiscoveryMarks)}
export async function POST(req:Request){return adminRoute(req,async db=>saveDiscoveryMark(db,await req.json()))}
