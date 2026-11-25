import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coveredEvents} from '../src/lib/covered-events';
import type {Event} from '../src/lib/types';
const now=new Date('2030-11-20T12:00:00-03:00');
const event=(id:string,extra:Partial<Event>={})=>({id,slug:id,title:id,venue_name:'Garajão',neighborhood:'Novo Centro',starts_at:'2030-11-22T20:00:00-03:00',status:'published',environment:'coberto',is_free:true,...extra} as Event);
test('Cobertos exige cobertura explícita e disponibilidade pública atual',()=>{
 const items=[event('ok'),event('misto',{environment:'misto'}),event('aberto',{environment:'ao_ar_livre'}),event('unknown',{environment:null}),event('draft',{status:'draft'}),event('cancel',{status:'cancelled'}),event('sold',{sold_out:true}),event('trash',{deleted_at:'2030-11-19T12:00:00Z'}),event('old',{starts_at:'2030-11-19T18:00:00-03:00'}),event('inactive',{categories:{active:false} as Event['categories']})];
 assert.deepEqual(coveredEvents(items,now).map(e=>e.id),['ok']);
});
test('Cobertos combina período, entrada e busca sem acentos e mantém eventos de vários dias',()=>{
 const items=[event('ongoing',{starts_at:'2030-11-19T12:00:00-03:00',ends_at:'2030-11-22T18:00:00-03:00'}),event('paid',{is_free:false}),event('later',{starts_at:'2030-12-22T12:00:00-03:00'})];
 assert.deepEqual(coveredEvents(items,now,'today','free','garajao').map(e=>e.id),['ongoing']);
 assert.deepEqual(coveredEvents(items,now,'weekend','paid','novo centro').map(e=>e.id),['paid']);
 assert.equal(coveredEvents(items,now,'today','paid').length,0);
});
