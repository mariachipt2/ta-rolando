import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {trendingEvents} from '../src/lib/trending';
import type {Event} from '../src/lib/types';
const now=new Date('2030-11-20T12:00:00Z');
const base={starts_at:'2030-11-21T22:00:00Z',ends_at:null,status:'published',recent_views:0,recent_ticket_clicks:0,interest_count:0} as Event;
test('Tá Bombando usa cliques e visualizações recentes, sem depender do Eu vou ou do total histórico',()=>{
 const events=[{...base,id:'popular-attendance',interest_count:100,views:900},
 {...base,id:'views',recent_views:7},{...base,id:'clicks',recent_views:4,recent_ticket_clicks:3},
 {...base,id:'ended',recent_views:50,starts_at:'2030-11-19T22:00:00Z'},
 {...base,id:'cancelled',recent_views:50,status:'cancelled'},
 {...base,id:'draft',recent_views:50,status:'draft'},
 {...base,id:'trash',recent_views:50,deleted_at:'2030-11-18T12:00:00Z'},
 {...base,id:'scheduled',recent_views:50,status:'scheduled',publish_at:'2030-11-21T12:00:00Z'},
 {...base,id:'inactive',recent_views:50,categories:{active:false}},
 {...base,id:'pending-time',starts_at:'2030-11-20T03:00:00Z',time_tbd:true,recent_views:2}] as Event[];
 assert.deepEqual(trendingEvents(events,now).map(e=>e.id),['clicks','views','pending-time']);
 assert.equal(events[0].id,'popular-attendance');
 assert.deepEqual(trendingEvents([{...base,id:'legacy',recent_views:undefined,recent_ticket_clicks:undefined}],now),[]);
});
test('Supabase fornece apenas totais públicos dos últimos sete dias de Brasília, preservando métricas privadas',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`);
 for(const file of ['001_initial.sql','003_admin_totals.sql','004_event_instagram.sql','005_submissions_save_confirmation.sql','006_private_save_permissions.sql','007_event_management.sql','024_recent_trending.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
 const category=(await db.query<{id:string}>('select id from categories limit 1')).rows[0].id;
 const id='00000000-0000-4000-8000-000000000002';
 await db.query(`insert into events(id,slug,title,description,category_id,starts_at,venue_name,address,status) values($1,'trending-test','Evento teste','Descrição',$2,now()+interval '1 day','Local','Rua Um','published')`,[id,category]);
 for(const [offset,views,clicks] of [[0,5,2],[-6,4,0],[-7,100,200],[1,200,300]])await db.query(`insert into event_metrics(event_id,day,views,ticket_clicks) values($1,(now() at time zone 'America/Sao_Paulo')::date+$2::int,$3,$4)`,[id,offset,views,clicks]);
 await db.exec('set role anon');
 const result=(await db.query<{recent_views:number;recent_ticket_clicks:number}>('select recent_views,recent_ticket_clicks from public_events where id=$1',[id])).rows[0];
 assert.equal(Number(result.recent_views),9);assert.equal(Number(result.recent_ticket_clicks),2);
 await assert.rejects(()=>db.query('select * from event_metrics'));
 await db.exec('reset role');await db.query("update events set status='draft' where id=$1",[id]);await db.exec('set role anon');
 assert.equal((await db.query('select id from public_events where id=$1',[id])).rows.length,0);
 }finally{await db.close()}
});
