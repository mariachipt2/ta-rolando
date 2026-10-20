import {admin} from './supabase';
import {sameOrigin} from './visitor';
import type {SupabaseClient} from '@supabase/supabase-js';
export async function adminRoute(req:Request,action:(db:SupabaseClient)=>Promise<unknown>){try{if(req.method!=='GET'&&!sameOrigin(req))return Response.json({error:'Origem inválida.'},{status:403});const db=await admin();if(!db)return Response.json({error:'Acesso negado.'},{status:401});return Response.json(await action(db),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Não foi possível confirmar a operação. Recarregue os dados antes de tentar novamente.'},{status:400})}}
