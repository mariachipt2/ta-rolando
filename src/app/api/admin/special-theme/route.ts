import {adminRoute} from '@/lib/admin-route';
import {loadSpecialTheme,saveSpecialTheme} from '@/lib/special-theme-actions';
export async function GET(req:Request){return adminRoute(req,db=>loadSpecialTheme(db,true))}
export async function POST(req:Request){return adminRoute(req,async db=>saveSpecialTheme(db,await req.json()))}
