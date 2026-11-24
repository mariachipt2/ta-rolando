import { z } from 'zod';
import type { Event } from './types';
import { day, toISO } from './dates';
import { shiftDay } from './weekend';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value + 'T12:00:00Z');
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === value && value >= '2000-01-01' && value <= '2099-12-31';
}, 'Informe uma data válida entre 2000 e 2099.');

export const agendaSpecialSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().min(3).max(70),
  start_date: date,
  end_date: date,
  visible_from: date,
}).refine(value => value.end_date >= value.start_date, 'O fim deve ser igual ou posterior ao início.')
  .refine(value => Date.parse(value.end_date) - Date.parse(value.start_date) <= 30 * 86400000, 'Escolha um especial de até 31 dias.')
  .refine(value => value.visible_from <= value.end_date, 'O destaque deve começar a aparecer antes do especial terminar.');

export type AgendaSpecial = z.infer<typeof agendaSpecialSchema> & { updated_at?: string };
export const initialAgendaSpecial: AgendaSpecial = {
  enabled: true, title: 'Seu feriadão tá aqui', start_date: '2026-11-19',
  end_date: '2026-11-22', visible_from: '2026-11-18',
};

export function specialVisible(settings: AgendaSpecial, now: Date) {
  const today = day(now);
  return settings.enabled && today >= settings.visible_from && today <= settings.end_date;
}

export function specialPath(settings: AgendaSpecial) {
  const params = new URLSearchParams({ inicio: settings.start_date, fim: settings.end_date, titulo: settings.title });
  return '/especial?' + params.toString();
}

export function specialUrl(current: string, settings: AgendaSpecial) {
  const url = new URL(current);
  const path = specialPath(settings);
  if (url.hash.startsWith('#/')) { url.search = ''; url.hash = path; }
  else { url.pathname = '/especial'; url.search = path.split('?')[1]; url.hash = ''; }
  return url.href;
}

export function specialDates(settings: AgendaSpecial) {
  const count = Math.round((Date.parse(settings.end_date) - Date.parse(settings.start_date)) / 86400000) + 1;
  return Array.from({ length: count }, (_, index) => shiftDay(settings.start_date, index));
}

export function specialDateLabel(settings: AgendaSpecial) {
  const month = (value: string) => new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value + 'T12:00:00Z')).replace('.', '');
  const firstDay = Number(settings.start_date.slice(8));
  const lastDay = Number(settings.end_date.slice(8));
  if (settings.start_date === settings.end_date) return `${firstDay}/${month(settings.start_date)}`;
  if (settings.start_date.slice(0, 7) === settings.end_date.slice(0, 7)) return `${firstDay} a ${lastDay}/${month(settings.end_date)}`;
  return `${firstDay}/${month(settings.start_date)} a ${lastDay}/${month(settings.end_date)}`;
}

export function specialEvents(events: Event[], settings: AgendaSpecial, now: Date, ended = false) {
  const low = Date.parse(toISO(settings.start_date + 'T00:00'));
  const high = Date.parse(toISO(shiftDay(settings.end_date, 1) + 'T00:00'));
  return events.filter(event => {
    const published = event.status === 'published' || (event.status === 'scheduled' && !!event.publish_at && Date.parse(event.publish_at) <= +now);
    const start = Date.parse(event.starts_at);
    const finish = Date.parse(event.ends_at || event.starts_at);
    const overlaps = start < high && (event.ends_at ? finish > low : start >= low);
    return !event.sold_out&&!event.deleted_at && published && overlaps && (ended ? finish <= +now : finish > +now);
  }).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.id.localeCompare(b.id));
}

export function specialGroupDay(event: Event, settings: AgendaSpecial, now: Date, ended = false) {
  const first = day(event.starts_at) < settings.start_date ? settings.start_date : day(event.starts_at);
  const today = day(now);
  return !ended && first < today && today <= settings.end_date ? today : first;
}

export function specialFromParams(params: { inicio?: string | null; fim?: string | null; titulo?: string | null }) {
  return agendaSpecialSchema.safeParse({
    enabled: true, title: params.titulo || 'Especial da agenda', start_date: params.inicio,
    end_date: params.fim, visible_from: params.inicio,
  });
}
