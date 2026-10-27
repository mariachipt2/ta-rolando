import {z} from 'zod';
import type {Event} from './types';
import {day,upcoming} from './dates';
export const specialThemeSchema=z.object({enabled:z.boolean(),theme:z.enum(['ice','halloween']),motion:z.enum(['off','soft','full']),event_id:z.string().uuid().nullable(),starts_at:z.string().datetime({offset:true}).nullable(),ends_at:z.string().datetime({offset:true}).nullable()}).refine(v=>!v.enabled||!!v.event_id,{message:'Selecione o evento destacado.'}).refine(v=>!v.starts_at||!v.ends_at||Date.parse(v.ends_at)>Date.parse(v.starts_at),{message:'O término do tema deve ser depois do início.'});
export type SpecialTheme=z.infer<typeof specialThemeSchema>&{updated_at?:string};
export type ThemeData={settings:SpecialTheme;event:Event|null};
export const defaultTheme:SpecialTheme={enabled:false,theme:'ice',motion:'soft',event_id:null,starts_at:null,ends_at:null};
export function themeActive(settings:SpecialTheme,event:Event|null,now:Date){
  return settings.enabled&&!!event&&!event.deleted_at&&event.status!=='draft'&&event.status!=='cancelled'&&(!event.publish_at||event.status!=='scheduled'||Date.parse(event.publish_at)<=+now)&&upcoming(event,now)&&(!settings.starts_at||Date.parse(settings.starts_at)<=+now)&&(!settings.ends_at||Date.parse(settings.ends_at)>+now);
}
export function themeCountdown(event:Event,now:Date){
  if(Date.parse(event.starts_at)<=+now)return 'Está rolando!';
  const days=Math.round((Date.parse(day(event.starts_at)+'T12:00:00Z')-Date.parse(day(now)+'T12:00:00Z'))/86400000);
  return days===0?'É hoje!':days===1?'É amanhã!':`Faltam ${days} dias`;
}
