import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Event,EventSubmission} from '../src/lib/types';
import {eventOrganizer,sameOrganizer,parseOrganizers,organizerDirectory} from '../src/lib/organizers';
import {weekendStart,weekendEvents,validWeekendStart,weekendUrl} from '../src/lib/weekend';
import {inPeriod} from '../src/lib/dates';
import {buildRegistryExport,registryCsv,csvCell} from '../src/lib/registry-export';
const event=(id:string,extra:Partial<Event>={})=>({id,title:'Evento',organizer:'Associação Cultural',instagram_url:'',starts_at:'2030-10-25T20:00:00-03:00',ends_at:null,status:'published',gallery:[],...extra} as Event);
test('Organizadores: perfil tem identidade estável; nome serve de alternativa sem inventar organizador',()=>{
 const first=eventOrganizer(event('a',{instagram_url:'https://instagram.com/Organizador/?igsh=123'}))!;
 const renamed=eventOrganizer(event('b',{organizer:'Novo nome',instagram_url:'https://www.instagram.com/organizador/'}))!;
 assert.ok(sameOrganizer(first,renamed));assert.ok(sameOrganizer(first,eventOrganizer(event('c',{organizer:'  Associacao   Cultural '}))!));
 assert.equal(sameOrganizer(first,eventOrganizer(event('d',{instagram_url:'https://www.instagram.com/outra_associacao/'}))!),false);
 assert.equal(eventOrganizer(event('none',{organizer:'',instagram_url:''})),null);
 assert.equal(eventOrganizer(event('instagram',{organizer:'',instagram_url:'https://www.instagram.com/organizador/'}))!.name,'@organizador');
 assert.equal(organizerDirectory([event('a'),event('b',{organizer:'ASSOCIACAO CULTURAL'}),event('deleted',{deleted_at:'2030-01-01'})]).length,1);
 const parsed=parseOrganizers(JSON.stringify([first]));assert.ok(sameOrganizer(parsed[0],first));assert.throws(()=>parseOrganizers('{bad}'));assert.throws(()=>parseOrganizers(JSON.stringify([{name:'Teste',instagram:'https://evil.test/'}])));
});
test('Fim de semana usa sexta a domingo em Brasília, com link fixo e eventos em andamento',()=>{
 assert.equal(weekendStart(new Date('2026-10-20T15:00:00Z')),'2026-10-23');
 assert.equal(weekendStart(new Date('2026-10-26T01:00:00Z')),'2026-10-23'); // Sunday in Brasília.
 assert.equal(weekendStart(new Date('2026-10-26T04:00:00Z')),'2026-10-30');
 assert.equal(validWeekendStart('2026-10-23'),true);assert.equal(validWeekendStart('2026-10-24'),false);assert.equal(validWeekendStart('2026-02-30'),false);
 const data=[event('friday',{starts_at:'2026-10-23T00:00:00-03:00'}),event('sunday',{starts_at:'2026-10-26T02:59:00Z'}),event('monday',{starts_at:'2026-10-26T03:00:00Z'}),event('ongoing',{starts_at:'2026-10-22T22:00:00-03:00',ends_at:'2026-10-23T03:00:00-03:00'}),event('ends-before',{starts_at:'2026-10-22T22:00:00-03:00',ends_at:'2026-10-23T00:00:00-03:00'}),event('cancelled',{status:'cancelled',starts_at:'2026-10-23T20:00:00-03:00'}),event('draft',{status:'draft',starts_at:'2026-10-23T20:00:00-03:00'})];
 assert.deepEqual(weekendEvents(data,'2026-10-23',new Date('2026-10-22T18:00:00-03:00')).map(e=>e.id),['ongoing','friday','sunday']);
 assert.equal(inPeriod(data[0].starts_at,null,'weekend',new Date('2026-10-20T15:00:00Z')),true);
 assert.equal(weekendUrl('https://example.test/ta-rolando/#/fim-de-semana','2026-10-23'),'https://example.test/ta-rolando/#/fim-de-semana?inicio=2026-10-23');
 assert.equal(weekendUrl('https://example.test/fim-de-semana','2026-10-23'),'https://example.test/fim-de-semana?inicio=2026-10-23');
});
test('Exportação preserva cadastros e lixeira, omite hashes e links temporários, e protege CSV',()=>{
 const submission={id:'s1',event_data:{title:'=HYPERLINK("https://evil.test")',description:'Texto com ; e "aspas"\nOutra linha'},status:'pending',submitted_at:'2026-10-20T12:00:00Z',updated_at:'2026-10-20T12:00:00Z',reviewed_at:null,approved_event_id:null,photo_path:'private/photo.png',photo_url:'https://example.test/signed?token=secret',visitor_hash:'secret-hash'} as EventSubmission;
 const data=buildRegistryExport([event('live'),event('bin',{deleted_at:'2026-10-20T12:00:00Z'})],[],[submission],{saved_at:'2026-10-20T12:00:00Z',entity:'events'});
 assert.equal(data.events.length,2);assert.ok(data.events[1].deleted_at);assert.equal(data.submissions[0].photo_path,'private/photo.png');assert.equal(JSON.stringify(data).includes('secret'),false);
 const csv=registryCsv(data,'submissions');assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes('"\'=HYPERLINK(""https://evil.test"'));assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('""aspas""'));assert.ok(csv.includes('Outra linha'));assert.ok(csv.includes('submission_status'));
 assert.equal(csvCell('  +SUM(1,2)'),`"'  +SUM(1,2)"`);assert.equal(csvCell('@formula'),`"'@formula"`);assert.equal(csvCell('normal'),'"normal"');
});

test('Fim de semana exclui o Pizero encerrado na madrugada de sexta, sem perder evento ainda em andamento',()=>{
 const pizero=event('pizero',{title:'Pizero da Estação',starts_at:'2026-10-23T01:30:00Z',ends_at:'2026-10-23T05:30:00Z'});
 const friday=event('sexta',{starts_at:'2026-10-23T23:00:00Z'}),saturday=event('sabado',{starts_at:'2026-10-25T00:00:00Z'});
 const ongoing=event('em-andamento',{starts_at:'2026-10-22T23:00:00Z',ends_at:'2026-10-23T23:00:00Z'});
 const rows=[pizero,friday,saturday,ongoing];
 assert.ok(weekendEvents(rows,'2026-10-23',new Date('2026-10-23T04:00:00Z')).some(e=>e.id==='pizero'));
 assert.ok(!weekendEvents(rows,'2026-10-23',new Date('2026-10-23T05:30:00Z')).some(e=>e.id==='pizero'));
 assert.deepEqual(weekendEvents(rows,'2026-10-23',new Date('2026-10-23T18:00:00Z')).map(e=>e.id),['em-andamento','sexta','sabado']);
 assert.deepEqual(weekendEvents(rows,'2026-10-23',new Date('2026-10-26T15:00:00Z')),[]);
});
