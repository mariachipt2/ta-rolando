import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { instagramUrl } from './validation';
import { readAll } from './pagination';

const profileSchema = z.object({
  id: z.string().uuid(),
  source_key: z.string().max(300).nullable(),
  name: z.string().trim().min(2).max(160),
  instagram_url: instagramUrl,
  environment:z.enum(['coberto','ao_ar_livre','misto']).nullable().optional(),
  venue_name: z.string().trim().max(160),
  address: z.string().trim().max(300),
  neighborhood: z.string().trim().max(100),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
});
export type OrganizerProfile = z.infer<typeof profileSchema> & { updated_at?: string };

export async function loadOrganizerProfiles(db: SupabaseClient) {
  return { profiles: await readAll<OrganizerProfile>((first,last) =>
    db.from('organizer_profiles').select('*').order('name').order('id').range(first,last)) };
}

export async function saveOrganizerProfile(db: SupabaseClient, body: unknown) {
  const profile = profileSchema.parse(body);
  const { data, error } = await db.from('organizer_profiles')
    .upsert(profile).select('*').single<OrganizerProfile>();
  if (error) throw error;
  return { profile: data, saved_at: data.updated_at };
}
