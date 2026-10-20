import type {Event} from './types';
import {upcoming} from './dates';
export function forChildren(event:Event){return event.family_friendly===true}
export function similarEvents(event:Event,events:Event[],now=new Date()){
 return events.filter(e=>e.id!==event.id&&e.category_id===event.category_id&&!e.deleted_at&&e.status!=='cancelled'&&upcoming(e,now)&&(e.status==='published'||(e.status==='scheduled'&&!!e.publish_at&&Date.parse(e.publish_at)<=now.getTime()))).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)||a.id.localeCompare(b.id)).slice(0,3);
}
export type EventIssue={type:'photo'|'address';label:string};
export function eventIssues(e:Event):EventIssue[]{
 const issues:EventIssue[]=[];
 if(!e.cover_url?.trim()&&!e.gallery?.some(url=>url.trim()))issues.push({type:'photo',label:'Sem foto'});
 const missing:string[]=[];
 if(!e.venue_name?.trim())missing.push('nome do local');
 if(!e.address?.trim()||e.address.trim().length<5)missing.push('rua ou referência');
 if(!e.neighborhood?.trim())missing.push('bairro');
 if(!e.city?.trim())missing.push('cidade');
 if(!/^[A-Za-z]{2}$/.test(e.state||''))missing.push('UF');
 if(missing.length)issues.push({type:'address',label:'Endereço: revisar '+missing.join(', ')});
 else if(!/\d|s\s*\/\s*n\b|sem n[úu]mero/i.test(e.address))issues.push({type:'address',label:'Endereço: confirmar número ou indicar s/n'});
 return issues;
}
