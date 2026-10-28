import {test} from 'node:test';
import assert from 'node:assert/strict';
import {storyPages,storyHome,STORY_WIDTH,STORY_HEIGHT} from '../src/lib/program-story';
import {programLink,sharedIds} from '../src/lib/event-selection';
import type {Event} from '../src/lib/types';
const event=(i:number)=>({id:`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,title:`Evento ${i}`,starts_at:`2030-01-${String(i).padStart(2,'0')}T20:00:00Z`} as Event);
test('Stories dividem a seleção completa em até três eventos por imagem, sem perder ou repetir eventos',()=>{
  const selected=Array.from({length:20},(_,i)=>event(20-i)),pages=storyPages([...selected,event(1)]);
  assert.equal(pages.length,7);assert.ok(pages.every(p=>p.length<=3));assert.equal(pages.at(-1)!.length,2);
  assert.deepEqual(pages.flat().map(e=>e.id),[...selected].reverse().map(e=>e.id));
  assert.equal(selected[0].id,event(20).id);
  assert.equal(storyPages([event(1),{...event(2),deleted_at:'2029-01-01'}]).flat().length,1);
  assert.throws(()=>storyPages([]));assert.throws(()=>storyPages(Array.from({length:21},(_,i)=>event(i+1))));
  assert.equal(STORY_WIDTH,1080);assert.equal(STORY_HEIGHT,1920);
});
test('QR usa o link compartilhado da seleção completa; endereço visível preserva GitHub Pages e domínio próprio',()=>{
  const ids=[event(1).id,event(2).id,event(3).id,event(4).id];
  const link=programLink('https://mariachipt2.github.io/ta-rolando/#/programacao',ids,'Meus rolês do fim de semana');
  const params=new URLSearchParams(new URL(link).hash.split('?')[1]);
  assert.deepEqual(sharedIds(params.get('eventos')),ids);assert.equal(params.get('titulo'),'Meus rolês do fim de semana');
  assert.equal(storyHome(link),'mariachipt2.github.io/ta-rolando');
  assert.equal(storyHome(programLink('https://example.com/programacao',ids,'Meus rolês')),'example.com');
});
