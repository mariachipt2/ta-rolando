import type { SupabaseClient } from '@supabase/supabase-js';
import { artistSchema, type Artist } from './artists';
import { slugify } from './validation';
import { readAll } from './pagination';

export async function loadArtists(db: SupabaseClient, privateView = false) {
  const artists = await readAll<Artist>((from, to) => {
    let query = db.from('artists').select('*').order('name').order('id');
    if (!privateView) query = query.eq('active', true);
    return query.range(from, to);
  });
  return { artists };
}

export async function saveArtist(db: SupabaseClient, body: unknown) {
  const profile = artistSchema.parse(body);
  const previous = await db.from('artists').select('slug').eq('id', profile.id).maybeSingle();
  if (previous.error) throw previous.error;
  const slug = previous.data?.slug || `${slugify(profile.name).slice(0, 150) || 'artista'}-${profile.id.slice(0, 8)}`;
  const { data, error } = await db.from('artists').upsert({ ...profile, slug }).select('*').single<Artist>();
  if (error) throw error;
  return { artist: data, saved_at: data.updated_at };
}
