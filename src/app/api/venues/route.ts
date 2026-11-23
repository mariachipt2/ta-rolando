import {createClient} from '@supabase/supabase-js';
import {configured} from '@/lib/supabase';
import {publicVenue,publicVenueDirectory} from '@/lib/venue-actions';
export async function GET(req:Request){if(!configured())return Response.json({venue:null});try{const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});const id=new URL(req.url).searchParams.get('local');return Response.json(id?await publicVenue(db,id):await publicVenueDirectory(db),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Não foi possível carregar o local.'},{status:503})}}
