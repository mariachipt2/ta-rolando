import type {Event} from './types';
import type {Venue} from './venues';
import {baseVenues,findBaseVenue,venueKey,type Environment} from '../../supabase/functions/_shared/venue-directory';
export {baseVenues,findBaseVenue,venueKey,environmentLabels,type Environment} from '../../supabase/functions/_shared/venue-directory';
export type VenueOption={name:string;neighborhood:string;environment:Environment|null;city:string;state:string;address?:string;organizer?:string;instagram_url?:string;aliases:string[]};
export function venueOptions(saved:Venue[]=[],events:Event[]=[]):VenueOption[]{
 const options=new Map<string,VenueOption>();
 const key=(name:string,city:string)=>venueKey(name)+'|'+venueKey(city);
 for(const p of baseVenues)options.set(key(p.nome,'Ipatinga'),{name:p.nome,neighborhood:p.bairro,environment:p.ambiente,city:'Ipatinga',state:'MG',aliases:p.aliases});
 const groups=new Map<string,Event[]>();
 for(const event of events.filter(e=>!e.deleted_at&&e.venue_name)){
  const p=venueKey(event.city)==='ipatinga'?findBaseVenue(event.venue_name):undefined;
  const k=key(p?.nome||event.venue_name,event.city);groups.set(k,[...(groups.get(k)||[]),event]);
 }
 for(const [k,items] of groups){
  if(options.has(k))continue;
  const latest=[...items].sort((a,b)=>Date.parse(b.updated_at||b.created_at)-Date.parse(a.updated_at||a.created_at))[0];
  const neighborhoods=[...new Set(items.map(e=>e.neighborhood.trim()).filter(Boolean))];
  const environments=[...new Set(items.map(e=>e.environment).filter(Boolean))];
  options.set(k,{name:latest.venue_name.trim(),neighborhood:neighborhoods.length===1?neighborhoods[0]:'',environment:environments.length===1?environments[0]!:null,city:latest.city,state:latest.state,aliases:[]});
 }
 for(const venue of saved){
  const p=venueKey(venue.city)==='ipatinga'?findBaseVenue(venue.name):undefined;
  const k=key(p?.nome||venue.name,venue.city);
  if(!venue.active){options.delete(k);continue;}
  options.set(k,{name:p?.nome||venue.name,neighborhood:venue.neighborhood,environment:venue.environment??null,city:venue.city,state:venue.state,address:venue.address,organizer:venue.organizer,instagram_url:venue.instagram_url,aliases:p?.aliases||[]});
 }
 return [...options.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
}
