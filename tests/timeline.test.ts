import {test} from 'node:test';
import assert from 'node:assert/strict';
import {timelineGroups,timelineMonths,shiftMonth} from '../src/lib/timeline';
import type {Event} from '../src/lib/types';
const event=(id:string,start:string,extra:Partial<Event>={})=>({id,starts_at:start,ends_at:null,...extra} as Event);
test('Linha do tempo agrupa em Brasília, ordena datas e mantém cancelamentos visíveis',()=>{
 const events=[event('b','2030-10-22T02:00:00Z'),event('a','2030-10-21T20:00:00Z'),event('c','2030-10-22T16:00:00Z',{status:'cancelled'}),event('d','2030-10-23T12:00:00Z',{deleted_at:'2030-10-20T00:00:00Z'})];
 const groups=timelineGroups(events,'all');assert.deepEqual(groups.map(g=>g.date),['2030-10-21','2030-10-22']);assert.deepEqual(groups[0].events.map(e=>e.id),['a','b']);assert.equal(groups[1].events[0].status,'cancelled');
});
test('Linha do tempo separa anteriores de próximos sem ocultar eventos em andamento',()=>{
 const now=new Date('2030-10-22T12:00:00Z'),events=[event('past','2030-10-20T10:00:00Z'),event('recent','2030-10-21T10:00:00Z'),event('ongoing','2030-10-22T10:00:00Z',{ends_at:'2030-10-22T15:00:00Z'}),event('future','2030-10-23T10:00:00Z')];
 assert.deepEqual(timelineGroups(events,'past',now).flatMap(g=>g.events.map(e=>e.id)),['recent','past']);assert.deepEqual(timelineGroups(events,'upcoming',now).flatMap(g=>g.events.map(e=>e.id)),['ongoing','future']);
});

test('Meses cadastrados contam por Brasília e ignoram a lixeira',()=>{
 const events=[event('a','2030-11-01T02:00:00Z'),event('b','2030-11-01T03:00:00Z'),event('c','2030-10-12T12:00:00Z'),event('d','2030-12-01T12:00:00Z',{deleted_at:'2030-12-02T12:00:00Z'})];
 assert.deepEqual(timelineMonths(events),[{month:'2030-10',count:2},{month:'2030-11',count:1}]);
});
test('Navegação mensal atravessa anos e fevereiro sem pular meses',()=>{
 assert.equal(shiftMonth('2030-12',1),'2031-01');assert.equal(shiftMonth('2030-01',-1),'2029-12');assert.equal(shiftMonth('2028-01',1),'2028-02');assert.equal(shiftMonth('2028-02',1),'2028-03');
});

