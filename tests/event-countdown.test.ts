import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eventCountdown} from '../src/lib/event-countdown';
test('Contagem separa dias, horas, minutos e segundos e vira cada unidade sem negativos',()=>{
  const start='2026-10-31T22:00:00Z',target=Date.parse(start);
  assert.deepEqual(eventCountdown(start,target-(2*86400+3*3600+4*60+5)*1000),{days:2,hours:3,minutes:4,seconds:5,started:false});
  assert.deepEqual(eventCountdown(start,target-86400000),{days:1,hours:0,minutes:0,seconds:0,started:false});
  assert.deepEqual(eventCountdown(start,target-86399000),{days:0,hours:23,minutes:59,seconds:59,started:false});
  assert.equal(eventCountdown(start,target-1)?.seconds,1);
  assert.deepEqual(eventCountdown(start,target),{days:0,hours:0,minutes:0,seconds:0,started:true});
  assert.deepEqual(eventCountdown(start,target+10000),{days:0,hours:0,minutes:0,seconds:0,started:true});
});
test('Instantes equivalentes em Brasília e UTC têm a mesma contagem; datas inválidas não viram NaN na tela',()=>{
  const now=Date.parse('2026-10-30T22:00:00Z');
  assert.deepEqual(eventCountdown('2026-10-31T19:00:00-03:00',now),eventCountdown('2026-10-31T22:00:00Z',now));
  assert.equal(eventCountdown('inválido',now),null);assert.equal(eventCountdown('2026-10-31T22:00:00Z',NaN),null);
});
