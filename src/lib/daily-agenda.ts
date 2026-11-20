import type {Event} from './types';
import {day,inPeriod,upcoming} from './dates';
export type AgendaMode='day'|'weekend'|'all';
export function agendaSelection(events:Event[],chosen:string,now:Date,mode:AgendaMode){
  const available=events.filter(event=>!event.deleted_at&&event.categories?.active!==false&&(event.status==='published'||(event.status==='scheduled'&&!!event.publish_at&&Date.parse(event.publish_at)<=+now))&&upcoming(event,now))
    .sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)||a.id.localeCompare(b.id));
  const today=day(now);
  const forDay=(key:string)=>available.filter(event=>day(event.starts_at)<=key&&day(event.ends_at||event.starts_at)>=key);
  const date=/^\d{4}-\d{2}-\d{2}$/.test(chosen)?chosen:forDay(today).length?today:available[0]?day(available[0].starts_at):today;
  return {date,events:mode==='all'?available:mode==='weekend'?available.filter(event=>inPeriod(event.starts_at,event.ends_at,'weekend',now)):forDay(date)};
}
