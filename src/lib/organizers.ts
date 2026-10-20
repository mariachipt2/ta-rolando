import type {Event} from './types';
import {instagramProfile} from './instagram';
export type Organizer={key:string;name:string;instagram:string};
export const organizerName=(name:string)=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
export function eventOrganizer(event:Pick<Event,'organizer'|'instagram_url'>):Organizer|null{
 const instagram=(instagramProfile(event.instagram_url||'')||'').toLowerCase(),name=event.organizer?.trim()||'';
 if(!name&&!instagram)return null;
 return {key:instagram?'instagram:'+instagram:'name:'+organizerName(name),name:name||'@'+new URL(instagram).pathname.split('/')[1],instagram};
}
export function sameOrganizer(a:Organizer,b:Organizer){if(a.instagram&&b.instagram)return a.instagram===b.instagram;return organizerName(a.name)===organizerName(b.name)}
export function organizerDirectory(events:Event[]){const result:{organizer:Organizer;events:Event[]}[]=[];for(const event of events){const organizer=eventOrganizer(event);if(!organizer||event.deleted_at)continue;const found=result.find(item=>sameOrganizer(item.organizer,organizer));if(found){found.events.push(event);if(!found.organizer.instagram&&organizer.instagram)found.organizer=organizer}else result.push({organizer,events:[event]})}return result.sort((a,b)=>a.organizer.name.localeCompare(b.organizer.name,'pt-BR'))}
export function parseOrganizers(raw:string|null):Organizer[]{if(!raw)return [];const data=JSON.parse(raw);if(!Array.isArray(data)||data.length>200)throw Error('Lista de favoritos inválida.');return data.map(value=>{if(!value||typeof value.name!=='string'||!value.name.trim()||value.name.length>160||typeof value.instagram!=='string')throw Error('Favorito inválido.');const result=eventOrganizer({organizer:value.name,instagram_url:value.instagram});if(!result||(value.instagram&&!result.instagram))throw Error('Favorito inválido.');return result})}
