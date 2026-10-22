import {createClient} from 'npm:@supabase/supabase-js@2';
import {findPlaces} from '../_shared/places.ts';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(v=>v.trim()).filter(Boolean);
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Access-Control-Allow-Origin':allowed.includes(origin)?origin:'null','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
 if(!allowed.includes(origin))return reply({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Método inválido.'},405);
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return reply({error:'Entre como administradora para buscar eventos.'},401);
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user)return reply({error:'Sessão expirada. Entre novamente.'},401);
 const profile=await db.from('admin_profiles').select('user_id').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(profile.error||!profile.data)return reply({error:'Acesso negado.'},403);
 try {
 const limited=await db.rpc('consume_limit',{p_key:'places:'+user.id,p_max:3,p_seconds:3600});
 if(limited.error)throw limited.error;if(limited.data!==true)return reply({error:'Limite de 3 buscas por hora atingido. Tente mais tarde.'},429);
 return reply(await findPlaces());
 }catch(e){return reply({error:e instanceof Error?e.message:'Não foi possível consultar a agenda.'},503)}
});
