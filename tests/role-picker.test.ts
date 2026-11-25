import {test} from 'node:test';import assert from 'node:assert/strict';
import {confirmedPriceCeiling,pickEvents,pickerDefaults} from '../src/lib/role-picker';import type {Event} from '../src/lib/types';
const now=new Date('2030-11-20T12:00:00-03:00');
const event=(id:string,extra:Partial<Event>={})=>({id,slug:id,title:id,starts_at:'2030-11-22T20:00:00-03:00',ends_at:null,status:'published',is_free:true,price:'',category_id:'music',categories:{id:'music',name:'Shows e música',icon:'Music',active:true},...extra} as Event);
test('Orçamento só considera gratuidade cadastrada e teto explícito sem condições',()=>{
 for(const [price,value] of [['R$ 20,00',20],['R$ 20 - R$ 50',50],['20,00 a 30,00',30],['R$ 1.200,00',1200],['R$ 20.50',20.5],['R$ 20 por pessoa',20]] as const)assert.equal(confirmedPriceCeiling({is_free:false,price}),value,price);
 for(const price of ['', 'Pago','R$ 20 meia / R$ 40 inteira','A partir de R$ 20','R$ 60 o casal','R$ 20 + consumo','R$ 0','R$ 20 antecipado'])assert.equal(confirmedPriceCeiling({is_free:false,price}),null,price);
 assert.equal(confirmedPriceCeiling({is_free:true,price:''}),0);
 const rows=[event('free'),event('paid',{is_free:false,price:'R$ 20'}),event('range',{is_free:false,price:'R$ 20 - R$ 50'}),event('unknown',{is_free:false,price:''})];
 assert.deepEqual(pickEvents(rows,{...pickerDefaults,budget:'30'},now).map(r=>r.event.id),['free','paid']);assert.deepEqual(pickEvents(rows,{...pickerDefaults,budget:'free'},now).map(r=>r.event.id),['free']);
});
test('Não sugere rascunhos, cancelados, esgotados, lixeira, categoria inativa ou agendados ainda privados',()=>{
 const rows=[event('ok'),...(['draft','cancelled'] as const).map(status=>event(status,{status})),event('sold',{sold_out:true}),event('trash',{deleted_at:now.toISOString()}),event('hidden',{categories:{id:'music',name:'Música',icon:'Music',active:false}}),event('scheduled',{status:'scheduled',publish_at:'2030-11-21T18:00:00Z'}),event('ended',{starts_at:'2030-11-19T21:00:00-03:00'})];assert.deepEqual(pickEvents(rows,pickerDefaults,now).map(r=>r.event.id),['ok']);
});
test('Mantém período e vibe estritos, admite multidiários e horário a confirmar, sem inventar alternativas',()=>{
 const today=new Date('2030-11-20T23:30:00-03:00');const rows=[event('ongoing',{starts_at:'2030-11-19T20:00:00-03:00',ends_at:'2030-11-21T02:00:00-03:00'}),event('tbd',{starts_at:'2030-11-20T03:00:00Z',time_tbd:true}),event('tomorrow',{starts_at:'2030-11-21T20:00:00-03:00'}),event('family',{family_friendly:true})];
 assert.deepEqual(pickEvents(rows,{...pickerDefaults,when:'today'},today).map(r=>r.event.id),['ongoing','tbd']);
 assert.deepEqual(pickEvents(rows,{...pickerDefaults,vibe:'family'},now).map(r=>r.event.id),['family']);
 assert.equal(pickEvents(rows,{...pickerDefaults,vibe:'faith'},now).length,0);
 const several=Array.from({length:5},(_,i)=>event('e'+i,{starts_at:`2030-11-${25-i}T20:00:00-03:00`}));assert.deepEqual(pickEvents(several,pickerDefaults,now).map(r=>r.event.id),['e4','e3','e2']);
});
