import {createClient} from '@supabase/supabase-js';
import {configured} from '@/lib/supabase';
import {publicVenue} from '@/lib/venue-actions';
export async function GET(req:Request){if(!configured())return Response.json({venue:null});try{const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});return Response.json(await publicVenue(db,new URL(req.url).searchParams.get('local')||''),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Não foi possível carregar o local.'},{status:503})}}
