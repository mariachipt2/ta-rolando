import {test} from 'node:test';
import assert from 'node:assert/strict';
import {agendaSelection} from '../src/lib/daily-agenda';
import type {Event} from '../src/lib/types';
const base={starts_at:'2030-11-22T20:00:00-03:00',ends_at:null,status:'published'} as Event;
const now=new Date('2030-11-20T12:00:00-03:00');
const events=[{...base,id:'fri'},{...base,id:'sun',starts_at:'2030-11-24T20:00:00-03:00'},{...base,id:'later',starts_at:'2030-12-02T20:00:00-03:00'},{...base,id:'draft',status:'draft'},{...base,id:'cancelled',status:'cancelled'},{...base,id:'old',starts_at:'2030-11-19T20:00:00-03:00'}] as Event[];
test('Agenda abre no próximo dia com eventos e permite escolher explicitamente um dia vazio',()=>{
 assert.equal(agendaSelection(events,'',now,'day').date,'2030-11-22');
 assert.deepEqual(agendaSelection(events,'',now,'day').events.map(e=>e.id),['fri']);
 assert.deepEqual(agendaSelection(events,'2030-11-23',now,'day').events,[]);
 assert.equal(agendaSelection([events[2]],'',now,'day').date,'2030-12-02');
});
test('Agenda única mostra fim de semana ou todos os próximos sem perder os eventos fora dos sete dias',()=>{
 assert.deepEqual(agendaSelection(events,'',now,'weekend').events.map(e=>e.id),['fri','sun']);
 assert.deepEqual(agendaSelection(events,'',now,'all').events.map(e=>e.id),['fri','sun','later']);
 assert.equal(agendaSelection(events,'2030-12-02',now,'day').events[0].id,'later');
});
test('Agenda preserva horário a confirmar no dia atual e eventos que atravessam a meia-noite',()=>{
 const items=[{...base,id:'pending',starts_at:'2030-11-20T00:00:00-03:00',time_tbd:true},{...base,id:'ongoing',starts_at:'2030-11-19T23:00:00-03:00',ends_at:'2030-11-20T23:00:00-03:00'}];
 assert.deepEqual(agendaSelection(items,'',now,'day').events.map(e=>e.id),['ongoing','pending']);
 assert.equal(agendaSelection(items,'',now,'day').date,'2030-11-20');
});
