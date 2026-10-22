import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDiscovery,discoveryDuplicate,https,plain} from '../supabase/functions/_shared/discovery';
const raw={ '@type':'Event',name:'Show &amp; Música',url:'https://socialyte.com.br/eventos/show/',startDate:'2030-11-01T20:30-3:00',endDate:'2030-11-01T22:00-3:00',location:[{name:'Teatro - Ipatinga',address:{streetAddress:'Rua Um, 12'}}]};
const html=(value:unknown)=>`<script type="application/ld+json">${JSON.stringify(value)}</script>`;
const now=new Date('2030-10-22T12:00:00Z');
test('Busca extrai dados de Ipatinga e corrige offset da fonte sem inventar preço, bairro ou crianças',()=>{
 const [item]=parseDiscovery(html(raw),now);assert.equal(item.title,'Show & Música');assert.equal(item.starts_at,'2030-11-01T23:30:00.000Z');assert.equal(item.is_free,null);assert.equal(item.neighborhood,'');assert.equal(item.organizer,'');assert.ok(item.missing.includes('Pago ou gratuito'));assert.equal(item.address,'Rua Um, 12');
});
test('Busca ignora outras cidades, datas passadas, URLs inseguras e duplicados, preservando sessões distintas',()=>{
 const values=[raw,raw,{...raw,startDate:'2030-11-02T20:30-3:00'}, {...raw,location:[{name:'Teatro - Timóteo'}]}, {...raw,startDate:'2020-11-01T20:30-3:00'}, {...raw,url:'javascript:alert(1)'},{...raw,location:[{name:'Teatro - Ipatinga',address:{addressLocality:'Timóteo'}}]}];
 assert.equal(parseDiscovery(html({'@graph':values}),now).length,2);
});
test('Entrada usa somente informação explícita e dados de terceiros nunca viram HTML executável',()=>{
 const [item]=parseDiscovery(html({...raw,isAccessibleForFree:false,offers:{price:'20',priceCurrency:'BRL',url:'javascript:alert(1)'},image:'http://inseguro.test/x'}),now);
 assert.equal(item.is_free,false);assert.equal(item.price,'R$ 20,00');assert.equal(item.image_url,'');assert.equal(item.ticket_url,'');assert.equal(https('https://user:pass@site.test/'),'');assert.equal(plain('<script>alert(1)</script><b>Texto</b>'),'Texto');
});
test('Duplicidade reconhece origem e título/data, incluindo cadastro na lixeira; não bloqueia outra data',()=>{
 const [item]=parseDiscovery(html(raw),now);
 assert.ok(discoveryDuplicate(item,[{title:'Outro',starts_at:item.starts_at,additional_info:'Fonte da busca: '+item.source_url,deleted_at:'2030-01-01'}]));
 assert.ok(discoveryDuplicate(item,[{title:item.title.toUpperCase(),starts_at:item.starts_at}]));
 assert.equal(discoveryDuplicate(item,[{title:item.title,starts_at:'2031-01-01T12:00:00Z'}]),undefined);
 assert.throws(()=>parseDiscovery('<html>Indisponível</html>',now),/formato/);
});

test('Cadastro duplicado mantém ID e status para reabrir o rascunho, sem criar outra cópia',()=>{
 const [item]=parseDiscovery(html(raw),now);
 const existing={id:'draft-id',status:'draft',title:item.title,starts_at:item.starts_at};
 const found=discoveryDuplicate(item,[existing]);
 assert.equal(found?.id,'draft-id');assert.equal(found?.status,'draft');assert.equal(found,existing);
});
