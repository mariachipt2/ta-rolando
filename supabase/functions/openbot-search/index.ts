import {createClient} from 'npm:@supabase/supabase-js@2';
import {timingSafeEqual} from 'node:crypto';
import {discoverySource} from '../_shared/discovery.ts';
import {searchResult,publicSearchJob} from '../_shared/openbot-search.ts';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(x=>x.trim()).filter(Boolean);
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'',cors={'Access-Control-Allow-Origin':allowed.includes(origin)?origin:'null','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store','Vary':'Origin'},reply=(v:unknown,status=200)=>Response.json(v,{status,headers:cors});
 if(req.method==='OPTIONS')return new Response(null,{status:allowed.includes(origin)?204:403,headers:cors});
 if(req.method!=='POST')return reply({error:'Use POST.'},405);
 try{
  const secret=Deno.env.get('OPENBOT_DRAFT_TOKEN')||'',token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]||'';
  const enc=new TextEncoder(),worker=secret.length===64&&token.length===secret.length&&timingSafeEqual(enc.encode(secret),enc.encode(token));
  let userId='';
  if(!worker){
   if(!allowed.includes(origin))return reply({error:'Origem não autorizada.'},403);
   const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return reply({error:'Entre como administradora.'},401);
   const profile=await db.from('admin_profiles').select('user_id').eq('user_id',user.id).eq('active',true).maybeSingle();if(profile.error||!profile.data)return reply({error:'Acesso negado.'},403);userId=user.id;
  }
  const raw=await req.text();if(raw.length>1_000_000)return reply({error:'Resultado muito grande.'},413);const body=JSON.parse(raw);
  if(worker){
   if(body.action==='claim'){const {data,error}=await db.rpc('claim_openbot_search');if(error)throw error;return reply({job:data?.[0]||null})}
   if(!['heartbeat','complete','fail'].includes(body.action)||typeof body.id!=='string'||typeof body.lease_token!=='string')return reply({error:'Operação inválida.'},400);
   const current=await db.from('openbot_search_jobs').select('*').eq('id',body.id).eq('lease_token',body.lease_token).eq('status','running').maybeSingle();if(current.error)throw current.error;if(!current.data)return reply({error:'A busca foi encerrada ou cancelada.'},409);
   const update=body.action==='heartbeat'?{heartbeat_at:new Date().toISOString()}:body.action==='complete'?{status:'completed',result:searchResult(body.result,current.data.source),finished_at:new Date().toISOString(),lease_token:null}:{status:'failed',error:'O OpenBot não concluiu a coleta. Confira o aplicativo e tente novamente.',finished_at:new Date().toISOString(),lease_token:null};
   const {data,error}=await db.from('openbot_search_jobs').update(update).eq('id',body.id).eq('lease_token',body.lease_token).eq('status','running').select('id').maybeSingle();if(error)throw error;if(!data)return reply({error:'Busca encerrada.'},409);return reply({ok:true});
  }
  const source=discoverySource(body.source);
  if(body.action==='cancel'){const {error}=await db.from('openbot_search_jobs').update({status:'cancelled',finished_at:new Date().toISOString(),lease_token:null}).eq('source',source).in('status',['queued','running']);if(error)throw error;return reply({ok:true})}
  if(!['request','status'].includes(body.action))return reply({error:'Operação inválida.'},400);
  if(body.action==='request'){
   const current=await db.from('openbot_search_jobs').select('*').eq('source',source).in('status',['queued','running']).maybeSingle();if(current.error)throw current.error;if(current.data)return reply({job:publicSearchJob(current.data)});
   const quota=await db.rpc('consume_limit',{p_key:'openbot-search:'+userId,p_max:6,p_seconds:3600});if(quota.error)throw quota.error;if(!quota.data)return reply({error:'Limite de 6 buscas por hora atingido.'},429);
   const created=await db.from('openbot_search_jobs').insert({source,requested_by:userId}).select('*').single();
   if(created.error&&created.error.code!=='23505')throw created.error;if(created.data)return reply({job:publicSearchJob(created.data)});
  }
  const latest=await db.from('openbot_search_jobs').select('*').eq('source',source).order('requested_at',{ascending:false}).limit(1).maybeSingle();if(latest.error)throw latest.error;return reply({job:publicSearchJob(latest.data)});
 }catch{return reply({error:'Não foi possível concluir a busca do OpenBot. Confira a configuração da integração.'},503)}
});
