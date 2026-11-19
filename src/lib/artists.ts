import { z } from 'zod';
import type { Event } from './types';
import { instagramUrl, safeUrl } from './validation';
import { upcoming } from './dates';

export const artistKinds = { cantor: 'Cantor(a)', banda: 'Banda', dj: 'DJ', outro: 'Outra atração' };
export const artistSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(180).optional(),
  name: z.string().trim().min(2).max(160),
  kind: z.enum(['cantor', 'banda', 'dj', 'outro']),
  genre: z.string().trim().max(160),
  bio: z.string().trim().max(1000),
  instagram_url: instagramUrl,
  photo_url: safeUrl,
  active: z.boolean(),
});
export type Artist = z.infer<typeof artistSchema> & { slug: string; updated_at?: string };
export const artistName = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();

export function artistEvents(events: Event[], artistId: string, now: Date) {
  return events.filter(event => event.artist_ids?.includes(artistId) && !event.deleted_at && upcoming(event, now)
    && (event.status === 'published' || (event.status === 'scheduled' && !!event.publish_at && Date.parse(event.publish_at) <= +now)))
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.id.localeCompare(b.id));
}
