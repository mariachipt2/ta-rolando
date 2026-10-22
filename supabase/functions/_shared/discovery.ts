// Shared by the authenticated Edge Function and the Next server. Never fetch user URLs.
export const DISCOVERY_SOURCE='https://socialyte.com.br/agenda/';
export type DiscoveredEvent={source_url:string;title:string;starts_at:string;ends_at:string|null;venue_name:string;address:string;neighborhood:string;city:string;state:string;organizer:string;ticket_url:string;is_free:boolean|null;price:string;age_rating:string;image_url:string;missing:string[]};
const norm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function plain(value:unknown):string {
 if(typeof value!=='string')return '';
 return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,code)=>{const n=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code);return n>0&&n<=0x10ffff?String.fromCodePoint(n):''}).replace(/&(amp|quot|apos|lt|gt|nbsp);/g,(_,key)=>(({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '} as Record<string,string>)[key]||'')).replace(/\s+/g,' ').trim();
}
export function https(value:unknown):string {try{if(typeof value!=='string'||value.length>2048)return '';const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}}
function date(value:unknown):string|null {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))return null;
 const fixed=value.replace(/([+-])(\d):(\d{2})$/,'$10$2:$3');
 if(!/(Z|[+-]\d{2}:\d{2})$/.test(fixed))return null;
 const stamp=Date.parse(fixed);return Number.isFinite(stamp)?new Date(stamp).toISOString():null;
}
export function parseDiscovery(html:string,now=new Date()) {
 const items:DiscoveredEvent[]=[],seen=new Set<string>();let parsed=0;
 const visit=(value:any,depth=0)=>{
  if(!value||typeof value!=='object'||depth>8)return;
  if(Array.isArray(value)){value.forEach(v=>visit(v,depth+1));return}
  const types=Array.isArray(value['@type'])?value['@type']:[value['@type']];
  if(types.includes('Event')||types.some((t:unknown)=>typeof t==='string'&&t.endsWith('Event'))){
   parsed++;
   const location=Array.isArray(value.location)?value.location[0]:value.location;
   if(!location||typeof location!=='object')return;
   const address=location.address||{};
   const venue=plain(location.name),city=plain(address.addressLocality);
   // Require an explicit city in the location, not a mention in promotional text.
   if(city?norm(city)!=='ipatinga':!/(?:^|\W)ipatinga(?:$|\W)/.test(norm(venue)))return;
   const start=date(value.startDate),end=date(value.endDate),url=https(value.url),title=plain(value.name).slice(0,160);
   if(!start||Date.parse(start)<now.getTime()||!title||!url||new URL(url).hostname!=='socialyte.com.br')return;
   const key=url+'|'+start;if(seen.has(key))return;seen.add(key);
   const offer=Array.isArray(value.offers)?value.offers[0]:value.offers;
   const amount=offer?.price!==undefined&&offer?.price!==''?Number(offer.price):NaN;
   const free=typeof value.isAccessibleForFree==='boolean'?value.isAccessibleForFree:Number.isFinite(amount)?amount===0:null;
   const street=plain(typeof address==='string'?address:address.streetAddress).slice(0,300);
   const organizer=plain((Array.isArray(value.organizer)?value.organizer[0]:value.organizer)?.name).slice(0,160);
   const image=Array.isArray(value.image)?value.image[0]:value.image;
   const item:DiscoveredEvent={source_url:url,title,starts_at:start,ends_at:end&&Date.parse(end)>Date.parse(start)?end:null,venue_name:venue.slice(0,160),address:street,neighborhood:'',city:'Ipatinga',state:'MG',organizer,ticket_url:https(offer?.url),is_free:free,price:Number.isFinite(amount)&&amount>0&&offer?.priceCurrency==='BRL'?'R$ '+amount.toLocaleString('pt-BR',{minimumFractionDigits:2}):'',age_rating:plain(value.typicalAgeRange).slice(0,40),image_url:https(typeof image==='object'?image?.url:image),missing:[]};
   item.missing=[...(!street?['Endereço']:[]),'Bairro',...(!organizer?['Organizador']:[]),...(free===null?['Pago ou gratuito']:[]),...(!item.age_rating?['Classificação etária']:[]),'Adequação para crianças','Categoria','Foto (conferir autorização de uso)','Instagram'];
   items.push(item);
  }
  if(value['@graph'])visit(value['@graph'],depth+1);
 };
 for(const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{visit(JSON.parse(match[1]))}catch{}}
 if(!parsed)throw Error('A fonte mudou de formato ou não forneceu dados legíveis. Tente novamente mais tarde.');
 return items.sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).slice(0,100);
}
export async function discoverEvents() {
 const response=await fetch(DISCOVERY_SOURCE,{headers:{Accept:'text/html'},redirect:'error',signal:AbortSignal.timeout(18000)});
 if(!response.ok)throw Error('A agenda consultada está indisponível. Tente novamente mais tarde.');
 const reader=response.body?.getReader();if(!reader)throw Error('A fonte retornou uma resposta vazia.');
 const decoder=new TextDecoder();let html='',size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4_000_000)throw Error('A resposta da fonte excedeu o limite.');html+=decoder.decode(value,{stream:true})}html+=decoder.decode()}finally{await reader.cancel()}
 return {items:parseDiscovery(html),searched_at:new Date().toISOString(),source:DISCOVERY_SOURCE,coverage:'Eventos futuros de Ipatinga presentes na agenda Socialyte consultada. Cobertura parcial; ausência de resultados não significa ausência de eventos. Datas, preços e detalhes precisam de conferência na fonte.'};
}
export function discoveryDuplicate<T extends {title:string;starts_at:string;ticket_url?:string;additional_info?:string;deleted_at?:string|null}>(item:DiscoveredEvent,events:T[]) {
 return events.find(e=>(e.additional_info?.includes(item.source_url)&&Date.parse(e.starts_at)===Date.parse(item.starts_at))||(item.ticket_url&&e.ticket_url===item.ticket_url&&Date.parse(e.starts_at)===Date.parse(item.starts_at))||(norm(e.title).replace(/[^a-z0-9]/g,'')===norm(item.title).replace(/[^a-z0-9]/g,'')&&Math.abs(Date.parse(e.starts_at)-Date.parse(item.starts_at))<6*3600_000));
}


