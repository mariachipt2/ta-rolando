"use client";
import { useEffect, useState } from 'react';
import { request } from '@/lib/transport';
import { useNow } from '@/lib/use-now';
import { agendaSpecialSchema, initialAgendaSpecial, specialVisible, type AgendaSpecial } from '@/lib/agenda-special';
import { SaveConfirmation } from './save-confirmation';
import { SpecialBannerPreview } from './agenda-special-banner';

export function AdminAgendaSpecial({ onSaved, onDirtyChange }: { onSaved: (at: string) => void; onDirtyChange: (dirty: boolean) => void }) {
  const [settings, setSettings] = useState<AgendaSpecial>(initialAgendaSpecial);
  const [saved, setSaved] = useState<AgendaSpecial | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const dirty = !!saved && JSON.stringify(settings) !== JSON.stringify(saved);
  const now = new Date(useNow());

  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  useEffect(() => {
    let active = true;
    setError('');
    request('/api/admin/agenda-special', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok || !agendaSpecialSchema.safeParse(data.settings).success) throw Error(data.error || 'Não foi possível carregar o especial.');
      if (active) { setSettings(data.settings); setSaved(data.settings); }
    }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Falha ao carregar.'); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  function change<K extends keyof AgendaSpecial>(key: K, value: AgendaSpecial[K]) {
    setSettings(current => ({ ...current, [key]: value }));
  }
  async function save(value: AgendaSpecial) {
    const parsed = agendaSpecialSchema.safeParse(value);
    if (!parsed.success) { setError(parsed.error.issues.map(issue => issue.message).join(' ')); return; }
    setBusy(true);
    setError('');
    try {
      const response = await request('/api/admin/agenda-special', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Não foi possível salvar o especial.');
      if (!data.saved_at || !Number.isFinite(Date.parse(data.saved_at)) || !agendaSpecialSchema.safeParse(data.settings).success) throw Error('O Supabase não confirmou o salvamento. Recarregue os dados para conferir.');
      setSettings(data.settings);
      setSaved(data.settings);
      onSaved(data.saved_at);
      window.dispatchEvent(new Event('tr:campaign-refresh'));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Falha ao salvar.'); }
    finally { setBusy(false); }
  }

  return <section className="panel admin-agenda-special">
    <h2>Especiais da agenda</h2>
    <p>Destaque vários dias na busca da página inicial, como feriadões, Natal e Réveillon.</p>
    {error && <p role="alert" className="notice">{error}</p>}
    {!saved ? <>{!error && <p role="status">Carregando configuração salva…</p>}<button className="button secondary" disabled={!error} onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></> : <>
      <SaveConfirmation at={saved.updated_at} dirty={dirty} busy={busy}/>
      <p className="notice">Faixa salva {saved.enabled ? specialVisible(saved, now) ? 'ativa agora' : 'fora do período de exibição' : 'desativada'}. Ela sai automaticamente após o último dia, no horário de Brasília.</p>
      <form onSubmit={event => { event.preventDefault(); void save(settings); }}>
        <fieldset disabled={busy} className="theme-settings-fields">
          <div className="form-grid">
            <label className="check full"><input type="checkbox" checked={settings.enabled} onChange={event => change('enabled', event.target.checked)}/>Ativar destaque na página inicial</label>
            <label className="full">Título da faixa<input required minLength={3} maxLength={70} value={settings.title} onChange={event => change('title', event.target.value)}/></label>
            <label>Primeiro dia dos eventos<input required type="date" min="2000-01-01" max="2099-12-31" value={settings.start_date} onChange={event => change('start_date', event.target.value)}/></label>
            <label>Último dia dos eventos<input required type="date" min={settings.start_date} max="2099-12-31" value={settings.end_date} onChange={event => change('end_date', event.target.value)}/></label>
            <label>Mostrar a faixa a partir de<input required type="date" min="2000-01-01" max={settings.end_date} value={settings.visible_from} onChange={event => change('visible_from', event.target.value)}/><small>Datas e encerramento seguem o horário de Brasília. Até 31 dias por especial.</small></label>
          </div>
          <div className="share-buttons"><button className="button lime-button" disabled={!dirty}>{busy ? 'Aguardando confirmação…' : 'Salvar especial'}</button><button type="button" className="button secondary" disabled={!saved.enabled} onClick={() => void save({ ...saved, enabled: false })}>Desativar agora</button></div>
        </fieldset>
      </form>
      {agendaSpecialSchema.safeParse(settings).success && <div className="agenda-special-admin-preview"><h3>Prévia da faixa</h3><SpecialBannerPreview settings={settings}/></div>}
    </>}
  </section>;
}
