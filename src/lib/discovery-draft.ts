import type { Event } from './types';
import { https, type DiscoveredEvent } from '../../supabase/functions/_shared/discovery';

export function discoveryDraft(item: DiscoveredEvent, categoryId: string, entry: string, searchedAt: string): Partial<Event> {
  const { source_url, image_url, missing, is_free, source, ...fields } = item;
  const cover = https(image_url);
  return {
    ...fields,
    is_free: entry ? entry === 'free' : is_free === true,
    category_id: categoryId,
    description: `${item.title}. Evento em ${item.venue_name}, Ipatinga. Consulte a fonte e complete a descrição antes de publicar.`,
    family_friendly: null,
    cover_url: cover,
    gallery: [],
    status: 'draft',
    additional_info: `Fonte da busca: ${source_url}\nDados consultados em ${searchedAt}. Conferir informações antes de publicar.${cover ? '\nCartaz na fonte (verificar autorização de uso): ' + cover : ''}`,
  };
}

export function discoverySourceCover(event: Partial<Event>) {
  if (!event.additional_info?.startsWith('Fonte da busca:')) return '';
  const match = event.additional_info.match(/^Cartaz na fonte(?: \(verificar autorização de uso\))?:\s*(https:\/\/\S+)\s*$/m);
  return https(match?.[1]);
}
