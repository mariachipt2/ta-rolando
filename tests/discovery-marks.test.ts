import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {discoveryKey,discoveryState,type DiscoveryMark} from '../src/lib/discovery-marks';
test('Marcações distinguem sessões do evento, persistem ignorados e reconhecem cadastros automaticamente',()=>{
 const item={source_url:'https://socialyte.com.br/eventos/show/',starts_at:'2030-11-01T20:00:00-03:00'};
 const mark:DiscoveryMark={...item,starts_at:'2030-11-01T23:00:00Z',status:'ignored',updated_at:'2030-10-01T10:00:00Z'};
 assert.equal(discoveryKey(item),discoveryKey(mark));assert.equal(discoveryState(item,[],false),'pending');assert.equal(discoveryState(item,[],true),'added');assert.equal(discoveryState(item,[mark],true),'ignored');assert.equal(discoveryState({...item,starts_at:'2030-11-02T23:00:00Z'},[mark],false),'pending');assert.equal(discoveryState(item,[{...mark,status:'pending'}],true),'added');assert.equal(discoveryState(item,[{...mark,status:'added'}],false),'added');
});
test('Supabase: marcações privadas, idempotentes, reversíveis e com recibo sem criar eventos',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`);
 for(const file of ['001_initial.sql','003_admin_totals.sql','004_event_instagram.sql','005_submissions_save_confirmation.sql','006_private_save_permissions.sql','007_event_management.sql','009_discovery_marks.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
 await db.exec(`insert into auth.users values('00000000-0000-4000-8000-000000000001');insert into admin_profiles(user_id,active) values('00000000-0000-4000-8000-000000000001',true)`);
 const call=(status:string)=>db.query<{result:{saved_at:string;mark:DiscoveryMark}}>(`select mark_discovery('https://socialyte.com.br/eventos/show/','2030-11-01T23:00:00Z',$1) result`,[status]);
 await db.exec('set role anon');await assert.rejects(()=>db.query('select * from discovery_marks'));await assert.rejects(()=>call('ignored'));
 await db.exec('reset role;set role authenticated');assert.equal((await db.query('select * from discovery_marks')).rows.length,0);await assert.rejects(()=>call('ignored'));
 await db.exec(`select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false)`);
 for(const status of ['ignored','added','pending']){const result=(await call(status)).rows[0].result;assert.equal(result.mark.status,status);assert.ok(result.saved_at);assert.equal((await db.query('select * from discovery_marks')).rows.length,1)}
 await assert.rejects(()=>call('published'));await assert.rejects(()=>db.query(`select mark_discovery('https://evil.test/eventos/x','2030-11-01T23:00:00Z','added')`));
 await assert.rejects(()=>db.query(`update discovery_marks set status='added'`));
 assert.equal((await db.query('select * from events')).rows.length,0);
 assert.equal((await db.query<{entity:string}>('select entity from admin_save_state')).rows[0].entity,'discovery_marks');
 await db.exec(`select set_config('request.jwt.claim.sub','',false)`);assert.equal((await db.query('select * from discovery_marks')).rows.length,0);
 }finally{await db.close()}
});
