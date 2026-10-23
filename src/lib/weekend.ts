import {clockNow} from './site-clock';
import type {Event} from './types';
import {day,toISO} from './dates';
export function shiftDay(date:string,n:number){return new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10)}
export function weekendStart(now=new Date(clockNow())){const date=day(now),weekday=new Date(date+'T12:00:00Z').getUTCDay();return shiftDay(date,weekday===0?-2:5-weekday)}
export function validWeekendStart(value?:string|null){if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value&&date.getUTCDay()===5}
export function weekendEvents(events:Event[],start:string,now=new Date(clockNow())){const low=Date.parse(toISO(start+'T00:00')),high=Date.parse(toISO(shiftDay(start,3)+'T00:00'));return events.filter(e=>!e.deleted_at&&(e.status==='published'||(e.status==='scheduled'&&!!e.publish_at&&Date.parse(e.publish_at)<=now.getTime()))&&Date.parse(e.starts_at)<high&&(e.ends_at?Date.parse(e.ends_at)>low:Date.parse(e.starts_at)>=low)).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)||a.id.localeCompare(b.id))}
export function weekendUrl(current:string,start:string){const url=new URL(current);if(url.hash.startsWith('#/')){url.search='';url.hash='/fim-de-semana?inicio='+start}else{url.search='?inicio='+start;url.hash=''}return url.href}
