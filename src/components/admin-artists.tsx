"use client";
import { useEffect, useState } from 'react';
import { request } from '@/lib/transport';
import { artistKinds, artistName, artistSchema, type Artist } from '@/lib/artists';
import { SaveConfirmation, savedTime } from './save-confirmation';

export function AdminArtists({ onSaved, onDirtyChange }: { onSaved: (at: string) => void; onDirtyChange: (dirty: boolean) => void }) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [edit, setEdit] = useState<Partial<Artist> | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { onDirtyChange(dirty || busy || uploading); return () => onDirtyChange(false); }, [dirty, busy, uploading, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    request('/api/admin/artists', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.artists)) throw Error('Não foi possível carregar os artistas.');
      if (active) setArtists(data.artists);
    }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Falha ao carregar.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  function change<K extends keyof Artist>(key: K, value: Artist[K]) {
    setEdit(current => current ? { ...current, [key]: value } : current);
    setDirty(true);
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await request('/api/admin/upload', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.url) throw Error(data.error || 'Falha ao enviar a foto.');
      change('photo_url', data.url);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Falha ao enviar a foto.'); }
    finally { setUploading(false); }
  }
  async function save() {
    const parsed = artistSchema.safeParse(edit);
    if (!parsed.success) { setError(parsed.error.issues.map(issue => issue.message).join(' ')); return; }
    setBusy(true);
    setError('');
    try {
      const response = await request('/api/admin/artists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      if (!response.ok || !data.artist || !Number.isFinite(Date.parse(data.saved_at))) throw Error(data.error || 'O Supabase não confirmou o salvamento.');
      setArtists(current => [...current.filter(artist => artist.id !== data.artist.id), data.artist].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
      setReceipt(data.saved_at);
      setDirty(false);
      setEdit(null);
      onSaved(data.saved_at);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Falha ao salvar artista.'); }
    finally { setBusy(false); }
  }
  return <section className="admin-artists">
    <h2>Artistas</h2><p>Cadastre cantores, bandas e DJs e selecione as atrações ao editar cada evento.</p>
    {error && <p className="notice" role="alert">{error}</p>}
    {edit ? <form className="panel" onSubmit={event => { event.preventDefault(); if (!busy && !uploading) void save(); }}>
      <h3>{edit.updated_at ? 'Editar artista' : 'Cadastrar artista'}</h3>
      <SaveConfirmation at={edit.updated_at} dirty={dirty || !edit.updated_at} busy={busy}/>
      <fieldset className="theme-settings-fields" disabled={busy || uploading}>
        <div className="form-grid">
          <label>Nome do artista<input required minLength={2} maxLength={160} value={edit.name || ''} onChange={event => change('name', event.target.value)}/></label>
          <label>Tipo de atração<select value={edit.kind} onChange={event => change('kind', event.target.value as Artist['kind'])}>{Object.entries(artistKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>Estilo musical<input maxLength={160} value={edit.genre || ''} placeholder="Ex.: Sertanejo, MPB, rock" onChange={event => change('genre', event.target.value)}/></label>
          <label>Instagram<input value={edit.instagram_url || ''} placeholder="@artista ou link do perfil" onChange={event => change('instagram_url', event.target.value)}/></label>
          <label className="full">Apresentação<textarea rows={3} maxLength={1000} value={edit.bio || ''} onChange={event => change('bio', event.target.value)}/></label>
          <label>Foto do artista<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }}/><small>JPG, PNG ou WebP, até 5 MB.</small></label>
          <label>Link HTTPS da foto<input type="url" value={edit.photo_url || ''} onChange={event => change('photo_url', event.target.value)}/></label>
          {edit.photo_url && <div className="full artist-photo-preview"><img src={edit.photo_url} alt={'Foto de ' + edit.name} referrerPolicy="no-referrer"/><button type="button" className="button secondary" onClick={() => change('photo_url', '')}>Remover foto</button></div>}
          <label className="check full"><input type="checkbox" checked={edit.active} onChange={event => change('active', event.target.checked)}/>Exibir perfil no site público</label>
        </div>
        <div className="share-buttons"><button className="button lime-button">Salvar artista</button><button type="button" className="button secondary" onClick={() => { if (!dirty || confirm('Descartar alterações do artista?')) { setEdit(null); setDirty(false); } }}>Cancelar</button></div>
      </fieldset>
      {uploading && <p role="status">Enviando foto…</p>}
    </form> : <>
      {receipt && <p className="muted" role="status">Artista salvo no Supabase em {savedTime(receipt)} · Brasília.</p>}
      {loading ? <p role="status">Carregando artistas…</p> : error ? <button className="button secondary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button> : <>
        <div className="search-row"><label>Buscar artista<input type="search" value={query} onChange={event => setQuery(event.target.value)}/></label><button className="button lime-button" onClick={() => { setEdit({ id: crypto.randomUUID(), name: '', kind: 'cantor', genre: '', bio: '', instagram_url: '', photo_url: '', active: true }); setDirty(false); setError(''); }}>Novo artista</button></div>
        <div className="admin-list">{artists.filter(artist => artistName(artist.name).includes(artistName(query))).map(artist => <article className="admin-row" key={artist.id}><div><h3>{artist.name}</h3><p>{artistKinds[artist.kind]}{artist.genre && ` · ${artist.genre}`} · {artist.active ? 'Perfil público' : 'Perfil desativado'}</p><small>Salvo {artist.updated_at && savedTime(artist.updated_at)}</small></div><button className="button secondary" onClick={() => { setEdit(artist); setDirty(false); setError(''); }}>Editar<span className="sr-only"> {artist.name}</span></button></article>)}</div>
        {!artists.length && <p className="muted">Cadastre o primeiro artista para começar.</p>}
      </>}
    </>}
  </section>;
}
