import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Event } from '../src/lib/types';
import {
  metricsInPeriod, shiftStatisticsDay, statisticsDayCount, statisticsRanking,
  statisticsTimeline, sumMetrics, type EventMetric,
} from '../src/lib/admin-statistics';

const row = (event_id: string, day: string, views: number): EventMetric => ({
  event_id, day, views, ticket_clicks: 2, interests_added: 3, interests_removed: 1,
});
const event = (id: string, extra: Partial<Event> = {}) => ({
  id, title: id, venue_name: 'Garajão', neighborhood: 'Novo Centro',
  city: 'Ipatinga', state: 'MG', ...extra,
} as Event);

test('Período inclui os dois extremos e filtra o evento, inclusive na virada do ano', () => {
  const metrics = [row('a', '2026-12-31', 4), row('a', '2027-01-01', 6), row('b', '2027-01-01', 10), row('a', '2027-01-02', 50)];
  const selected = metricsInPeriod(metrics, '2026-12-31', '2027-01-01', 'a');
  assert.equal(sumMetrics(selected).views, 10);
  assert.equal(statisticsDayCount('2026-12-31', '2027-01-01'), 2);
  assert.equal(shiftStatisticsDay('2027-01-01', -1), '2026-12-31');
  assert.equal(shiftStatisticsDay('2028-03-01', -1), '2028-02-29');
});

test('Gráfico longo mantém todos os totais, os dias vazios e o último intervalo parcial', () => {
  const metrics = [row('a', '2026-01-01', 4), row('b', '2026-12-31', 7)];
  const timeline = statisticsTimeline(metrics, '2026-01-01', '2026-12-31');
  assert.ok(timeline.length <= 26);
  assert.equal(timeline[0].from, '2026-01-01');
  assert.equal(timeline.at(-1)?.to, '2026-12-31');
  assert.equal(timeline.reduce((sum, bucket) => sum + bucket.views, 0), 11);
  assert.equal(timeline.reduce((sum, bucket) => sum + bucket.interests_added, 0), 6);
  const empty = statisticsTimeline([], '2026-11-01', '2026-11-07');
  assert.equal(empty.length, 7);
  assert.ok(empty.every(bucket => bucket.views === 0));
});

test('Agrupamento normaliza espaços e acentos, preserva cidades e histórico na lixeira', () => {
  const metrics = [row('a', '2026-11-18', 3), row('b', '2026-11-18', 5), row('c', '2026-11-18', 2), row('missing', '2026-11-18', 1)];
  const events = [event('a'), event('b', { venue_name: '  GARAJAO  ', deleted_at: '2026-11-18' }), event('c', { city: 'Timóteo' })];
  const ranking = statisticsRanking(metrics, events, 'venue');
  assert.equal(ranking.length, 3);
  assert.equal(ranking.find(group => group.name.startsWith('Garajão · Ipatinga'))?.views, 8);
  assert.equal(ranking.find(group => group.name.startsWith('Garajão · Ipatinga'))?.eventCount, 2);
  assert.equal(ranking.find(group => group.name === 'Sem cadastro disponível')?.views, 1);
  assert.equal(statisticsRanking(metrics, events, 'event').length, 4);
});
