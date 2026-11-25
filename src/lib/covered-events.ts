import type {Event} from './types';
import {agendaSelection} from './daily-agenda';
import {inPeriod} from './dates';
export function coveredEvents(events:Event[],now:Date,period='all',entry='all',query='') {
 const normalized=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const needle=normalized(query.trim());
 return agendaSelection(events,'',now,'all').events.filter(event=>
  event.environment==='coberto' &&
  (period==='all'||inPeriod(event.starts_at,event.ends_at,period,now)) &&
  (entry==='all'||event.is_free===(entry==='free')) &&
  (!needle||normalized([event.title,event.venue_name,event.neighborhood].join(' ')).includes(needle))
 );
}
