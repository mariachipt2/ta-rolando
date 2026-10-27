import type {Event} from './types';
import {organizerDirectory, organizerName} from './organizers';

export function organizerPresets(events:Event[]) {
  // Use the latest saved record, rather than the date on which its event occurs.
  const sorted=[...events].sort((a,b)=>
    (Date.parse(b.updated_at||b.created_at)||0)-(Date.parse(a.updated_at||a.created_at)||0));
  return organizerDirectory(sorted).map(({organizer,events})=>{
    const seen=new Set<string>();
    const locations=events.filter(event=>{
      const key=JSON.stringify([event.venue_name,event.address,event.neighborhood,event.city,event.state].map(value=>organizerName(value||'')));
      if(seen.has(key))return false;
      seen.add(key);return true;
    });
    return {organizer,locations};
  });
}

export function organizerEvent(event:Event, instagram:string) {
  return {
    organizer:event.organizer.trim(),
    instagram_url:event.instagram_url?.trim()||instagram,
    venue_name:event.venue_name||'',
    address:event.address||'',
    neighborhood:event.neighborhood||'',
    city:event.city||'',
    state:event.state||'',
  };
}
