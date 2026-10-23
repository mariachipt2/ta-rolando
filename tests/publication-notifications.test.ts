import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
test('Publicações: avisos duráveis, privados, idempotentes, com confirmação de visibilidade e leitura por administradora',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`);
 for(const f of ['001_initial.sql','003_admin_totals.sql','004_event_instagram.sql','005_submissions_save_confirmation.sql','006_private_save_permissions.sql','007_event_management.sql','012_publication_notifications.sql'])await db.exec(readFileSync('supabase/migrations/'+f,'utf8'));
 const one='00000000-0000-4000-8000-000000000001',two='00000000-0000-4000-8000-000000000002';
 await db.exec(`insert into auth.users values('${one}'),('${two}');insert into admin_profiles(user_id) values('${one}'),('${two}');`);
 const cat=(await db.query<{id:string}>("insert into categories(name) values('Categoria teste') returning id")).rows[0].id;
 const create=async(slug:string,status:string,at:string,deleted=false)=>(await db.query<{id:string}>(`insert into events(slug,title,description,category_id,starts_at,venue_name,address,status,publish_at,deleted_at) values($1,$1,'Descrição',$2,now()+interval '7 days','Local','Rua A',$3,$4,case when $5 then now() else null end) returning id`,[slug,cat,status,at,deleted])).rows[0].id;
 const past=new Date(Date.now()-3600000).toISOString(),future=new Date(Date.now()+3600000).toISOString();
 const due=await create('Evento agendado','scheduled',past);await create('Evento futuro','scheduled',future);await create('Evento rascunho','draft',past);await create('Evento cancelado','cancelled',past);await create('Evento excluido','scheduled',past,true);await create('Evento manual','published',past);
 const inbox=async()=> (await db.query<{v:{items:any[];unread_count:number;checked_at:string}}>('select admin_publication_notifications() v')).rows[0].v;
 await db.exec('set role anon');await assert.rejects(()=>inbox());await assert.rejects(()=>db.query('select * from publication_notifications'));await assert.rejects(()=>db.query('select collect_publication_notifications()'));
 await db.exec('reset role;set role authenticated');await assert.rejects(()=>inbox());await db.query("select set_config('request.jwt.claim.sub',$1,false)",[one]);
 let d=await inbox();assert.equal(d.unread_count,1);assert.equal(d.items[0].event_id,due);assert.equal(d.items[0].public_now,true);assert.ok(d.items[0].confirmed_at);assert.equal((await inbox()).items.length,1);
 const notice=d.items[0].id;await db.query('select read_publication_notification($1)',[notice]);await db.query('select read_publication_notification($1)',[notice]);assert.equal((await inbox()).unread_count,0);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[two]);assert.equal((await inbox()).unread_count,1);await assert.rejects(()=>db.query('delete from publication_notifications'));
 await db.exec('reset role');await db.query("update events set status='cancelled' where id=$1",[due]);d=await inbox();assert.equal(d.items[0].cancelled_now,true);assert.equal(d.items[0].title,'Evento agendado');
 await db.query('update events set deleted_at=now() where id=$1',[due]);assert.equal((await inbox()).items[0].public_now,false);
 // A due publication is retained before the event or category can hide it between worker runs.
 const hidden=await create('Evento entre verificacoes','scheduled',past);await db.query('update categories set active=false where id=$1',[cat]);d=await inbox();assert.ok(d.items.some(n=>n.event_id===hidden&&!n.public_now));
 const inactive=await create('Categoria inativa','scheduled',past);assert.ok(!(await inbox()).items.some(n=>n.event_id===inactive));await db.query('update categories set active=true where id=$1',[cat]);assert.ok((await inbox()).items.some(n=>n.event_id===inactive));
 // A new schedule creates a new notice; a future replacement never claims to have published.
 await db.query("update events set status='scheduled',deleted_at=null,publish_at=$2 where id=$1",[due,future]);assert.equal((await inbox()).items.filter(n=>n.event_id===due).length,1);
 await db.query("update events set publish_at=$2 where id=$1",[due,new Date(Date.now()-1000).toISOString()]);assert.equal((await inbox()).items.filter(n=>n.event_id===due).length,2);
 d=await inbox();await db.query('select read_publication_notification(null,$1)',[d.checked_at]);assert.equal((await inbox()).unread_count,0);
 await db.query("update events set title='Título posterior' where id=$1",[due]);assert.ok((await inbox()).items.filter(n=>n.event_id===due).every(n=>n.title==='Evento agendado'));
 }finally{await db.close()}
});
