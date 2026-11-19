"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Flame, MessageCircle } from 'lucide-react';
import type { Event } from '@/lib/types';
import { day } from '@/lib/dates';
import { useNow } from '@/lib/use-now';
import { request } from '@/lib/transport';
import { forChildren, isNightlifeCategory } from '@/lib/event-discovery';
import {
  agendaSpecialSchema, specialDateLabel, specialDates, specialEvents, specialFromParams,
  specialGroupDay, specialUrl, type AgendaSpecial,
} from '@/lib/agenda-special';
import { EventCard } from './event-card';

type Selection = { inicio?: string | null; fim?: string | null; titulo?: string | null };
const weekday = (date: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(date + 'T12:00:00Z'));

export function AgendaSpecialPage({ events, error: eventError = false, selection = {} }: { events: Event[]; error?: boolean; selection?: Selection }) {
  const explicit = !!(selection.inicio || selection.fim);
  const parsed = specialFromParams(selection);
  const [settings, setSettings] = useState<AgendaSpecial | null>(parsed.success ? parsed.data : null);
  const [error, setError] = useState(explicit && !parsed.success ? 'O período deste link é inválido. Volte ao início e abra o especial novamente.' : '');
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('all');
  const [children, setChildren] = useState(false);
  const [hideNightlife, setHideNightlife] = useState(false);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [url, setUrl] = useState('');
  const now = new Date(useNow());

  useEffect(() => {
    try { setHideNightlife(localStorage.getItem('tr:hide-nightlife') === '1'); } catch {}
  }, []);
  useEffect(() => {
    if (explicit) return;
    let active = true;
    setError('');
    request('/api/agenda-special', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      const parsed = agendaSpecialSchema.safeParse(data.settings);
      if (!response.ok || !parsed.success) throw Error('Não foi possível carregar o especial. Tente novamente.');
      if (active) setSettings(parsed.data);
    }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Falha ao carregar o especial.'); });
    return () => { active = false; };
  }, [explicit, attempt]);
  useEffect(() => { if (settings) setUrl(specialUrl(location.href, settings)); }, [settings]);

  if (!settings) return <div className="shell page"><Link className="back" href="/">Voltar ao início</Link><p role={error ? 'alert' : 'status'}>{error || 'Carregando o especial…'}</p>{error && !explicit && <button className="button secondary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}</div>;

  const all = [...specialEvents(events, settings, now), ...specialEvents(events, settings, now, true)];
  const categories = [...new Map(all.flatMap(event => event.categories ? [[event.categories.id, event.categories] as const] : [])).values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const matches = (event: Event) => (!category || event.category_id === category)
    && (price === 'all' || (price === 'free' ? event.is_free : !event.is_free))
    && (!children || forChildren(event))
    && (!hideNightlife || !event.nightlife_venue && !isNightlifeCategory(event.categories))
    && (!query.trim() || `${event.title} ${event.venue_name} ${event.neighborhood}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
  const upcoming = specialEvents(events, settings, now).filter(matches);
  const ended = specialEvents(events, settings, now, true).filter(matches);
  const dates = specialDates(settings);
  const visibleDates = dates.filter(date => date >= day(now) || upcoming.some(event => specialGroupDay(event, settings, now) === date));

  return <div className="shell page agenda-special-page">
    <Link className="back" href="/"><ArrowLeft size={17}/>Explorar eventos</Link>
    <header className="agenda-special-heading"><Flame size={32} aria-hidden="true"/><span>{specialDateLabel(settings)}</span><h1>{settings.title}</h1><p>Escolha os rolês e monte sua programação.</p></header>
    <div className="share-buttons">
      <a className="button lime-button" target="_blank" rel="noopener noreferrer" href={url ? 'https://wa.me/?text=' + encodeURIComponent(`${settings.title} · ${specialDateLabel(settings)}. Confira os rolês no Tá Rolando: ${url}`) : undefined} aria-disabled={!url}><MessageCircle size={17}/>Compartilhar programação</a>
      <button className="button secondary" disabled={!url} onClick={async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setCopyError(''); }
        catch { setCopyError('Selecione e copie o link abaixo.'); }
      }}><Copy size={16}/>{copied ? 'Link copiado!' : 'Copiar link'}</button>
    </div>
    {copyError && <label>{copyError}<input readOnly value={url} onFocus={event => event.target.select()}/></label>}
    <div className="special-event-filters">
      <label>Buscar evento, local ou bairro<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Encontre seu rolê…"/></label>
      <label>Categoria<select value={category} onChange={event => setCategory(event.target.value)}><option value="">Todas as categorias</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Entrada<select value={price} onChange={event => setPrice(event.target.value)}><option value="all">Todas</option><option value="free">Gratuitos</option><option value="paid">Pagos</option></select></label>
      <label className="check"><input type="checkbox" checked={children} onChange={event => setChildren(event.target.checked)}/>Para crianças</label>
      <label className="check"><input type="checkbox" checked={hideNightlife} onChange={event => {
        setHideNightlife(event.target.checked);
        try { if (event.target.checked) localStorage.setItem('tr:hide-nightlife', '1'); else localStorage.removeItem('tr:hide-nightlife'); } catch {}
      }}/>Ocultar bares e baladas</label>
    </div>
    {eventError ? <p className="notice" role="alert">Não foi possível consultar os eventos. Atualize a página para tentar novamente.</p> : <>
      <p className="muted" role="status">{upcoming.length} {upcoming.length === 1 ? 'rolê próximo ou em andamento' : 'rolês próximos ou em andamento'} nesta seleção.</p>
      {upcoming.length > 0 ? <>
        <nav className="special-day-shortcuts" aria-label="Ir para um dia da programação">{visibleDates.map(date => <button className="button secondary" key={date} onClick={() => document.getElementById('special-day-' + date)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>{weekday(date)}</button>)}</nav>
        {visibleDates.map(date => {
          const items = upcoming.filter(event => specialGroupDay(event, settings, now) === date);
          return <section className="event-section special-day-section" key={date} id={'special-day-' + date}><h2>{weekday(date)}</h2>{items.length ? <div className="event-grid">{items.map(event => <div key={event.id}>{day(event.starts_at) < date && <p className="muted">Começou antes e continua neste dia.</p>}<EventCard event={event}/></div>)}</div> : <p className="muted">Ainda sem eventos nesta seleção para este dia.</p>}</section>;
        })}
      </> : <p className="notice">Nenhum rolê próximo nesta seleção. Ajuste os filtros ou confira os próximos eventos na página inicial.</p>}
      {ended.length > 0 && <details className="special-ended"><summary>Ver dias anteriores e eventos encerrados ({ended.length})</summary>{dates.map(date => {
        const items = ended.filter(event => specialGroupDay(event, settings, now, true) === date);
        return items.length > 0 && <section className="event-section" key={date}><h2>{weekday(date)}</h2><div className="event-grid">{items.map(event => <EventCard event={event} key={event.id}/>)}</div></section>;
      })}</details>}
    </>}
  </div>;
}
