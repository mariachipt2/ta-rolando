import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDiscovery,discoveryList,discoveryNext,discoverySource,isDiscoveryUrl,discoverEvents,discoveryDuplicate} from '../supabase/functions/_shared/discovery';
const now=new Date('2030-10-22T12:00:00Z');
const html=(value:unknown)=>`<script type="application/ld+json">${JSON.stringify(value)}</script>`;
const event=(url:string,extra:Record<string,unknown>={})=>({'@type':'Event',name:'Show em Ipatinga',url,startDate:'2030-11-01T20:00:00-03:00',location:{name:'Teatro',address:{addressLocality:'Ipatinga',addressRegion:'MG'}},...extra});
const list=(urls:string[])=>html([{'@type':'ItemList',itemListElement:urls.map(url=>({'@type':'ListItem',item:{url}}))}]);
test('Novas fontes leem Event e ItemList sem inventar endereço nem gratuidade ausentes',()=>{
 const p='https://www.pystta.com/evento/show',l='https://lhever.com/eventos/ipatinga-mg/show';
 const [pystta]=parseDiscovery(html(event(p,{offers:{price:'0',priceCurrency:'BRL',url:'https://www.sympla.com.br/evento/show/123'}})),now,'pystta');
 assert.equal(pystta.source,'pystta');assert.equal(pystta.address,'');assert.equal(pystta.is_free,true);assert.ok(pystta.missing.includes('Endereço'));
 const [lhever]=parseDiscovery(html(event(l,{offers:{url:'https://bileto.sympla.com.br/event/123'}})),now,'lhever');assert.equal(lhever.is_free,null);assert.equal(lhever.organizer,'');
 assert.deepEqual(discoveryList(list([p,p,'https://evil.test/evento/x','https://www.pystta.com/ir/x']),'pystta'),[p]);
 assert.equal(discoveryNext('<a href="/eventos/ipatinga-mg/pagina/2" rel="next">Próximo</a>','lhever'),'https://lhever.com/eventos/ipatinga-mg/pagina/2');
 assert.equal(discoveryNext('<a href="https://evil.test/eventos/ipatinga-mg/pagina/2" rel="next">Próximo</a>','lhever'),null);
});
test('Seleção e URLs impedem acesso a APIs internas, outros hosts e credenciais',()=>{
 for(const url of ['https://www.pystta.com/api/x','https://www.pystta.com/ir/x','https://lhever.com/__','https://lhever.com.evil.test/eventos/ipatinga-mg/x','https://user:pass@lhever.com/eventos/ipatinga-mg/x','http://www.pystta.com/evento/x'])assert.equal(isDiscoveryUrl(url),false);
 assert.equal(discoverySource(undefined),'socialyte');assert.throws(()=>discoverySource('https://evil.test'));assert.throws(()=>discoverySource('__proto__'));
});
test('Consulta percorre paginação Lhever e preserva resultados quando um detalhe falha',async()=>{
 const a='https://lhever.com/eventos/ipatinga-mg/a',b='https://lhever.com/eventos/ipatinga-mg/b';const fetched:string[]=[];
 const fetcher=(async(input:RequestInfo|URL)=>{const url=String(input);fetched.push(url);if(url==='https://lhever.com/eventos/ipatinga-mg')return new Response(list([a])+'<a href="/eventos/ipatinga-mg/pagina/2" rel="next">Próximo</a>');if(url.endsWith('/pagina/2'))return new Response(list([b]));if(url===a)return new Response(html(event(a)));return new Response('Erro',{status:503})}) as typeof fetch;
 const result=await discoverEvents('lhever',{now,fetcher});assert.equal(result.items.length,1);assert.equal(result.source_label,'Lhever');assert.match(result.warnings[0],/parciais/);assert.ok(fetched.some(url=>url.endsWith('/pagina/2')));
});
test('Redirecionamento externo nunca é seguido e falha total não vira lista vazia',async()=>{
 const p='https://www.pystta.com/evento/show';const fetched:string[]=[];
 const fetcher=(async(input:RequestInfo|URL)=>{const url=String(input);fetched.push(url);return url===p?new Response(null,{status:302,headers:{Location:'http://127.0.0.1/private'}}):new Response(list([p]))}) as typeof fetch;
 await assert.rejects(()=>discoverEvents('pystta',{now,fetcher}),/detalhes/);assert.equal(fetched.length,2);
});
test('Mesmo ingresso em fontes diferentes reconhece sessão cadastrada sem confundir outra data',()=>{
 const [item]=parseDiscovery(html(event('https://lhever.com/eventos/ipatinga-mg/show',{offers:{url:'https://bileto.sympla.com.br/event/123'}})),now,'lhever');
 const existing={title:'Outro título',starts_at:item.starts_at,ticket_url:'https://bileto.sympla.com.br/event/123/d/456?utm_source=x'};
 assert.equal(discoveryDuplicate(item,[existing]),existing);assert.equal(discoveryDuplicate(item,[{...existing,starts_at:'2030-11-02T23:00:00Z'}]),undefined);
});

test('Pystta pode identificar o evento pelo link Sympla; a origem permanece na página Pystta consultada',()=>{
 const source='https://www.pystta.com/evento/show',ticket='https://www.sympla.com.br/evento/show/123';
 const [item]=parseDiscovery(html(event(ticket,{offers:{price:'15',priceCurrency:'BRL',url:ticket}})),now,'pystta',source);
 assert.equal(item.source_url,source);assert.equal(item.ticket_url,ticket);assert.equal(item.is_free,false);
});
