import type {Event} from './types';
import {upcoming} from './dates';
import {clockNow} from './site-clock';

const count=(value:unknown)=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
export function recentActivity(event:Event){
  return count(event.recent_views)+count(event.recent_ticket_clicks);
}
export function trendingEvents(events:Event[],now=new Date(clockNow())){
  return events.filter(event=>!event.sold_out&&!event.deleted_at&&event.categories?.active!==false&&upcoming(event,now)
    &&(event.status==='published'||(event.status==='scheduled'&&!!event.publish_at&&Date.parse(event.publish_at)<=+now))
    &&recentActivity(event)>0)
    .sort((a,b)=>recentActivity(b)-recentActivity(a)
      ||count(b.recent_ticket_clicks)-count(a.recent_ticket_clicks)
      ||Date.parse(a.starts_at)-Date.parse(b.starts_at)||a.id.localeCompare(b.id));
}
