import {adminRoute} from '@/lib/admin-route';
import {loadRegistryExport} from '@/lib/admin-export';
export async function GET(req:Request){return adminRoute(req,loadRegistryExport)}
