import type {SupabaseClient} from '@supabase/supabase-js';
export async function publicClock(db:SupabaseClient){const {data,error}=await db.rpc('site_clock');if(error||typeof data!=='string'||!Number.isFinite(Date.parse(data)))throw Error('Não foi possível conferir o horário do servidor.');return data as string}
