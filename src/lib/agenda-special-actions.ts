import type { SupabaseClient } from '@supabase/supabase-js';
import { agendaSpecialSchema, type AgendaSpecial } from './agenda-special';

export async function loadAgendaSpecial(db: SupabaseClient) {
  const { data, error } = await db.from('site_agenda_special')
    .select('enabled,title,start_date,end_date,visible_from,updated_at').eq('singleton', true).single();
  if (error) throw error;
  return { settings: data as AgendaSpecial };
}

export async function saveAgendaSpecial(db: SupabaseClient, body: unknown) {
  const settings = agendaSpecialSchema.parse(body);
  const { data, error } = await db.rpc('save_agenda_special', { p_data: settings });
  if (error) throw error;
  return data;
}
