import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {photoType} from '../supabase/functions/_shared/photos';
import {validateReport} from '../supabase/functions/_shared/reports';

test('Fotos e avisos: formatos permitidos, limites e texto obrigatório',()=>{
 assert.equal(photoType(new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])).mime,'image/png');
 assert.equal(photoType(new Uint8Array([255,216,255,0,0,0,0,0,0,0,0,0])).mime,'image/jpeg');
 assert.throws(()=>photoType(new TextEncoder().encode('<svg><script>alert(1)</script></svg>')));
 assert.throws(()=>photoType(new Uint8Array(5*1024*1024+1)));
 assert.throws(()=>validateReport({kind:'date',details:'curto'}));
 assert.throws(()=>validateReport({kind:'bad',details:'Uma descrição completa'}));
 assert.deepEqual(validateReport({kind:'date',details:'  Data incorreta no site.  ',status:'resolved'}),{kind:'date',details:'Data incorreta no site.'});
});

test('Gestão: recorrência idempotente, lixeira recuperável, versões e avisos privados',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`);
 for(const name of ['001_initial.sql','003_admin_totals.sql','004_event_instagram.sql','005_submissions_save_confirmation.sql','006_private_save_permissions.sql','007_event_management.sql'])await db.exec(readFileSync('supabase/migrations/'+name,'utf8'));
 await db.exec(`create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;`);
 for(const name of ['002_storage.sql','008_submission_photos.sql'])await db.exec(readFileSync('supabase/migrations/'+name,'utf8'));
 await db.exec(`insert into storage.objects(bucket_id,name) values('submission-images','private.png')`);
 assert.equal((await db.query<{public:boolean}>(`select public from storage.buckets where id='submission-images'`)).rows[0].public,false);
 await db.exec('set role anon');
 for(const table of ['event_versions','event_reports','event_series'])await assert.rejects(()=>db.query('select * from '+table));
 assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await assert.rejects(()=>db.query(`insert into storage.objects(bucket_id,name) values('submission-images','hack.png')`));
 await assert.rejects(()=>db.query(`select set_event_trash(gen_random_uuid(),true)`));
 await db.exec('reset role;set role authenticated');
 for(const table of ['event_versions','event_reports','event_series'])assert.equal((await db.query('select * from '+table)).rows.length,0);
 await assert.rejects(()=>db.query(`select create_event_series(gen_random_uuid(),'{}','none',1)`));
 await db.exec('reset role');
 const category=(await db.query<{id:string}>('select id from categories limit 1')).rows[0].id;
 const user='00000000-0000-4000-8000-000000000001',key='00000000-0000-4000-8000-000000000002';
 await db.exec(`insert into auth.users values('${user}');insert into admin_profiles values('${user}',true);select set_config('request.jwt.claim.sub','${user}',false);set role authenticated;`);
 assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 await assert.rejects(()=>db.query(`insert into storage.objects(bucket_id,name) values('submission-images','direct.png')`));
 const event={title:'Evento mensal',description:'Descrição completa do evento',category_id:category,starts_at:'2030-01-31T20:00:00-03:00',ends_at:'2030-02-01T01:00:00-03:00',venue_name:'Local',address:'Rua 1',status:'published',family_friendly:true};
 const create=async(k:string,e:unknown,f:string,n:number)=>(await db.query<{result:{ids:string[];saved_at:string}}>('select create_event_series($1,$2,$3,$4) result',[k,JSON.stringify(e),f,n])).rows[0].result;
 const series=await create(key,event,'monthly',3);assert.equal(series.ids.length,3);assert.ok(Date.parse(series.saved_at));
 assert.deepEqual((await create(key,event,'monthly',3)).ids,series.ids);
 await assert.rejects(()=>create(key,{...event,title:'Outro'},'monthly',3));
 await assert.rejects(()=>create(crypto.randomUUID(),event,'monthly',25));
 const dates=(await db.query<{day:string;duration:number}>(`select to_char(starts_at at time zone 'America/Sao_Paulo','YYYY-MM-DD HH24:MI') as day,extract(epoch from ends_at-starts_at)::int duration from events order by starts_at`)).rows;
 assert.deepEqual(dates.map(x=>x.day),['2030-01-31 20:00','2030-02-28 20:00','2030-03-31 20:00']);assert.ok(dates.every(x=>x.duration===18000));
 const id=series.ids[0];
 const original=(await db.query<{id:string}>('select id from event_versions where event_id=$1',[id])).rows[0].id;
 await db.query(`update events set title='Evento com novo nome',starts_at=starts_at+interval '1 day',ends_at=ends_at+interval '1 day' where id=$1`,[id]);
 let current=(await db.query<{change_notice:string;change_at:Date}>(`select change_notice,change_at from events where id=$1`,[id])).rows[0];assert.match(current.change_notice,/alteradas/);assert.ok(current.change_at);
 assert.equal((await db.query<{title:string}>('select title from events where id=$1',[series.ids[1]])).rows[0].title,'Evento mensal');
 await db.query(`update events set status='cancelled' where id=$1`,[id]);assert.match((await db.query<{change_notice:string}>('select change_notice from events where id=$1',[id])).rows[0].change_notice,/cancelado/);
 await db.exec('reset role;set role service_role');await db.query('insert into event_attendance(event_id,visitor_hash) values($1,$2)',[id,'visitor']);await db.exec('reset role;set role authenticated');
 await db.query('select set_event_trash($1,true)',[id]);assert.equal((await db.query('select * from public_events where id=$1',[id])).rows.length,0);
 await assert.rejects(()=>db.query('delete from events where id=$1',[id]));
 await db.query('select restore_event_version($1)',[original]);assert.equal((await db.query('select * from public_events where id=$1',[id])).rows.length,0);
 await db.query('select set_event_trash($1,false)',[id]);const restored=(await db.query<{title:string;interest_count:number;family_friendly:boolean}>('select * from public_events where id=$1',[id])).rows[0];assert.equal(restored.title,'Evento mensal');assert.equal(Number(restored.interest_count),1);assert.equal(restored.family_friendly,true);
 const actions=(await db.query<{action:string}>('select action from event_versions where event_id=$1',[id])).rows.map(x=>x.action);for(const action of ['created','updated','trashed','restored','version_restored'])assert.ok(actions.includes(action));
 const weekly=await create(crypto.randomUUID(),{...event,starts_at:'2030-05-10T22:00:00-03:00',ends_at:null},'weekly',2);assert.equal((await db.query<{days:number}>('select (extract(epoch from max(starts_at)-min(starts_at))/86400)::int as days from events where id=any($1::uuid[])',[weekly.ids])).rows[0].days,7);
 // Short months preserve duration even when the original end day also exists in that month.
 const short=await create(crypto.randomUUID(),{...event,starts_at:'2030-01-30T20:00:00-03:00',ends_at:'2030-01-31T01:00:00-03:00'},'monthly',2);assert.equal(Number((await db.query<{duration:number}>('select extract(epoch from ends_at-starts_at)::int duration from events where id=$1',[short.ids[1]])).rows[0].duration),18000);
 const reportId=crypto.randomUUID();await db.exec('reset role;set role service_role');await db.query('insert into event_reports(id,event_id,visitor_hash,kind,details) values($1,$2,$3,$4,$5)',[reportId,id,'visitor','date','A data precisa ser corrigida.']);await db.exec('reset role;set role authenticated');
 await assert.rejects(()=>db.query(`update event_reports set details='Texto alterado pelo cliente'`));
 const report=(await db.query<{result:{saved_at:string}}>(`select review_event_report($1,'resolved') result`,[reportId])).rows[0].result;assert.ok(Date.parse(report.saved_at));assert.equal((await db.query<{entity:string}>('select entity from admin_save_state')).rows[0].entity,'event_reports');
 const submissionId=crypto.randomUUID();await db.exec('reset role;set role service_role');await db.query(`insert into event_submissions(id,visitor_hash,event_data,photo_path) values($1,'visitor',$2,'private.png')`,[submissionId,JSON.stringify(event)]);await db.exec('reset role;set role authenticated');await db.query(`select review_submission($1,'approved',$2)`,[submissionId,JSON.stringify(event)]);assert.equal((await db.query<{family_friendly:boolean}>(`select family_friendly from events where slug=$1`,['evento-'+submissionId])).rows[0].family_friendly,true);
 }finally{await db.close()}
});
