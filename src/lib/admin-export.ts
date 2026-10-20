import type {SupabaseClient} from '@supabase/supabase-js';
import {readAll} from './pagination';
import type {Event,Category,EventSubmission,SaveState} from './types';
import {buildRegistryExport} from './registry-export';
export async function loadRegistryExport(db:SupabaseClient){const [events,categories,submissions,state]=await Promise.all([
 readAll<Event>((from,to)=>db.from('admin_events').select('*').order('id').range(from,to)),
 readAll<Category>((from,to)=>db.from('categories').select('*').order('id').range(from,to)),
 readAll<EventSubmission>((from,to)=>db.from('event_submissions').select('id,event_data,status,submitted_at,updated_at,reviewed_at,approved_event_id,photo_path').order('id').range(from,to)),
 db.from('admin_save_state').select('saved_at,entity,record_id,operation').eq('singleton',true).single()
 ]);if(state.error)throw state.error;return buildRegistryExport(events,categories,submissions,state.data as SaveState)}
