import http from 'node:http';
import {readFile,writeFile,rename,mkdir,open,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClient} from '@supabase/supabase-js';
import {ownNumber,messageFor,pendingNotices,sendOnce} from './core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
try{process.loadEnvFile(path.join(root,'.env.local'))}catch{}
const runtime=path.join(process.env.LOCALAPPDATA,'TaRolando','WhatsApp');await mkdir(runtime,{recursive:true});
const lockPath=path.join(runtime,'connector.lock');
try{const old=JSON.parse(await readFile(lockPath,'utf8'));let alive=false;try{process.kill(old.pid,0);alive=true}catch{}if(alive){console.log('Já existe um conector em execução: http://127.0.0.1:8190');process.exit(0)}await unlink(lockPath)}catch(e){if(e.code!=='ENOENT')throw e}
const lock=await open(lockPath,'wx');await lock.writeFile(JSON.stringify({pid:process.pid}));await lock.close();
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await unlink(lockPath).catch(()=>{});process.exit(0)});
const values=Object.fromEntries((await readFile(path.join(runtime,'.env'),'utf8')).split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}));
const key=values.AUTHENTICATION_API_KEY,instanceName='ta-rolando',port=8190;
const db=process.env.SUPABASE_SECRET_KEY?createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}}):null;
const settingsFile=path.join(runtime,'notification-settings.json'),stateFile=path.join(runtime,'notification-state.json');
async function readJson(file,fallback){try{return JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code==='ENOENT')return fallback;throw e}}
async function atomic(file,value){await writeFile(file+'.tmp',JSON.stringify(value,null,2),{mode:0o600});await rename(file+'.tmp',file)}
let settings=await readJson(settingsFile,{enabled:false}),state=await readJson(stateFile,{}),working=false,lastCheck=null,lastError='';
for(const entry of Object.values(state))if(entry.status==='sending')entry.status='uncertain';
await atomic(stateFile,state);
async function evo(endpoint,body){const r=await fetch('http://127.0.0.1:8188/'+endpoint,{method:body?'POST':'GET',headers:{apikey:key,Origin:'http://127.0.0.1:8190',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000),redirect:'error'});if(!r.ok)throw Error('Evolution respondeu '+r.status);return r.json()}
async function instance(){const data=await evo('instance/fetchInstances');return (Array.isArray(data)?data:[]).find(v=>(v.name||v.instance?.instanceName)===instanceName)||null}
async function connection(){return (await evo('instance/connectionState/'+instanceName))?.instance?.state}
async function tick(){if(working||!settings.enabled)return;working=true;try{
 if(!db)throw Error('Configuração local do Supabase ausente.');
 if(await connection()!=='open')throw Error('WhatsApp desconectado. Leia o QR Code novamente.');
 const current=await instance();if(ownNumber(current)!==settings.recipient)throw Error('A conta conectada mudou. Confira e ative novamente.');
 const {error:syncError}=await db.rpc('collect_publication_notifications');if(syncError)throw Error('Não foi possível conferir publicações no Supabase.');
 let page=0,rows=[];while(true){const {data,error}=await db.from('publication_notifications').select('id,title,event_id,scheduled_at,confirmed_at').gte('confirmed_at',settings.enabledAt).order('confirmed_at').order('id').range(page,page+499);if(error)throw Error('Falha ao consultar os avisos.');rows.push(...data);if(data.length<500)break;page+=500}
 for(const n of pendingNotices(rows,settings,state).slice(0,10)){
 if(!settings.enabled)break;
 const {data,error}=await db.from('public_events').select('slug,status').eq('id',n.event_id).maybeSingle();if(error)throw Error('Falha ao conferir o evento público.');
 if(!data||data.status==='cancelled'){state[n.id]={status:'skipped',at:new Date().toISOString()};await atomic(stateFile,state);continue}
 await sendOnce(n,{state,persist:()=>atomic(stateFile,state),send:()=>evo('message/sendText/'+instanceName,{number:settings.recipient,text:messageFor(n,data)})});
 }
 lastError='';lastCheck=new Date().toISOString();
 }catch(e){lastError=e.message||'Falha ao conferir os avisos.'}finally{working=false}}
const html=await readFile(path.join(root,'scripts/whatsapp-local/panel.html'));
http.createServer(async(req,res)=>{
 const json=(v,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(v))};
 if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host))return json({error:'Host inválido'},403);
 if(req.method==='POST'&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin))return json({error:'Origem inválida'},403);
 try{
 if(req.method==='GET'&&req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"});return res.end(html)}
 if(req.method==='GET'&&req.url==='/status'){let status='unavailable',number=null;try{const current=await instance();number=ownNumber(current);status=current?await connection():'not-created'}catch{}return json({status,number,enabled:settings.enabled,lastCheck,lastError,counts:Object.values(state).reduce((a,n)=>(a[n.status]=(a[n.status]||0)+1,a),{})})}
 if(req.method==='POST'&&req.url==='/pair'){if(!await instance())await evo('instance/create',{instanceName,integration:'WHATSAPP-BAILEYS',qrcode:false,syncFullHistory:false,readMessages:false,readStatus:false,alwaysOnline:false});const qr=await evo('instance/connect/'+instanceName);return json({base64:qr.base64||qr.qrcode?.base64||null})}
 if(req.method==='POST'&&req.url==='/enable'){const current=await instance(),number=ownNumber(current);if(!number||await connection()!=='open')throw Error('Conecte seu WhatsApp primeiro.');settings={...settings,enabled:true,recipient:number,enabledAt:settings.recipient===number&&settings.enabledAt?settings.enabledAt:new Date().toISOString()};await atomic(settingsFile,settings);void tick();return json({ok:true})}
 if(req.method==='POST'&&req.url==='/shutdown'){json({ok:true});setTimeout(async()=>{await unlink(lockPath).catch(()=>{});process.exit(0)},250);return}
 if(req.method==='POST'&&req.url==='/disable'){settings.enabled=false;await atomic(settingsFile,settings);return json({ok:true})}
 if(req.method==='POST'&&req.url==='/test'){const current=await instance(),number=ownNumber(current);if(!number||await connection()!=='open')throw Error('Conecte seu WhatsApp primeiro.');const r=await evo('message/sendText/'+instanceName,{number,text:'✅ Tá Rolando — teste de conexão. Os avisos de publicações agendadas serão enviados por este computador enquanto o conector estiver aberto.'});if(!r?.key?.id)throw Error('Envio sem confirmação.');return json({ok:true,message:'A Evolution aceitou o teste. Confira a conversa Você no celular; isso ainda não confirma entrega ou notificação sonora.'})}
 return json({error:'Página não encontrada'},404);
 }catch(e){return json({error:e.message||'Não foi possível concluir.'},400)}
}).listen(port,'127.0.0.1',()=>console.log('Conector local: http://127.0.0.1:'+port+' — mantenha esta janela aberta.'));
setInterval(()=>void tick(),60000);void tick();
