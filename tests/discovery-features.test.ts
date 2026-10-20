import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Event} from '../src/lib/types';
import {forChildren,similarEvents,eventIssues} from '../src/lib/event-discovery';
import {posterFilename,posterText} from '../src/lib/event-poster';
const event=(id:string,extra:Partial<Event>={})=>({id,title:'Passeio em família',category_id:'category',starts_at:'2030-10-25T20:00:00-03:00',ends_at:null,status:'published',cover_url:'https://example.test/photo.png',gallery:[],venue_name:'Parque',address:'Rua das Flores, 10',neighborhood:'Centro',city:'Ipatinga',state:'MG',...extra} as Event);
test('Filtro infantil usa somente confirmação explícita, sem inferir pela categoria ou classificação',()=>{
 assert.equal(forChildren(event('1',{family_friendly:true})),true);
 for(const family_friendly of [false,null,undefined])assert.equal(forChildren(event('1',{family_friendly,age_rating:'Livre'})),false);
});
test('Semelhantes: mesma categoria, próximos, públicos, sem repetir o evento nem mostrar cancelados',()=>{
 const now=new Date('2030-10-20T12:00:00Z'),current=event('current');
 const candidates=[current,event('other',{category_id:'other'}),event('cancelled',{status:'cancelled'}),event('deleted',{deleted_at:now.toISOString()}),event('draft',{status:'draft'}),event('past',{starts_at:'2020-01-01T12:00:00Z'}),event('private-schedule',{status:'scheduled',publish_at:'2030-10-21T12:00:00Z'}),event('later',{starts_at:'2030-10-27T12:00:00Z'}),event('sooner',{starts_at:'2030-10-22T12:00:00Z'}),event('scheduled',{status:'scheduled',publish_at:'2030-10-19T12:00:00Z'}),event('fourth',{starts_at:'2030-10-29T12:00:00Z'})];
 assert.deepEqual(similarEvents(current,candidates,now).map(e=>e.id),['sooner','scheduled','later']);
});
test('Pendências reconhecem fotos na galeria, campos ausentes e endereço sem número informado',()=>{
 assert.deepEqual(eventIssues(event('ok')),[]);
 assert.deepEqual(eventIssues(event('gallery',{cover_url:'',gallery:['https://example.test/photo.png']})),[]);
 assert.deepEqual(eventIssues(event('unnumbered',{address:'Rua das Flores, s/n'})),[]);
 assert.equal(eventIssues(event('photo',{cover_url:'',gallery:[]}))[0].type,'photo');
 assert.equal(eventIssues(event('number',{address:'Rua das Flores'}))[0].type,'address');
 assert.match(eventIssues(event('missing',{address:'',city:'',state:'',neighborhood:''}))[0].label,/rua ou referência, bairro, cidade, UF/);
});
test('Cartaz tem data de Brasília, local, link e indicação de cancelamento; nome do arquivo é seguro',()=>{
 const e=event('x',{title:'Festa / edição: especial?',status:'cancelled'}),url='https://example.test/#/evento/festa';
 const caption=posterText(e,url);assert.match(caption,/CANCELADO/);assert.match(caption,/25\/10\/2030 · 20:00/);assert.match(caption,/Parque — Ipatinga\/MG/);assert.ok(caption.endsWith(url));assert.equal(posterFilename(e),'ta-rolando-festa-edicao-especial.png');
});
