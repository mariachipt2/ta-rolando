import {test} from 'node:test';import assert from 'node:assert/strict';
import {ownNumber,messageFor,pendingNotices,sendOnce,brasiliaDay,dailyConfig,dailyDue,eventsForDay,dailyMessage} from '../scripts/whatsapp-local/core.mjs';
test('WhatsApp local: só usa o próprio número, restringe avisos à ativação e monta link público',()=>{
 assert.equal(ownNumber({ownerJid:'5531999999999@s.whatsapp.net'}),'5531999999999');assert.equal(ownNumber({ownerJid:'123@lid'}),null);assert.equal(ownNumber({ownerJid:'123@g.us'}),null);
 const n={id:'a',title:'Evento exemplo',scheduled_at:'2026-10-23T12:00:00Z',confirmed_at:'2026-10-23T12:00:30Z'};
 assert.equal(pendingNotices([n],{enabledAt:'2026-10-23T12:01:00Z'},{}).length,0);assert.equal(pendingNotices([n],{enabledAt:'2026-10-23T12:00:00Z'},{a:{status:'accepted'}}).length,0);
 const msg=messageFor(n,{slug:'evento exemplo'});assert.match(msg,/09:00/);assert.match(msg,/evento%20exemplo/);assert.doesNotMatch(msg,/service|secret|apikey/i);
});
test('WhatsApp local: grava antes de enviar e não repete envio aceito ou com resultado incerto',async()=>{
 let calls=0,writes=0;const state:Record<string,unknown>={};const persist=async()=>{writes++};const send=async()=>{calls++;return {key:{id:'receipt'}}};
 await sendOnce({id:'a'},{state,persist,send});await sendOnce({id:'a'},{state,persist,send});assert.equal(calls,1);assert.equal(writes,2);assert.deepEqual((state.a as any).status,'accepted');
 await sendOnce({id:'b'},{state,persist,send:async()=>{calls++;throw Error('timeout')}});await sendOnce({id:'b'},{state,persist,send});assert.equal(calls,2);assert.equal((state.b as any).status,'uncertain');
 await assert.rejects(()=>sendOnce({id:'c'},{state:{},persist:async()=>{throw Error('Disco cheio')},send}));assert.equal(calls,2);
});

test('Resumo diário respeita Brasília, horário escolhido, virada de mês e uma mensagem por dia',()=>{
 const config={enabled:true,dailyTime:'08:00'};
 assert.equal(dailyDue(config,{},new Date('2026-10-23T10:59:00Z')),false);
 assert.equal(dailyDue(config,{},new Date('2026-10-23T11:00:00Z')),true);
 assert.equal(dailyDue(config,{},new Date('2026-10-24T02:59:00Z')),true);
 assert.equal(dailyDue(config,{'daily:2026-10-23':{status:'accepted'}},new Date('2026-10-24T02:59:00Z')),false);
 assert.equal(dailyDue(config,{'daily:2026-10-23':{status:'uncertain'}},new Date('2026-10-23T20:00:00Z')),false);
 assert.equal(dailyDue({...config,dailyEnabled:false},{},new Date('2026-10-23T20:00:00Z')),false);
 assert.equal(dailyDue({...config,enabled:false},{},new Date('2026-10-23T20:00:00Z')),false);
 assert.equal(brasiliaDay(new Date('2027-01-01T02:59:00Z')).day,'2026-12-31');
 assert.equal(brasiliaDay(new Date('2027-01-01T02:59:00Z')).end,'2027-01-01T03:00:00.000Z');
 assert.equal(dailyConfig({dailyTime:'25:60'}).time,'08:00');
});
test('Resumo filtra datas, cancelamentos e registros privados; inclui eventos em andamento e limita o tamanho',()=>{
 const now=new Date('2026-10-23T11:00:00Z');const event=(id:string,starts_at:string,ends_at:string|null=null,status='published')=>({id,title:'Evento '+id,starts_at,ends_at,status,venue_name:'Local'});
 const rows=[event('ontem','2026-10-23T02:00:00Z'),event('meia-noite','2026-10-23T03:00:00Z'),event('hoje','2026-10-23T22:00:00Z'),event('amanha','2026-10-24T03:00:00Z'),event('continua','2026-10-23T02:00:00Z','2026-10-23T04:00:00Z'),event('encerrou','2026-10-23T02:00:00Z','2026-10-23T03:00:00Z'),event('cancelado','2026-10-23T22:00:00Z',null,'cancelled'),event('rascunho','2026-10-23T22:00:00Z',null,'draft'),{...event('lixeira','2026-10-23T22:00:00Z'),deleted_at:'2026-10-20T00:00:00Z'},{...event('inativa','2026-10-23T22:00:00Z'),categories:{active:false}}];
 assert.deepEqual(eventsForDay([...rows,rows[2]],now).map((e:any)=>e.id),['continua','meia-noite','hoje']);
 const msg=dailyMessage(rows,now);assert.ok(msg);assert.match(msg,/Em andamento/);assert.match(msg,/19:00/);assert.doesNotMatch(msg,/cancelado|amanha|rascunho/);assert.equal(dailyMessage([],now),null);
 const many=Array.from({length:50},(_,i)=>({...event(String(i),'2026-10-23T22:00:00Z'),title:'A'.repeat(200),venue_name:'B'.repeat(200)}));const summary=dailyMessage(many,now);assert.ok(summary);assert.ok(summary.length<3500);assert.match(summary,/35 outros eventos/);
 // No events at 8h does not consume the day's send slot; later publications can still produce the digest.
 assert.equal(dailyDue({enabled:true},{},now),true);
});
