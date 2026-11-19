import type { SupabaseClient } from '@supabase/supabase-js';
import type { Event } from './types';
import { readAll } from './pagination';

export type EventMetric = {
  event_id: string;
  day: string;
  views: number;
  ticket_clicks: number;
  interests_added: number;
  interests_removed: number;
};
export type MetricTotals = Omit<EventMetric, 'event_id' | 'day'>;
export type StatisticsGroup = 'event' | 'category' | 'venue' | 'neighborhood';

export async function loadStatistics(db: SupabaseClient) {
  const metrics = await readAll<EventMetric>((from, to) =>
    db.from('event_metrics').select('*').order('day').order('event_id').range(from, to),
  );
  return { metrics, metricsRetrievedAt: new Date().toISOString() };
}

export function shiftStatisticsDay(date: string, offset: number) {
  const value = new Date(date + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function statisticsDayCount(from: string, to: string) {
  return Math.round((Date.parse(to + 'T12:00:00Z') - Date.parse(from + 'T12:00:00Z')) / 86400000) + 1;
}

export function sumMetrics(metrics: EventMetric[]): MetricTotals {
  return metrics.reduce((sum, row) => ({
    views: sum.views + Number(row.views),
    ticket_clicks: sum.ticket_clicks + Number(row.ticket_clicks),
    interests_added: sum.interests_added + Number(row.interests_added),
    interests_removed: sum.interests_removed + Number(row.interests_removed),
  }), { views: 0, ticket_clicks: 0, interests_added: 0, interests_removed: 0 });
}

export function metricsInPeriod(metrics: EventMetric[], from: string, to: string, eventId: string | null) {
  return metrics.filter(row => row.day >= from && row.day <= to && (!eventId || row.event_id === eventId));
}

export function statisticsTimeline(metrics: EventMetric[], from: string, to: string) {
  const count = statisticsDayCount(from, to);
  // At most 26 columns, including long histories, without horizontal scrolling.
  const step = count <= 31 ? 1 : Math.ceil(count / 26);
  return Array.from({ length: Math.ceil(count / step) }, (_, index) => {
    const start = shiftStatisticsDay(from, index * step);
    const end = shiftStatisticsDay(from, Math.min(count - 1, (index + 1) * step - 1));
    return { from: start, to: end, ...sumMetrics(metricsInPeriod(metrics, start, end, null)) };
  });
}

function groupIdentity(event: Event | undefined, eventId: string, group: StatisticsGroup) {
  if (group === 'event') return { key: eventId, name: event?.title || 'Evento indisponível' };
  if (!event) return { key: 'unknown', name: 'Sem cadastro disponível' };
  let name = event.categories?.name || 'Sem categoria';
  if (group === 'venue') name = event.venue_name.trim() || 'Local não informado';
  if (group === 'neighborhood') name = event.neighborhood.trim() || 'Bairro não informado';
  const city = group === 'venue' || group === 'neighborhood' ? `${event.city.trim()} · ${event.state.trim()}` : '';
  return {
    key: `${city}|${name}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR'),
    name: city ? `${name} · ${city}` : name,
  };
}

export function statisticsRanking(metrics: EventMetric[], events: Event[], group: StatisticsGroup) {
  const byId = new Map(events.map(event => [event.id, event]));
  const groups = new Map<string, { key: string; name: string; rows: EventMetric[]; eventIds: Set<string> }>();
  for (const row of metrics) {
    const identity = groupIdentity(byId.get(row.event_id), row.event_id, group);
    const entry = groups.get(identity.key) || { ...identity, rows: [], eventIds: new Set<string>() };
    entry.rows.push(row);
    entry.eventIds.add(row.event_id);
    groups.set(identity.key, entry);
  }
  return [...groups.values()].map(entry => ({
    key: entry.key, name: entry.name, eventCount: entry.eventIds.size, ...sumMetrics(entry.rows),
  }));
}
