import {adminRoute} from '@/lib/admin-route';
import {loadVenues,saveVenue} from '@/lib/venue-actions';
export async function GET(req:Request){return adminRoute(req,loadVenues)}
export async function POST(req:Request){return adminRoute(req,async db=>saveVenue(db,await req.json()))}
