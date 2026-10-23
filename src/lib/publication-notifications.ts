import type {SupabaseClient} from '@supabase/supabase-js';
import {z} from 'zod';
export type PublicationNotice={id:string;event_id:string;title:string;scheduled_at:string;confirmed_at:string;read_at:string|null;slug:string|null;public_now:boolean;cancelled_now:boolean};
export type PublicationInbox={items:PublicationNotice[];unread_count:number;checked_at:string};
export async function publicationInbox(db:SupabaseClient):Promise<PublicationInbox>{const {data,error}=await db.rpc('admin_publication_notifications');if(error)throw error;return data}
const readSchema=z.union([z.object({id:z.string().uuid()}).strict(),z.object({before:z.string().datetime({offset:true})}).strict()]);
export async function readPublicationNotice(db:SupabaseClient,input:unknown){const body=readSchema.parse(input);const {error}=await db.rpc('read_publication_notification','id' in body?{p_id:body.id}:{p_before:body.before});if(error)throw error;return publicationInbox(db)}
