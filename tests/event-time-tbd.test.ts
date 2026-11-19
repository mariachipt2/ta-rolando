import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {displayDate,day,eventTime,upcoming} from '../src/lib/dates';
import {calendar} from '../src/lib/calendar';
import {eventSchema} from '../src/lib/validation';
import {scheduleOverlap} from '../src/lib/event-selection';
import {artistEvents} from '../src/lib/artists';
import {normalizeDraftStart} from '../supabase/functions/_shared/draft-time';
import type {Event} from '../src/lib/types';
const event={slug:'demonstracao',created_at:'2030-11-01T12:00:00Z',interest_count:0,id:'00000000-0000-4000-8000-000000000002',title:'Brenda Brandão',description:'Show de demonstração',category_id:'00000000-0000-4000-8000-000000000003',starts_at:'2030-11-20T00:00:00-03:00',ends_at:null,time_tbd:true,venue_name:'Local confirmado',address:'Rua Um, 123',neighborhood:'Centro',city:'Ipatinga',state:'MG',organizer:'',artist_ids:['c1c5e00a-a620-4ad0-a655-38d56f0fc689'],family_friendly:null,change_notice:'',instagram_url:'',is_free:false,price:'A confirmar',ticket_url:'',age_rating:'Não informada',cover_url:'',gallery:[],additional_info:'',status:'published',publish_at:null,featured:false} as Event;
test('Sem horário: mantém o dia inteiro, usa Brasília e não inventa hora na agenda ou no calendário',()=>{
 assert.equal(displayDate(event.starts_at,true),'20/11/2030 · Horário a confirmar');
 assert.equal(eventTime(event),'A confirmar');
 assert.equal(upcoming(event,new Date('2030-11-21T02:59:59Z')),true);
 assert.equal(upcoming(event,new Date('2030-11-21T03:00:00Z')),false);
 assert.equal(upcoming({...event,time_tbd:false},new Date('2030-11-20T04:00:00Z')),false);
 assert.equal(artistEvents([event],event.artist_ids![0],new Date('2030-11-20T23:00:00Z')).length,1);
 assert.equal(scheduleOverlap(event,{...event,ends_at:'2030-11-20T23:00:00Z'}),'unknown');
 const ics=calendar(event);assert.match(ics,/DTSTART;VALUE=DATE:20301120/);assert.match(ics,/DTEND;VALUE=DATE:20301121/);assert.match(ics,/STATUS:TENTATIVE/);assert.doesNotMatch(ics,/DTSTART:\d+T/);
 const parsed=eventSchema.parse({...event,starts_at:'2030-11-21T01:00:00Z'});assert.equal(day(parsed.starts_at),'2030-11-20');assert.equal(eventTime(parsed),'A confirmar');
 assert.equal(eventSchema.safeParse({...event,ends_at:'2030-11-21T02:00:00Z'}).success,false);
 assert.equal(normalizeDraftStart('2030-11-20',true),'2030-11-20T00:00:00-03:00');
 assert.equal(normalizeDraftStart('2030-11-21T01:00:00Z',true),'2030-11-20T00:00:00-03:00');
});
test('Supabase preserva horário a confirmar na recorrência, views, histórico e atualização do horário',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`);
 for(const file of ['001_initial.sql','003_admin_totals.sql','004_event_instagram.sql','005_submissions_save_confirmation.sql','006_private_save_permissions.sql','007_event_management.sql','011_venues.sql','017_nightlife_filter.sql','020_artists.sql','023_event_time_tbd.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
 const category=(await db.query<{id:string}>('select id from categories limit 1')).rows[0].id;
 await db.exec(`insert into auth.users values('00000000-0000-4000-8000-000000000001');insert into admin_profiles(user_id,active) values('00000000-0000-4000-8000-000000000001',true);set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false)`);
 const result=await db.query<{result:{ids:string[]}}>('select create_event_series($1,$2,$3,$4) result',['00000000-0000-4000-8000-000000000005',JSON.stringify({...event,category_id:category}),'weekly',2]);
 const ids=result.rows[0].result.ids;
 assert.equal((await db.query('select id from public_events where time_tbd')).rows.length,2);
 assert.equal((await db.query('select id from admin_events where time_tbd')).rows.length,2);
 const version=(await db.query<{id:string}>('select id from event_versions where event_id=$1 order by created_at limit 1',[ids[0]])).rows[0].id;
 await db.query("update events set time_tbd=false,starts_at='2030-11-20T23:00:00Z' where id=$1",[ids[0]]);
 assert.equal((await db.query<{time_tbd:boolean}>('select time_tbd from public_events where id=$1',[ids[0]])).rows[0].time_tbd,false);
 await db.query('select restore_event_version($1)',[version]);
 assert.equal((await db.query<{time_tbd:boolean}>('select time_tbd from public_events where id=$1',[ids[0]])).rows[0].time_tbd,true);
 await assert.rejects(()=>db.query("update events set ends_at='2030-11-21T02:00:00Z' where id=$1",[ids[0]]));
 await db.exec('reset role;set role anon');assert.equal((await db.query('select id from public_events where time_tbd')).rows.length,2);await assert.rejects(()=>db.exec('update events set time_tbd=false'));
 }finally{await db.close()}
});
