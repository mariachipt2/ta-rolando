"use client";

import { useEffect, useState } from 'react';
import type { Event } from '@/lib/types';
import type { OrganizerProfile } from '@/lib/organizer-profiles';
import { organizerEvent, organizerPresets } from '@/lib/organizer-autofill';
import { eventOrganizer, organizerName, sameOrganizer } from '@/lib/organizers';
import { request } from '@/lib/transport';
import { SaveConfirmation, savedTime } from './save-confirmation';

const fields = [
  ['name', 'Nome', 160], ['instagram_url', 'Instagram', 2048],
  ['venue_name', 'Local padrão', 160], ['address', 'Endereço', 300],
  ['neighborhood', 'Bairro', 100], ['city', 'Cidade', 100], ['state', 'UF', 2],
] as const;

export function AdminOrganizers({ events, onSaved, onDirtyChange }: {
  events: Event[];
  onSaved: (time: string) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([]);
  const [edit, setEdit] = useState<OrganizerProfile | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => onDirtyChange(dirty || busy), [dirty, busy, onDirtyChange]);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await request('/api/admin/organizers');
        const body = await response.json();
        if (!response.ok || !Array.isArray(body.profiles)) throw Error();
        if (active) setProfiles(body.profiles);
      } catch {
        if (active) setError('Não foi possível carregar os organizadores. Recarregue o painel para tentar novamente.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const matches = (name: string) => organizerName(name).includes(organizerName(query));
  const presets = organizerPresets(events).filter(({ organizer }) => !profiles.some(profile => {
    const identity = eventOrganizer({ organizer: profile.name, instagram_url: profile.instagram_url });
    return profile.source_key === organizer.key || (identity && sameOrganizer(organizer, identity));
  }));
  function open(profile: Partial<OrganizerProfile> = {}) {
    setEdit({ id: crypto.randomUUID(), name: '', source_key: null, instagram_url: '', venue_name: '',
      address: '', neighborhood: '', city: 'Ipatinga', state: 'MG', ...profile });
    setDirty(false);
    setError('');
  }

  return <section className="venues-panel">
    <h2>Organizadores</h2>
    <p>Cadastre os dados que serão sugeridos ao criar um evento.</p>
    {error && <p role="alert" className="notice">{error}</p>}
    {edit ? <form className="panel" onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      setBusy(true);
      setError('');
      try {
        const response = await request('/api/admin/organizers', { method: 'POST',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) });
        const body = await response.json();
        if (!response.ok || !body.profile || !body.saved_at) throw Error();
        setProfiles(current => [...current.filter(profile => profile.id !== edit.id), body.profile]
          .sort((a,b) => a.name.localeCompare(b.name, 'pt-BR')));
        setEdit(null);
        setDirty(false);
        onSaved(body.saved_at);
      } catch {
        setError('Não foi possível confirmar o salvamento no Supabase. Confira os dados e tente novamente.');
      } finally { setBusy(false); }
    }}>
      <h3>{edit.updated_at ? 'Editar organizador' : 'Cadastrar organizador'}</h3>
      <SaveConfirmation at={edit.updated_at} dirty={dirty || !edit.updated_at} busy={busy} />
      <fieldset className="form-grid" disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {fields.map(([key,label,max]) => <label key={key}>{label}
          <input value={edit[key]} maxLength={max} required={['name','city','state'].includes(key)}
            type={key === 'instagram_url' ? 'url' : 'text'}
            onChange={event => { setEdit({ ...edit, [key]: event.target.value }); setDirty(true); }} />
        </label>)}
      </fieldset>
      <div className="share-buttons">
        <button className="button lime-button" disabled={busy}>Salvar organizador</button>
        <button type="button" className="button secondary" disabled={busy} onClick={() => {
          if (dirty && !confirm('Descartar as alterações do organizador?')) return;
          setEdit(null); setDirty(false); setError('');
        }}>Cancelar</button>
      </div>
    </form> : loading ? <p role="status">Carregando organizadores…</p> : <>
      <div className="venue-filters">
        <label>Buscar organizador<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <button className="button lime-button" type="button" onClick={() => open()}>Novo organizador</button>
      </div>
      <div className="venue-results">
        {profiles.filter(profile => matches(profile.name)).map(profile => <article className="venue-card" key={profile.id}>
          <h3>{profile.name}</h3>
          <p>{[profile.venue_name, profile.neighborhood, profile.city].filter(Boolean).join(' · ')}</p>
          {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noreferrer">Instagram ↗</a>}
          {profile.updated_at && <p className="muted">Salvo em {savedTime(profile.updated_at)} · Brasília</p>}
          <button type="button" className="button secondary" onClick={() => open(profile)}>Editar organizador</button>
        </article>)}
        {presets.filter(({organizer}) => matches(organizer.name)).map(({ organizer, locations }) => <article className="venue-card" key={organizer.key}>
          <h3>{organizer.name}</h3>
          <p>Dados de um evento já cadastrado</p>
          <button className="button secondary" type="button" onClick={() => {
            const { organizer: name, ...location } = organizerEvent(locations[0], organizer.instagram);
            open({ ...location, name: name || organizer.name, source_key: organizer.key,
              city: location.city || 'Ipatinga', state: location.state || 'MG' });
          }}>Revisar e cadastrar</button>
        </article>)}
      </div>
      {!profiles.some(profile => matches(profile.name)) && !presets.some(({organizer}) => matches(organizer.name))
        && <p className="empty">Nenhum organizador encontrado.</p>}
    </>}
  </section>;
}
