import {test} from 'node:test';import assert from 'node:assert/strict';import {PGlite} from '@electric-sql/pglite';import {readFileSync} from 'node:fs';import {createSiteClock} from '../src/lib/site-clock';import {upcoming,day} from '../src/lib/dates';
test('Relógio do Supabase impede anunciar o Piseiro encerrado quando o aparelho ainda marca quinta',()=>{
 let wall=Date.parse('2026-10-22T18:00:00-03:00'),tick=100;
 const clock=createSiteClock(()=>wall,()=>tick);
 const event={starts_at:'2026-10-23T01:30:00Z',ends_at:'2026-10-23T05:30:00Z'};
 assert.equal(upcoming(event,new Date(clock.now())),true);
 clock.sync('2026-10-23T18:45:00Z');assert.equal(upcoming(event,new Date(clock.now())),false);assert.equal(day(new Date(clock.now())),'2026-10-23');
 wall=Date.parse('2026-10-24T00:00:00Z');tick+=60000;assert.equal(clock.now(),Date.parse('2026-10-23T18:46:00Z'));
 assert.equal(upcoming({starts_at:'2026-10-23T23:00:00Z',ends_at:null},new Date(clock.now())),true);
 assert.throws(()=>clock.sync('horário inválido'));assert.equal(day(new Date(clock.now())),'2026-10-23');
});
test('Hora pública do banco dispensa login e não expõe dados de cadastro',async()=>{const db=new PGlite();try{await db.exec('create role anon;create role authenticated;create role service_role;grant usage on schema public to anon;');await db.exec(readFileSync('supabase/migrations/013_site_clock.sql','utf8'));await db.exec('set role anon');const r=await db.query<{now:Date}>('select site_clock() as now');assert.ok(Number.isFinite(new Date(r.rows[0].now).getTime()));}finally{await db.close()}});
