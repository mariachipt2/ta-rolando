import type {SupabaseClient} from '@supabase/supabase-js';
import {defaultTheme,specialThemeSchema,type SpecialTheme} from './special-theme';
import type {Event} from './types';
export async function loadSpecialTheme(db:SupabaseClient,privateView=false){
  const {data,error}=await db.from('site_special_theme').select('enabled,theme,motion,event_id,starts_at,ends_at,updated_at').single();
  if(error)throw error;
  const settings=(data||defaultTheme) as SpecialTheme;
  if(!settings.event_id||!privateView&&!settings.enabled)return {settings,event:null};
  const result=await db.from(privateView?'admin_events':'public_events').select('*').eq('id',settings.event_id).maybeSingle();
  if(result.error)throw result.error;
  return {settings,event:result.data as Event|null};
}
export async function saveSpecialTheme(db:SupabaseClient,body:unknown){
  const settings=specialThemeSchema.parse(body);
  const {data,error}=await db.rpc('save_special_theme',{p_data:settings});
  if(error)throw error;
  return data;
}
