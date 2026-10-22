import type {SupabaseClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {safeUrl,instagramUrl} from './validation';
import {readAll} from './pagination';
import type {Venue} from './venues';
export const venueSchema=z.object({id:z.string().uuid(),name:z.string().trim().min(2).max(160),kind:z.enum(['bar','nightclub','other']),address:z.string().trim().max(300),neighborhood:z.string().trim().max(100),organizer:z.string().trim().max(160),instagram_url:instagramUrl,website:safeUrl,source_key:z.string().regex(/^(node|way|relation)\/\d+$/).nullable(),source_url:z.string().max(2048).refine(v=>!v||/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/.test(v)||/^https:\/\/socialyte[.]com[.]br\/eventos\//.test(v)),active:z.boolean(),share_enabled:z.boolean()});
export async function loadVenues(db:SupabaseClient){return {venues:await readAll<Venue>((a,b)=>db.from('venues').select('*').order('name').order('id').range(a,b))}}
export async function saveVenue(db:SupabaseClient,body:unknown){const {id,...data}=venueSchema.parse(body);const result=await db.rpc('save_venue',{p_id:id,p_data:data});if(result.error)throw result.error;return result.data}
export async function publicVenue(db:SupabaseClient,id:string){if(!z.string().uuid().safeParse(id).success)return {venue:null};const {data,error}=await db.rpc('submission_venue',{p_id:id});if(error)throw error;return {venue:data}}
