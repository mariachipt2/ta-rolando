import {createClient} from 'npm:@supabase/supabase-js@2';
import {validateSubmission} from '../_shared/submissions.ts';
import {photoType} from '../_shared/photos.ts';
import {validateReport} from '../_shared/reports.ts';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(v=>v.trim()).filter(Boolean);
const secret=Deno.env.get('VISITOR_SECRET')||'';
async function hash(value:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');}
async function limit(key:string,max:number,seconds:number){const {data,error}=await db.rpc('consume_limit',{p_key:key,p_max:max,p_seconds:seconds});if(error)throw error;return data===true;}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
 const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:cors});
 if(!allowed.includes(origin))return new Response('Origem não autorizada',{status:403});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply({error:'Método inválido.'},405);
 try{
  if(secret.length<32)return reply({error:'Configure VISITOR_SECRET na função.'},503);
  const multipart=req.headers.get('content-type')?.includes('multipart/form-data');
  if(Number(req.headers.get('content-length')||0)>(multipart?6291456:65536))return reply({error:'Requisição muito grande.'},413);
  let body;let photo:File|null=null;
  if(multipart){const form=await req.formData();const raw=String(form.get('payload')||'');if(raw.length>30000)return reply({error:'Dados muito grandes.'},413);body=JSON.parse(raw);const file=form.get('photo');if(file instanceof File&&file.size>0)photo=file;}
  else{const raw=await req.text();if(raw.length>30000)return reply({error:'Requisição muito grande.'},413);body=JSON.parse(raw);}
  if(typeof body.visitor!=='string'||!/^[a-f0-9]{64}$/.test(body.visitor))return reply({error:'Identificador inválido.'},400);
  const visitor=await hash('pages:'+body.visitor);
  if(!await limit('pages:requests:'+visitor,60,60))return reply({error:'Muitas tentativas. Aguarde um minuto.'},429);
  if(body.action==='agenda'){
   const ids:string[]=[];for(let from=0;;from+=500){const {data,error}=await db.from('event_attendance').select('event_id').eq('visitor_hash',visitor).order('event_id').range(from,from+499);if(error)throw error;ids.push(...data.map(x=>x.event_id));if(data.length<500)break}return reply({ids});
  }
  if(body.action==='submission'){
   if(typeof body.request_id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(body.request_id))return reply({error:'Envio inválido.'},400);
   let event;try{event=validateSubmission(body.event)}catch(e){return reply({error:e instanceof Error?e.message:'Revise os dados do evento.'},400)}
   const botSecret=Deno.env.get('TURNSTILE_SECRET_KEY');if(!botSecret)return reply({error:'Envio temporariamente indisponível.'},503);
   if(typeof body.token!=='string'||body.token.length>4096)return reply({error:'Complete a verificação de segurança.'},403);
   const verify=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:botSecret,response:body.token}),signal:AbortSignal.timeout(10000)});const verified=await verify.json();if(!verified.success||verified.hostname!==new URL(origin).hostname)return reply({error:'Complete a verificação de segurança.'},403);
   if(!await limit('pages:submissions:'+visitor,5,3600))return reply({error:'Limite de envios atingido. Tente mais tarde.'},429);
   const {data:category}=await db.from('categories').select('id').eq('id',event.category_id).eq('active',true).maybeSingle();if(!category)return reply({error:'Escolha uma categoria ativa.'},400);
   const existing=await db.from('event_submissions').select('id,visitor_hash,submitted_at').eq('id',body.request_id).maybeSingle();if(existing.error)throw existing.error;if(existing.data){if(existing.data.visitor_hash!==visitor)return reply({error:'Envio inválido.'},400);return reply({id:existing.data.id,saved_at:existing.data.submitted_at});}
   let photo_path:null|string=null;
   if(photo){let bytes;let type;try{bytes=new Uint8Array(await photo.arrayBuffer());type=photoType(bytes)}catch(e){return reply({error:e instanceof Error?e.message:'Foto inválida.'},400)}photo_path=body.request_id+'/cover.'+type.ext;const upload=await db.storage.from('submission-images').upload(photo_path,bytes,{contentType:type.mime,upsert:true});if(upload.error)throw upload.error;}
   const {error}=await db.from('event_submissions').upsert({id:body.request_id,visitor_hash:visitor,event_data:event,photo_path},{onConflict:'id',ignoreDuplicates:true});if(error)throw error;
   const {data,error:readError}=await db.from('event_submissions').select('id,submitted_at').eq('id',body.request_id).eq('visitor_hash',visitor).single();if(readError)throw readError;
   return reply({id:data.id,saved_at:data.submitted_at});
  }
  if(typeof body.event_id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(body.event_id))return reply({error:'Evento inválido.'},400);
  if(body.action==='report'){
   if(typeof body.request_id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(body.request_id))return reply({error:'Envio inválido.'},400);
   let report;try{report=validateReport(body)}catch(e){return reply({error:e instanceof Error?e.message:'Revise o aviso.'},400)}
   const botSecret=Deno.env.get('TURNSTILE_SECRET_KEY');if(!botSecret)return reply({error:'Envio temporariamente indisponível.'},503);
   if(typeof body.token!=='string'||body.token.length>4096)return reply({error:'Complete a verificação de segurança.'},403);
   const verify=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:botSecret,response:body.token}),signal:AbortSignal.timeout(10000)});const verified=await verify.json();if(!verified.success||verified.hostname!==new URL(origin).hostname)return reply({error:'Complete a verificação de segurança.'},403);
   if(!await limit('pages:reports:'+visitor,3,3600))return reply({error:'Limite de avisos atingido. Tente mais tarde.'},429);
   const {data:event}=await db.from('public_events').select('id').eq('id',body.event_id).maybeSingle();if(!event)return reply({error:'Evento indisponível.'},400);
   const {error}=await db.from('event_reports').upsert({id:body.request_id,event_id:body.event_id,visitor_hash:visitor,...report},{onConflict:'id',ignoreDuplicates:true});if(error)throw error;
   const {data,error:readError}=await db.from('event_reports').select('id,created_at').eq('id',body.request_id).eq('visitor_hash',visitor).single();if(readError)throw readError;return reply({id:data.id,saved_at:data.created_at});
  }
  if(body.action==='attendance'){
   if(typeof body.attending!=='boolean')return reply({error:'Marcação inválida.'},400);
   if(body.attending){
    const botSecret=Deno.env.get('TURNSTILE_SECRET_KEY');if(!botSecret)return reply({error:'A verificação de segurança ainda não foi configurada.'},503);
    if(typeof body.token!=='string'||body.token.length>4096)return reply({error:'Complete a verificação de segurança.'},403);
    const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:botSecret,response:body.token}),signal:AbortSignal.timeout(10000)});const result=await r.json();if(!result.success||result.hostname!==new URL(origin).hostname)return reply({error:'Complete a verificação de segurança.'},403);
   }
   if(!await limit('pages:attendance:'+visitor,20,60))return reply({error:'Aguarde um minuto para tentar novamente.'},429);
   const {data,error}=await db.rpc('set_attendance',{p_event:body.event_id,p_visitor:visitor,p_attending:body.attending});if(error)return reply({error:'Evento indisponível ou encerrado.'},400);return reply({count:Number(data),attending:body.attending});
  }
  if(body.action==='metric'&&['view','ticket'].includes(body.kind)){
   if(await limit(`pages:metric:${visitor}:${body.event_id}:${body.kind}`,1,3600)){const {error}=await db.rpc('record_metric',{p_event:body.event_id,p_kind:body.kind});if(error)throw error;}return reply({ok:true});
  }
  return reply({error:'Operação inválida.'},400);
 }catch{return reply({error:'Não foi possível concluir. Tente novamente.'},503)}
});
