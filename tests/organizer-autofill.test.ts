import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Event} from '../src/lib/types';
import {organizerPresets,organizerEvent} from '../src/lib/organizer-autofill';
const event=(id:string,extra:Partial<Event>={})=>({id,organizer:'Casa Cultural',instagram_url:'',venue_name:'Salão',address:'Rua A, 10',neighborhood:'Centro',city:'Ipatinga',state:'MG',created_at:'2026-10-01T12:00:00Z',...extra} as Event);

test('Organizador reutiliza o cadastro mais recentemente salvo e mantém endereços diferentes como opções completas',()=>{
  const newest=event('new',{updated_at:'2026-10-25T12:00:00Z',instagram_url:'https://www.instagram.com/casa/',address:'Rua B, 20',neighborhood:'Horto',city:'Timóteo'});
  const data=[event('old'),event('duplicate',{organizer:'CASA CULTURAL'}),newest,event('trash',{deleted_at:'2026-10-26',organizer:'Excluído'})];
  const presets=organizerPresets(data);
  assert.equal(presets.length,1);
  assert.deepEqual(presets[0].locations.map(e=>e.id),['new','old']);
  assert.deepEqual(organizerEvent(presets[0].locations[0],presets[0].organizer.instagram),{organizer:'Casa Cultural',instagram_url:'https://www.instagram.com/casa/',venue_name:'Salão',address:'Rua B, 20',neighborhood:'Horto',city:'Timóteo',state:'MG'});
  assert.equal(data[0].id,'old'); // Does not reorder the admin's event list.
});

test('Preenchimento limita-se a organizador/contato/local, limpa dados ausentes e não copia conteúdo de outro evento',()=>{
  const values=organizerEvent(event('one',{instagram_url:'',address:'',neighborhood:'',starts_at:'2030-01-01T12:00:00Z',title:'Outro evento',status:'published'}),'');
  assert.equal(values.instagram_url,'');assert.equal(values.address,'');assert.equal(values.neighborhood,'');
  assert.deepEqual(Object.keys(values).sort(),['organizer','instagram_url','venue_name','address','neighborhood','city','state'].sort());
  assert.equal(organizerPresets([event('none',{organizer:'',instagram_url:''})]).length,0);
  assert.equal(organizerPresets([event('one',{instagram_url:'https://www.instagram.com/um/'}),event('two',{instagram_url:'https://www.instagram.com/dois/'})]).length,2);
});
