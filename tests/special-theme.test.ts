import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {defaultTheme,themeActive,themeCountdown,specialThemeSchema} from '../src/lib/special-theme';
import type {Event} from '../src/lib/types';
const id='00000000-0000-4000-8000-000000000002';
const event={id,starts_at:'2026-10-31T22:00:00Z',ends_at:'2026-11-01T04:00:00Z',status:'published'} as Event;
const theme={...defaultTheme,enabled:true,event_id:id,starts_at:'2026-10-26T12:00:00Z',ends_at:'2026-11-01T03:00:00Z'};

test('Tema respeita início, término, encerramento e publicação, sem destacar cancelados/rascunhos/lixeira',()=>{
  const now=new Date('2026-10-26T15:00:00Z');
  assert.equal(themeActive(theme,event,now),true);
  assert.equal(themeActive(theme,event,new Date('2026-10-26T11:59:59Z')),false);
  assert.equal(themeActive(theme,event,new Date(theme.starts_at)),true);
  assert.equal(themeActive(theme,event,new Date(theme.ends_at)),false);
  assert.equal(themeActive({...theme,ends_at:null},event,new Date(event.ends_at!)),false);
  assert.equal(themeActive({...theme,enabled:false},event,now),false);
  assert.equal(themeActive(theme,null,now),false);
  for(const extra of [{status:'draft'},{status:'cancelled'},{deleted_at:'2026-10-25'},{status:'scheduled',publish_at:'2026-10-30T12:00:00Z'}])assert.equal(themeActive(theme,{...event,...extra} as Event,now),false);
  assert.equal(themeActive(theme,{...event,status:'scheduled',publish_at:'2026-10-26T12:00:00Z'},now),true);
});
test('Contagem considera dias de Brasília; valida vínculo e período',()=>{
  assert.equal(themeCountdown(event,new Date('2026-10-26T15:00:00Z')),'Faltam 5 dias');
  assert.equal(themeCountdown(event,new Date('2026-10-31T01:00:00Z')),'É amanhã!');
  assert.equal(themeCountdown(event,new Date('2026-10-31T15:00:00Z')),'É hoje!');
  assert.equal(themeCountdown(event,new Date(event.starts_at)),'Está rolando!');
  assert.equal(specialThemeSchema.safeParse({...theme,event_id:null}).success,false);
  assert.equal(specialThemeSchema.safeParse({...theme,ends_at:theme.starts_at}).success,false);
  assert.equal(specialThemeSchema.safeParse({...theme,theme:'unknown'}).success,false);
});
test('Supabase: tema inicia desligado, visitante não escreve, administradora salva com recibo e restrições',async()=>{
  const db=new PGlite();try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`);
    for(const file of ['001_initial.sql','003_admin_totals.sql','004_event_instagram.sql','005_submissions_save_confirmation.sql','006_private_save_permissions.sql','007_event_management.sql','014_special_theme.sql','015_seasonal_themes.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
    const category=(await db.query<{id:string}>('select id from categories limit 1')).rows[0].id;
    await db.query(`insert into events(id,slug,title,description,category_id,starts_at,ends_at,venue_name,address,status) values($1,'tema-teste','Evento de teste','Descrição',$2,$3,$4,'Local','Rua A','published')`,[id,category,event.starts_at,event.ends_at]);
    await db.exec(`insert into auth.users values('00000000-0000-4000-8000-000000000001');insert into admin_profiles(user_id,active) values('00000000-0000-4000-8000-000000000001',true)`);
    const save=(value:unknown)=>db.query<{result:{settings:{enabled:boolean};saved_at:string}}>('select save_special_theme($1) result',[JSON.stringify(value)]);
    await db.exec('set role anon');
    assert.equal((await db.query<{enabled:boolean}>('select enabled from site_special_theme')).rows[0].enabled,false);
    await assert.rejects(()=>save(theme));await assert.rejects(()=>db.exec('update site_special_theme set enabled=true'));
    await db.exec('reset role;set role authenticated');await assert.rejects(()=>save(theme));
    await db.exec(`select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false)`);
    await save({...theme,theme:'christmas'});await save({...theme,theme:'newyear'});await assert.rejects(()=>save({...theme,theme:'rock'}));await assert.rejects(()=>save({...theme,theme:'summer'}));
    const result=(await save(theme)).rows[0].result;assert.ok(result.saved_at);assert.equal(result.settings.enabled,true);
    await assert.rejects(()=>save({...theme,ends_at:theme.starts_at}));await assert.rejects(()=>save({...theme,theme:'bad'}));await assert.rejects(()=>save({...theme,event_id:null}));
    assert.equal((await save({...theme,enabled:false})).rows[0].result.settings.enabled,false);
    await db.exec('reset role');
    assert.equal((await db.query<{entity:string}>('select entity from admin_save_state')).rows[0].entity,'site_special_theme');
    await db.query("update events set status='draft' where id=$1",[id]);await db.exec('set role authenticated');await assert.rejects(()=>save(theme));
  }finally{await db.close()}
});
