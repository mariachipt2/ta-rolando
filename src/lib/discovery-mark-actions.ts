import type {SupabaseClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {readAll} from './pagination';
import type {DiscoveryMark} from './discovery-marks';
export async function loadDiscoveryMarks(db:SupabaseClient){return {marks:await readAll<DiscoveryMark>((a,b)=>db.from('discovery_marks').select('source_url,starts_at,status,updated_at').order('source_url').order('starts_at').range(a,b))}}
export async function saveDiscoveryMark(db:SupabaseClient,body:unknown){
 const input=z.object({source_url:z.string().max(2048).url().refine(v=>{const u=new URL(v);return u.protocol==='https:'&&u.hostname==='socialyte.com.br'&&!u.username&&!u.password&&u.pathname.startsWith('/eventos/')}),starts_at:z.string().datetime({offset:true}),status:z.enum(['pending','added','ignored'])}).parse(body);
 const {data,error}=await db.rpc('mark_discovery',{p_source_url:input.source_url,p_starts_at:input.starts_at,p_status:input.status});if(error)throw error;return data;
}
