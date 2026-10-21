import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Event} from '../src/lib/types';
import {eventIds,sharedIds,programLink,selectedEvents,scheduleOverlap} from '../src/lib/event-selection';
const ids=Array.from({length:21},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
const event=(id:string,extra:Partial<Event>={})=>({id,title:'Evento público',status:'published',starts_at:'2030-10-25T20:00:00-03:00',ends_at:'2030-10-25T23:00:00-03:00',...extra} as Event);
test('Seleções validam identificadores, removem duplicatas e respeitam os limites',()=>{
 assert.deepEqual(eventIds([ids[0],ids[0]],2),[ids[0]]);assert.throws(()=>eventIds(ids.slice(0,3),2));assert.throws(()=>eventIds(['<script>'],2));assert.throws(()=>eventIds(null,2));assert.deepEqual(sharedIds(ids.slice(0,20).join(',')),ids.slice(0,20));assert.throws(()=>sharedIds(ids.join(',')));assert.throws(()=>sharedIds('inválido'));assert.deepEqual(sharedIds(null),[]);
});
test('Programação inclui somente os eventos escolhidos e título, sem identificadores privados da origem',()=>{
 const link=programLink('https://example.test/ta-rolando/?visitor=SEGREDO#/programacao?agenda=PRIVADA',[ids[1]],'  Sábado com amigos  '),url=new URL(link),params=new URLSearchParams(url.hash.split('?')[1]);assert.equal(url.search,'');assert.equal(params.get('eventos'),ids[1]);assert.equal(params.get('titulo'),'Sábado com amigos');assert.equal(params.size,2);assert.ok(!link.includes('SEGREDO'));assert.ok(!link.includes('PRIVADA'));assert.ok(!link.includes(ids[0]));assert.equal(url.hash.split('?')[0],'#/programacao-compartilhada');
 const native=new URL(programLink('https://example.test/programacao?private=SECRET',[ids[0]],''));assert.equal(native.pathname,'/programacao-compartilhada');assert.equal(native.searchParams.get('titulo'),'Meus rolês');assert.equal(native.searchParams.get('private'),null);assert.throws(()=>programLink(native.href,[],''));assert.throws(()=>programLink(native.href,ids,''));
});
test('Página compartilhada preserva a seleção, mostra cancelados e não revela rascunhos ou lixeira',()=>{
 const data=[event(ids[0]),event(ids[1],{status:'cancelled'}),event(ids[2],{status:'draft'}),event(ids[3],{deleted_at:'2030-01-01T00:00:00Z'}),event(ids[4],{status:'scheduled',publish_at:'2031-01-01T00:00:00Z'})];
 assert.deepEqual(selectedEvents([ids[1],ids[0]],data).map(e=>e.id),[ids[1],ids[0]]);assert.deepEqual(selectedEvents(ids.slice(0,5),data,new Date('2030-10-20T12:00:00Z')).map(e=>e.id),[ids[0],ids[1]]);assert.equal(selectedEvents([ids[5]],data).length,0);
});
test('Comparação informa sobreposição somente com duração conhecida e respeita o horário final',()=>{
 const first=event(ids[0]);assert.equal(scheduleOverlap(first,event(ids[1],{starts_at:'2030-10-25T22:00:00-03:00',ends_at:'2030-10-26T01:00:00-03:00'})),'overlap');assert.equal(scheduleOverlap(first,event(ids[1],{starts_at:first.ends_at!,ends_at:'2030-10-26T02:00:00-03:00'})),'clear');assert.equal(scheduleOverlap(first,event(ids[1],{ends_at:null})),'unknown');
});
