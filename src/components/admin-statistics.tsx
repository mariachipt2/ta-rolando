"use client";

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { day } from '@/lib/dates';
import { useNow } from '@/lib/use-now';
import { request } from '@/lib/transport';
import type { Event } from '@/lib/types';
import {
  metricsInPeriod, shiftStatisticsDay, statisticsDayCount, statisticsRanking,
  statisticsTimeline, sumMetrics, type EventMetric, type MetricTotals, type StatisticsGroup,
} from '@/lib/admin-statistics';
import { savedTime } from './save-confirmation';

const number = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
const dateLabel = (date: string) => date.split('-').reverse().join('/');
const measures = {
  views: 'Visualizações', ticket_clicks: 'Cliques em ingressos',
  interests_added: 'Novos “Eu vou!”', interests_removed: 'Marcações retiradas',
};

function comparison(current: number, previous: number) {
  if (!previous) return current ? `+${number.format(current)} em relação ao período anterior` : 'Sem registros nos dois períodos';
  const change = (current - previous) / previous;
  return `${change > 0 ? '+' : ''}${percent.format(change)} em relação ao período anterior`;
}

export function AdminStatistics({ events, metrics: initialMetrics, retrievedAt, selectedEvent, onSelectEvent }: {
  events: Event[];
  metrics: EventMetric[];
  retrievedAt: string;
  selectedEvent: string | null;
  onSelectEvent: (id: string | null) => void;
}) {
  const today = day(new Date(useNow()));
  const [metrics, setMetrics] = useState(initialMetrics);
  const [updatedAt, setUpdatedAt] = useState(retrievedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30');
  const [customFrom, setCustomFrom] = useState(shiftStatisticsDay(today, -29));
  const [customTo, setCustomTo] = useState(today);
  const [measure, setMeasure] = useState<keyof MetricTotals>('views');
  const [group, setGroup] = useState<StatisticsGroup>('event');
  const [expanded, setExpanded] = useState(false);
  const earliest = metrics.reduce((first, row) => row.day < first ? row.day : first, today);
  const from = period === 'custom' ? customFrom : period === 'all' ? earliest : shiftStatisticsDay(today, 1 - Number(period));
  const to = period === 'custom' ? customTo : today;
  const valid = !!from && !!to && from <= to && to <= today && /^\d{4}-\d{2}-\d{2}$/.test(from + '') && /^\d{4}-\d{2}-\d{2}$/.test(to);
  const filtered = valid ? metricsInPeriod(metrics, from, to, selectedEvent) : [];
  const totals = sumMetrics(filtered);
  const duration = valid ? statisticsDayCount(from, to) : 0;
  const previous = valid ? sumMetrics(metricsInPeriod(metrics, shiftStatisticsDay(from, -duration), shiftStatisticsDay(from, -1), selectedEvent)) : sumMetrics([]);
  const timeline = valid ? statisticsTimeline(filtered, from, to) : [];
  const peak = Math.max(1, ...timeline.map(row => row[measure]));
  const ranking = statisticsRanking(filtered, events, group)
    .filter(row => row[measure] > 0)
    .sort((a, b) => b[measure] - a[measure] || a.name.localeCompare(b.name, 'pt-BR'));
  const visibleRanking = expanded ? ranking : ranking.slice(0, 10);
  const chartTotal = totals[measure];

  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const response = await request('/api/admin/statistics', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível consultar as estatísticas.');
      if (!Array.isArray(data.metrics) || !data.metricsRetrievedAt) throw new Error('Resposta de estatísticas inválida.');
      setMetrics(data.metrics);
      setUpdatedAt(data.metricsRetrievedAt);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível consultar as estatísticas.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="admin-statistics" aria-labelledby="statistics-heading" aria-busy={busy}>
    <div className="statistics-heading">
      <div><h2 id="statistics-heading">Estatísticas da agenda</h2>
        <p className="muted" role="status">Última consulta ao Supabase {updatedAt ? <time dateTime={updatedAt}>{savedTime(updatedAt)} · Brasília</time> : 'sem confirmação de horário'}</p>
      </div>
      <button className="button secondary" onClick={refresh} disabled={busy}><RefreshCw size={16}/>{busy ? 'Consultando…' : 'Atualizar dados'}</button>
    </div>
    {error && <p className="notice" role="alert">{error} Os dados exibidos são da última consulta bem-sucedida.</p>}
    <div className="statistics-filters">
      <label>Período<select value={period} onChange={event => { setPeriod(event.target.value); setExpanded(false); }}>
        <option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option>
        <option value="90">Últimos 90 dias</option><option value="all">Todo o histórico</option><option value="custom">Personalizado</option>
      </select></label>
      <label>Evento<select value={selectedEvent || ''} onChange={event => { onSelectEvent(event.target.value || null); setExpanded(false); }}>
        <option value="">Todos os eventos</option>
        {events.map(event => <option value={event.id} key={event.id}>{event.title}{event.deleted_at ? ' · Lixeira' : ''}</option>)}
      </select></label>
      {period === 'custom' && <>
        <label>De<input type="date" value={customFrom} max={customTo || today} onChange={event => setCustomFrom(event.target.value)}/></label>
        <label>Até<input type="date" value={customTo} min={customFrom} max={today} onChange={event => setCustomTo(event.target.value)}/></label>
      </>}
    </div>
    {!valid ? <p className="notice" role="alert">Selecione um intervalo válido, com início anterior ou igual ao fim e até a data de hoje.</p> : <>
      <p className="muted statistics-range">{dateLabel(from)} a {dateLabel(to)} · {number.format(duration)} {duration === 1 ? 'dia' : 'dias'}{period !== 'all' && ` · Comparação com os ${number.format(duration)} dias anteriores`}</p>
      <div className="statistics-summary">
        {(Object.keys(measures) as (keyof MetricTotals)[]).map(key => <div className="stat" key={key}>
          <span>{measures[key]}</span><strong>{number.format(totals[key])}</strong>
          {period !== 'all' && <small>{comparison(totals[key], previous[key])}</small>}
        </div>)}
        <div className="stat"><span>Saldo de “Eu vou!” no período</span><strong>{number.format(totals.interests_added - totals.interests_removed)}</strong><small>Novas marcações menos retiradas</small></div>
        <div className="stat"><span>Taxa de clique em ingresso</span><strong>{totals.views ? percent.format(totals.ticket_clicks / totals.views) : '—'}</strong><small>{totals.views ? 'Cliques em ingresso ÷ visualizações' : 'Sem visualizações para calcular'}</small></div>
      </div>
      <div className="statistics-measure"><label>Medida do gráfico e dos rankings<select value={measure} onChange={event => setMeasure(event.target.value as keyof MetricTotals)}>
        {Object.entries(measures).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
      </select></label></div>
      <section className="panel statistics-chart-panel">
        <h3>{measures[measure]} ao longo do período</h3>
        {timeline.length > 31 || (timeline[0] && timeline[0].from !== timeline[0].to) ? <p className="muted">Valores agrupados em intervalos para facilitar a leitura.</p> : <p className="muted">Registros diários · Brasília</p>}
        {chartTotal === 0 ? <p className="empty">Nenhum registro desta medida no período selecionado.</p> : <div className="statistics-bars" role="img" aria-label={`${measures[measure]} de ${dateLabel(from)} a ${dateLabel(to)}. Total ${chartTotal}. Valores disponíveis na tabela abaixo.`}>
          {timeline.map((row, index) => <div className="statistics-bar-column" key={row.from} title={`${dateLabel(row.from)}${row.to !== row.from ? ` a ${dateLabel(row.to)}` : ''} · ${number.format(row[measure])}`}>
            <div className="statistics-bar-space"><i style={{ height: `${row[measure] / peak * 100}%` }}/></div>
            <span>{index === 0 || index === timeline.length - 1 || index % Math.ceil(timeline.length / 6) === 0 ? `${row.from.slice(8)}/${row.from.slice(5, 7)}` : ''}</span>
          </div>)}
        </div>}
        <details className="statistics-details"><summary>Ver valores do gráfico</summary><div className="statistics-table-wrap"><table>
          <caption>Totais por intervalo</caption><thead><tr><th scope="col">Data</th><th scope="col">{measures[measure]}</th></tr></thead>
          <tbody>{timeline.map(row => <tr key={row.from}><th scope="row">{dateLabel(row.from)}{row.to !== row.from && ` a ${dateLabel(row.to)}`}</th><td>{number.format(row[measure])}</td></tr>)}</tbody>
        </table></div></details>
      </section>
      <section className="panel statistics-ranking-panel">
        <div className="statistics-heading"><h3>Desempenho por {group === 'event' ? 'evento' : group === 'category' ? 'categoria' : group === 'venue' ? 'local' : 'bairro'}</h3>
          <label>Agrupar por<select value={group} onChange={event => { setGroup(event.target.value as StatisticsGroup); setExpanded(false); }}>
            <option value="event">Evento</option><option value="category">Categoria</option><option value="venue">Local</option><option value="neighborhood">Bairro</option>
          </select></label>
        </div>
        <p className="muted">Ordenado por {measures[measure].toLocaleLowerCase('pt-BR')} no período selecionado.</p>
        {!ranking.length ? <p className="empty">Nenhum registro desta medida para montar o ranking.</p> : <ol className="statistics-ranking">
          {visibleRanking.map(row => <li key={row.key}><div><strong>{row.name}</strong>
            <small>{group !== 'event' && `${row.eventCount} ${row.eventCount === 1 ? 'evento com registros' : 'eventos com registros'} · `}{number.format(row.views)} visualizações · {number.format(row.ticket_clicks)} cliques · {number.format(row.interests_added)} novos “Eu vou!”</small>
          </div><span>{number.format(row[measure])}<small>{measures[measure]}</small></span></li>)}
        </ol>}
        {ranking.length > 10 && <button className="button secondary" onClick={() => setExpanded(!expanded)}>{expanded ? 'Mostrar os 10 primeiros' : `Ver todos (${ranking.length})`}</button>}
      </section>
      <p className="muted statistics-notes">Visualizações e cliques são limitados a um registro por navegador, evento e tipo a cada hora. A taxa de clique mede a relação entre registros e pode ultrapassar 100%. Os agrupamentos usam o cadastro atual dos eventos, incluindo os que estão na lixeira. Os dias sem registros aparecem com zero.</p>
    </>}
  </section>;
}
