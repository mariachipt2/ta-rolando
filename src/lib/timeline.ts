import type {Event} from './types';
import {day,upcoming} from './dates';
export type TimelinePeriod='upcoming'|'past'|'all';
export function timelineGroups(events:Event[],period:TimelinePeriod,now=new Date()) {
  const sorted=events.filter(e=>!e.deleted_at&&(period==='all'||(period==='upcoming'?upcoming(e,now):!upcoming(e,now)))).sort((a,b)=>(period==='past'?-1:1)*(Date.parse(a.starts_at)-Date.parse(b.starts_at))||a.id.localeCompare(b.id));
  const groups=new Map<string,Event[]>();
  for(const event of sorted){const date=day(event.starts_at);if(!groups.has(date))groups.set(date,[]);groups.get(date)!.push(event)}
  return Array.from(groups,([date,events])=>({date,events}));
}
