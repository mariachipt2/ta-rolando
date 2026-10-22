// Shared by the authenticated Edge Function and the Next server. Only known public pages are fetched.
export const DISCOVERY_SOURCES={socialyte:{label:'Socialyte',url:'https://socialyte.com.br/agenda/'},pystta:{label:'Pystta',url:'https://www.pystta.com/eventos-em/mg/ipatinga'},lhever:{label:'Lhever',url:'https://lhever.com/eventos/ipatinga-mg'}} as const;
export type DiscoverySource=keyof typeof DISCOVERY_SOURCES;
export const DISCOVERY_SOURCE=DISCOVERY_SOURCES.socialyte.url;
export function discoverySource(value:unknown):DiscoverySource {if(value===undefined)return 'socialyte';if(typeof value==='string'&&Object.hasOwn(DISCOVERY_SOURCES,value))return value as DiscoverySource;throw Error('Escolha Socialyte, Pystta ou Lhever.');}
export type DiscoveredEvent={source?:DiscoverySource;source_url:string;title:string;starts_at:string;ends_at:string|null;venue_name:string;address:string;neighborhood:string;city:string;state:string;organizer:string;ticket_url:string;is_free:boolean|null;price:string;age_rating:string;image_url:string;missing:string[]};
const norm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function plain(value:unknown):string {
 if(typeof value!=='string')return '';
 return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,code)=>{const n=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code);return n>0&&n<=0x10ffff?String.fromCodePoint(n):''}).replace(/&(amp|quot|apos|lt|gt|nbsp);/g,(_,key)=>(({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '} as Record<string,string>)[key]||'')).replace(/\s+/g,' ').trim();
}
export function https(value:unknown):string {try{if(typeof value!=='string'||value.length>2048)return '';const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}}
export function isDiscoveryUrl(value:string,source?:DiscoverySource):boolean {
 const safe=https(value);if(!safe)return false;const u=new URL(safe);if(u.port)return false;
 const match=u.hostname==='socialyte.com.br'&&u.pathname.startsWith('/eventos/')?'socialyte':u.hostname==='www.pystta.com'&&u.pathname.startsWith('/evento/')?'pystta':u.hostname==='lhever.com'&&(/^\/eventos\/ipatinga-mg\/.+/.test(u.pathname)||/^\/c\/[a-f0-9-]{36}$/.test(u.pathname))?'lhever':null;
 return !!match&&(!source||source===match);
}
function date(value:unknown):string|null {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))return null;
 const fixed=value.replace(/([+-])(\d):(\d{2})$/,'$10$2:$3');
 if(!/(Z|[+-]\d{2}:\d{2})$/.test(fixed))return null;
 const stamp=Date.parse(fixed);return Number.isFinite(stamp)?new Date(stamp).toISOString():null;
}
function schemas(html:string):any[] {const out:any[]=[];for(const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const visit=(v:any,depth=0)=>{if(!v||typeof v!=='object'||depth>8)return;if(Array.isArray(v)){v.forEach(x=>visit(x,depth+1));return}out.push(v);if(v['@graph'])visit(v['@graph'],depth+1)};visit(JSON.parse(m[1]))}catch{}}return out}
export function parseDiscovery(html:string,now=new Date(),source:DiscoverySource='socialyte',pageUrl?:string) {
 const items:DiscoveredEvent[]=[],seen=new Set<string>();let parsed=0;
 for(const value of schemas(html)){
  const types=Array.isArray(value['@type'])?value['@type']:[value['@type']];
  if(!types.some((t:unknown)=>typeof t==='string'&&t.endsWith('Event')))continue;
  parsed++;
  const location=Array.isArray(value.location)?value.location[0]:value.location;
  if(!location||typeof location!=='object')continue;
  const address=location.address||{},venue=plain(location.name),city=plain(address.addressLocality);
  if(city?norm(city)!=='ipatinga':!/(?:^|\W)ipatinga(?:$|\W)/.test(norm(venue)))continue;
  const start=date(value.startDate),end=date(value.endDate),schemaUrl=https(value.url),url=isDiscoveryUrl(schemaUrl,source)?schemaUrl:pageUrl&&isDiscoveryUrl(pageUrl,source)?https(pageUrl):'',title=plain(value.name).slice(0,160);
  if(!start||Date.parse(start)<now.getTime()||!title||!isDiscoveryUrl(url,source))continue;
  const key=url+'|'+start;if(seen.has(key))continue;seen.add(key);
  const offer=Array.isArray(value.offers)?value.offers[0]:value.offers;
  const amount=offer?.price!==undefined&&offer?.price!==null&&String(offer.price).trim()!==''?Number(offer.price):NaN;
  const validAmount=Number.isFinite(amount)&&amount>=0;
  const free=typeof value.isAccessibleForFree==='boolean'?value.isAccessibleForFree:validAmount?amount===0:null;
  const street=plain(typeof address==='string'?address:address.streetAddress).slice(0,300);
  const organizer=plain((Array.isArray(value.organizer)?value.organizer[0]:value.organizer)?.name).slice(0,160);
  const image=Array.isArray(value.image)?value.image[0]:value.image;
  const item:DiscoveredEvent={source,source_url:url,title,starts_at:start,ends_at:end&&Date.parse(end)>Date.parse(start)?end:null,venue_name:venue.slice(0,160),address:street,neighborhood:'',city:'Ipatinga',state:'MG',organizer,ticket_url:https(offer?.url)||(source!=='socialyte'&&!isDiscoveryUrl(schemaUrl)?schemaUrl:''),is_free:free,price:validAmount&&amount>0&&offer?.priceCurrency==='BRL'?'R$ '+amount.toLocaleString('pt-BR',{minimumFractionDigits:2}):'',age_rating:plain(value.typicalAgeRange).slice(0,40),image_url:https(typeof image==='object'?image?.url:image),missing:[]};
  item.missing=[...(!street?['Endereço']:[]),'Bairro',...(!organizer?['Organizador']:[]),...(free===null?['Pago ou gratuito']:[]),...(!item.age_rating?['Classificação etária']:[]),'Adequação para crianças','Categoria','Foto (conferir autorização de uso)','Instagram'];
  items.push(item);
 }
 if(!parsed)throw Error('A fonte mudou de formato ou não forneceu dados legíveis. Tente novamente mais tarde.');
 return items.sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).slice(0,100);
}
export function discoveryList(html:string,source:DiscoverySource) {
 const list=schemas(html).filter(v=>v['@type']==='ItemList');if(!list.length)throw Error('A lista da fonte mudou de formato.');
 return [...new Set(list.flatMap(v=>Array.isArray(v.itemListElement)?v.itemListElement:[]).map((v:any)=>https(v.item?.url||v.url||(typeof v.item==='string'?v.item:''))).filter(url=>isDiscoveryUrl(url,source)))];
}
export function discoveryNext(html:string,source:DiscoverySource):string|null {
 if(source!=='lhever')return null;
 for(const match of html.matchAll(/<a\b[^>]*>/gi)){
  if(!/\brel\s*=\s*["'][^"']*\bnext\b/i.test(match[0]))continue;
  const href=match[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];if(!href)continue;
  try{const u=new URL(href,DISCOVERY_SOURCES.lhever.url);if(u.origin==='https://lhever.com'&&/^\/eventos\/ipatinga-mg\/pagina\/\d+$/.test(u.pathname)&&!u.search)return u.href}catch{}
 }
 return null;
}
function allowedPage(url:string,source:DiscoverySource) {if(url===DISCOVERY_SOURCES[source].url||isDiscoveryUrl(url,source))return true;return source==='lhever'&&/^https:\/\/lhever[.]com\/eventos\/ipatinga-mg\/pagina\/\d+$/.test(url)}
async function readPage(url:string,source:DiscoverySource,fetcher:typeof fetch,signal:AbortSignal):Promise<string> {
 for(let redirects=0;redirects<3;redirects++){
  if(!allowedPage(url,source))throw Error('Endereço da fonte não permitido.');
  const response=await fetcher(url,{headers:{Accept:'text/html'},redirect:'manual',signal:AbortSignal.any([signal,AbortSignal.timeout(8000)])});
  if(response.status>=300&&response.status<400){const location=response.headers.get('location');await response.body?.cancel();if(!location)throw Error('Redirecionamento inválido.');url=new URL(location,url).href;continue}
  if(!response.ok)throw Error('A fonte está indisponível.');
  const reader=response.body?.getReader();if(!reader)throw Error('Resposta vazia.');
  const decoder=new TextDecoder();let html='',size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4_000_000)throw Error('A resposta da fonte excedeu o limite.');html+=decoder.decode(value,{stream:true})}return html+decoder.decode()}finally{await reader.cancel()}
 }
 throw Error('Muitos redirecionamentos.');
}
export type DiscoveryResult={items:DiscoveredEvent[];searched_at:string;source:string;source_id:DiscoverySource;source_label:string;coverage:string;warnings:string[];cached?:boolean};
const cache=new Map<DiscoverySource,{expires:number;data:DiscoveryResult}>();
export async function discoverEvents(source:DiscoverySource='socialyte',options?:{fetcher?:typeof fetch;now?:Date}):Promise<DiscoveryResult> {
 source=discoverySource(source);
 const cached=cache.get(source);if(!options&&cached&&cached.expires>Date.now())return {...cached.data,cached:true};
 const fetcher=options?.fetcher||fetch,now=options?.now||new Date(),signal=AbortSignal.timeout(45000),warnings:string[]=[];
 const first=await readPage(DISCOVERY_SOURCES[source].url,source,fetcher,signal);
 let items:DiscoveredEvent[]=[];
 if(source==='socialyte')items=parseDiscovery(first,now,source);
 else {
  const urls=discoveryList(first,source),visited=new Set([DISCOVERY_SOURCES[source].url as string]);let next=discoveryNext(first,source),pages=1;
  while(next&&pages<5&&!visited.has(next)&&urls.length<100){visited.add(next);try{const html=await readPage(next,source,fetcher,signal);urls.push(...discoveryList(html,source));next=discoveryNext(html,source);pages++}catch{warnings.push('Não foi possível consultar todas as páginas da fonte.');break}}
  if(next&&!visited.has(next))warnings.push('Há mais páginas na fonte; esta consulta foi limitada.');
  const unique=[...new Set(urls)],queue=unique.slice(0,60);if(unique.length>queue.length)warnings.push('Consulta limitada a 60 páginas de eventos.');
  let cursor=0,failures=0;
  await Promise.all(Array.from({length:4},async()=>{for(;;){const index=cursor++;if(index>=queue.length)return;try{const html=await readPage(queue[index],source,fetcher,signal);items.push(...parseDiscovery(html,now,source,queue[index]))}catch{failures++}}}));
  if(failures)warnings.push(`${failures} páginas de eventos não puderam ser lidas; os resultados estão parciais.`);
  if(queue.length&&failures===queue.length)throw Error('Não foi possível ler os detalhes dos eventos. Tente novamente mais tarde.');
 }
 const seen=new Set<string>();items=items.filter(e=>{const key=e.source_url+'|'+e.starts_at;if(seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).slice(0,100);
 const data:DiscoveryResult={items,searched_at:new Date().toISOString(),source:DISCOVERY_SOURCES[source].url,source_id:source,source_label:DISCOVERY_SOURCES[source].label,warnings,coverage:`Eventos futuros de Ipatinga encontrados em ${DISCOVERY_SOURCES[source].label}. Cobertura parcial; confira informações, produtos e inscrições na fonte antes de cadastrar.`};
 if(!options)cache.set(source,{expires:Date.now()+(warnings.length?60_000:600_000),data});
 return data;
}
function ticketIdentity(value:string|undefined){try{const u=new URL(value||'');if(u.hostname==='bileto.sympla.com.br'){const m=u.pathname.match(/^\/event\/(\d+)/);if(m)return 'bileto:'+m[1]}if(u.hostname==='www.sympla.com.br'||u.hostname==='sympla.com.br'){const m=u.pathname.match(/\/(\d+)\/?$/);if(m)return 'sympla:'+m[1]}u.hash='';u.search='';return u.href}catch{return ''}}
export function discoveryDuplicate<T extends {title:string;starts_at:string;ticket_url?:string;additional_info?:string;deleted_at?:string|null}>(item:DiscoveredEvent,events:T[]) {
 return events.find(e=>(e.additional_info?.includes(item.source_url)&&Date.parse(e.starts_at)===Date.parse(item.starts_at))||(item.ticket_url&&ticketIdentity(e.ticket_url)===ticketIdentity(item.ticket_url)&&Date.parse(e.starts_at)===Date.parse(item.starts_at))||(norm(e.title).replace(/[^a-z0-9]/g,'')===norm(item.title).replace(/[^a-z0-9]/g,'')&&Math.abs(Date.parse(e.starts_at)-Date.parse(item.starts_at))<6*3600_000));
}
