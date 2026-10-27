import {createClient} from '@supabase/supabase-js';
import {loadSpecialTheme} from '@/lib/special-theme-actions';
export async function GET(){
  try{
    const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});
    return Response.json(await loadSpecialTheme(db),{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Tema indisponível.'},{status:503})}
}
