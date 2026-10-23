import {createClient} from '@supabase/supabase-js';
import {publicClock} from '@/lib/public-clock';
export async function GET(){try{const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});return Response.json({now:await publicClock(db)},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Não foi possível conferir o horário.'},{status:503})}}
