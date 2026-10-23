import {test} from 'node:test';import assert from 'node:assert/strict';
import {ownNumber,messageFor,pendingNotices,sendOnce} from '../scripts/whatsapp-local/core.mjs';
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
