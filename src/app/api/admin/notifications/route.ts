import {adminRoute} from '@/lib/admin-route';
import {publicationInbox,readPublicationNotice} from '@/lib/publication-notifications';
export async function GET(req:Request){return adminRoute(req,publicationInbox)}
export async function POST(req:Request){return adminRoute(req,async db=>readPublicationNotice(db,await req.json()))}
