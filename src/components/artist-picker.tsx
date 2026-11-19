"use client";
import { useEffect, useState } from 'react';
import { request } from '@/lib/transport';
import { artistKinds, artistName, type Artist } from '@/lib/artists';

export function ArtistPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    request('/api/admin/artists', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.artists)) throw Error('Não foi possível carregar os artistas.');
      if (active) setArtists(data.artists);
    }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Falha ao carregar artistas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const selected = new Set(value);
  const visible = artists.filter(artist => (artist.active || selected.has(artist.id)) && artistName(artist.name).includes(artistName(query)));
  return <fieldset className="artist-picker">
    <legend>Artistas e atrações do evento</legend>
    <p className="muted">Selecione até 20 atrações. Cadastre os nomes em Artistas no menu do administrador.</p>
    {loading ? <p role="status">Carregando artistas…</p> : error ? <p role="alert">{error} <button className="button secondary" type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></p> : <>
      <label>Buscar artista<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome do cantor, banda ou DJ"/></label>
      <div className="artist-picker-options">{visible.map(artist => <label className="check" key={artist.id}>
        <input type="checkbox" checked={selected.has(artist.id)} disabled={!selected.has(artist.id) && value.length >= 20} onChange={event => onChange(event.target.checked ? [...value, artist.id] : value.filter(id => id !== artist.id))}/>
        <span>{artist.name}<small>{artistKinds[artist.kind]}{!artist.active && ' · Perfil desativado'}</small></span>
      </label>)}</div>
      {!visible.length && <p className="muted">Nenhum artista nesta busca.</p>}
      <small>{value.length} {value.length === 1 ? 'atração selecionada' : 'atrações selecionadas'}</small>
    </>}
  </fieldset>;
}
