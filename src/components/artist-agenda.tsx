"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Mic2 } from 'lucide-react';
import { request } from '@/lib/transport';
import { useNow } from '@/lib/use-now';
import { artistEvents, artistKinds, artistName, type Artist } from '@/lib/artists';
import { displayDate } from '@/lib/dates';
import type { Event } from '@/lib/types';
import { EventCard } from './event-card';
import { InstagramLink } from './instagram-link';

function ArtistPhoto({ artist }: { artist: Artist }) {
  const [failed, setFailed] = useState(false);
  return <span className="artist-portrait">{artist.photo_url && !failed ? <img src={artist.photo_url} alt={'Foto de ' + artist.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)}/> : <Mic2 size={32} aria-hidden="true"/>}</span>;
}

export function EventArtists({ event }: { event: Event }) {
  if (!event.artists?.length) return null;
  return <section className="event-artists"><h2>Quem vai tocar</h2><div className="event-artist-links">{event.artists.map(artist => <Link href={'/artista/' + artist.slug} key={artist.id}><Mic2 size={17} aria-hidden="true"/><span>{artist.name}</span><ArrowUpRight size={16} aria-hidden="true"/></Link>)}</div></section>;
}

export function ArtistAgenda({ events, error: eventsError = false, slug }: { events: Event[]; error?: boolean; slug?: string }) {
  const now = new Date(useNow());
  const [artists, setArtists] = useState<Artist[]>([]);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [limit, setLimit] = useState(12);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    request('/api/artists', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.artists)) throw Error('Não foi possível carregar os artistas.');
      if (active) setArtists(data.artists);
    }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Falha ao carregar.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const artist = artists.find(artist => artist.slug === slug);
  const list = artists.filter(artist => (!kind || artist.kind === kind) && artistName(`${artist.name} ${artist.genre}`).includes(artistName(query)));
  const upcoming = artist ? artistEvents(events, artist.id, now) : [];

  return <div className="shell page artist-agenda">
    <Link className="back" href={slug ? '/artistas' : '/'}><ArrowLeft size={17}/>{slug ? 'Todos os artistas' : 'Explorar eventos'}</Link>
    {loading ? <p role="status">Carregando artistas…</p> : error ? <div className="notice" role="alert"><p>{error}</p><button className="button secondary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div> : slug ? artist ? <>
      <header className="artist-profile-heading"><ArtistPhoto key={artist.photo_url} artist={artist}/><div><span className="eyebrow">AGENDA DO ARTISTA</span><h1>{artist.name}</h1><p>{artistKinds[artist.kind]}{artist.genre && ` · ${artist.genre}`}</p><InstagramLink url={artist.instagram_url}/></div></header>
      {artist.bio && <p className="artist-bio">{artist.bio}</p>}
      <section><h2>Onde vai se apresentar</h2>
        {eventsError ? <p className="notice" role="alert">Não foi possível atualizar os eventos. Atualize a página para conferir a agenda.</p> : upcoming.length ? <><p>{upcoming.length} {upcoming.length === 1 ? 'apresentação publicada' : 'apresentações publicadas'}</p><div className="event-grid">{upcoming.map(event => <EventCard event={event} key={event.id}/>)}</div></> : <p className="notice">Aguardando novas apresentações na agenda.{artist.instagram_url && ' Confira também o Instagram do artista.'}</p>}
      </section>
    </> : <div className="empty"><p>Este perfil não está disponível. Explore os outros artistas da agenda.</p></div> : <>
      <span className="eyebrow">SIGA O SOM PELA CIDADE</span><h1>Agenda dos artistas</h1><p>Descubra onde seus cantores, bandas e DJs vão se apresentar.</p>
      <div className="artist-directory-filters"><label>Buscar artista ou estilo<input type="search" value={query} placeholder="Ex.: Brenda Brandão, sertanejo…" onChange={event => { setQuery(event.target.value); setLimit(12); }}/></label><label>Tipo de atração<select value={kind} onChange={event => { setKind(event.target.value); setLimit(12); }}><option value="">Todos</option>{Object.entries(artistKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
      {eventsError && <p className="notice" role="alert">A contagem das apresentações está indisponível. Atualize a página para conferir a agenda.</p>}
      <div className="artist-directory">{list.slice(0, limit).map(artist => {
        const next = artistEvents(events, artist.id, now);
        return <Link className="artist-directory-card" href={'/artista/' + artist.slug} key={artist.id}><ArtistPhoto key={artist.photo_url} artist={artist}/><div><h2>{artist.name}</h2><p>{artistKinds[artist.kind]}{artist.genre && ` · ${artist.genre}`}</p><small>{eventsError ? 'Agenda indisponível no momento' : next[0] ? `${next.length} ${next.length === 1 ? 'apresentação' : 'apresentações'} · Próxima ${displayDate(next[0].starts_at)}` : 'Agenda em breve'}</small></div><ArrowUpRight size={20} aria-hidden="true"/></Link>;
      })}</div>
      {!list.length && <p className="empty">Nenhum artista encontrado nesta busca.</p>}
      {list.length > limit && <button className="button secondary load-more" onClick={() => setLimit(value => value + 12)}>Mostrar mais artistas</button>}
    </>}
  </div>;
}
