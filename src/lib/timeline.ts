import type {Event} from './types';
import {day,upcoming} from './dates';
export type TimelinePeriod='upcoming'|'past'|'all';
export function shiftMonth(month:string,offset:number) {
  const [year,value]=month.split('-').map(Number);
  const date=new Date(Date.UTC(year,value-1+offset,1));
  return date.toISOString().slice(0,7);
}
export function timelineMonths(events:Event[]) {
  const counts=new Map<string,number>();
  for(const event of events.filter(e=>!e.deleted_at)) {
    const month=day(event.starts_at).slice(0,7);
    counts.set(month,(counts.get(month)||0)+1);
  }
  return [...counts].sort(([a],[b])=>a.localeCompare(b)).map(([month,count])=>({month,count}));
}
export function timelineGroups(events:Event[],period:TimelinePeriod,now=new Date()) {
  const sorted=events.filter(e=>!e.deleted_at&&(period==='all'||(period==='upcoming'?upcoming(e,now):!upcoming(e,now)))).sort((a,b)=>(period==='past'?-1:1)*(Date.parse(a.starts_at)-Date.parse(b.starts_at))||a.id.localeCompare(b.id));
  const groups=new Map<string,Event[]>();
  for(const event of sorted){const date=day(event.starts_at);if(!groups.has(date))groups.set(date,[]);groups.get(date)!.push(event)}
  return Array.from(groups,([date,events])=>({date,events}));
}
