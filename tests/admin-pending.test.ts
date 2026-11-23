import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pendingEventItems,eventIssues} from '../src/lib/event-discovery';
import type {Event} from '../src/lib/types';
const now=new Date('2026-11-23T12:00:00-03:00');
const event:Event={slug:'next',description:'',category_id:'music',organizer:'',is_free:false,price:'',ticket_url:'',age_rating:'Livre',additional_info:'',publish_at:null,featured:false,created_at:'2026-11-01T00:00:00Z',interest_count:0,id:'next',title:'Próximo evento',starts_at:'2026-11-28T20:00:00-03:00',ends_at:null,status:'published',cover_url:'https://example.com/cartaz.jpg',gallery:[],venue_name:'Local',address:'Centro Comercial do Cariru',neighborhood:'Cariru',city:'Ipatinga',state:'MG'};
test('Pendências ignoram eventos encerrados, cancelados e lixeira sem alterar seus cadastros',()=>{
 const items=[event,{...event,id:'cancelled',status:'cancelled'},{...event,id:'old',starts_at:'2026-11-20T21:00:00-03:00'},{...event,id:'trashed',deleted_at:'2026-11-21T12:00:00Z'},{...event,id:'draft',status:'draft',starts_at:'2026-11-20T21:00:00-03:00'}] as Event[];
 assert.deepEqual(pendingEventItems(items,now).map(item=>item.event.id),['next','draft']);
 assert.equal(items.length,5);assert.equal(items[1].status,'cancelled');
 assert.equal(eventIssues(items[1]).length,1);
});
test('Pendências preservam eventos em andamento e horário a confirmar durante o dia e somem após corrigir',()=>{
 const items=[{...event,id:'ongoing',starts_at:'2026-11-22T23:00:00-03:00',ends_at:'2026-11-23T23:00:00-03:00'},{...event,id:'pending-time',time_tbd:true,starts_at:'2026-11-23T00:00:00-03:00'},{...event,id:'fixed',address:'Rua Principal, 123'}];
 assert.deepEqual(pendingEventItems(items,now).map(item=>item.event.id),['ongoing','pending-time']);
});

