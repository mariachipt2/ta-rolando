"use client";
import {useEffect,useState} from 'react';
import type {Event} from '@/lib/types';
import {request} from '@/lib/transport';
import {defaultTheme,themeActive,specialThemeSchema,themeLabels,type SpecialTheme as Settings} from '@/lib/special-theme';
import {localInput,toISO} from '@/lib/dates';
import {useNow} from '@/lib/use-now';
import {ThemeBanner,ThemeAtmosphere} from './special-theme';
import {SaveConfirmation} from './save-confirmation';

export function AdminSpecialTheme({events,onSaved,onDirtyChange}:{events:Event[];onSaved:(at:string)=>void;onDirtyChange:(dirty:boolean)=>void}){
  const [settings,setSettings]=useState<Settings>(defaultTheme),[saved,setSaved]=useState<Settings>(defaultTheme),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[preview,setPreview]=useState(false);
  const now=new Date(useNow());
  const dirty=JSON.stringify(settings)!==JSON.stringify(saved);
  useEffect(()=>{onDirtyChange(dirty);return()=>onDirtyChange(false)},[dirty,onDirtyChange]);
  useEffect(()=>{let active=true;request('/api/admin/special-theme').then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível carregar o tema.');if(active){setSettings(d.settings);setSaved(d.settings)}}).catch(e=>{if(active)setError(String(e.message))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  useEffect(()=>{if(!dirty)return;const guard=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[dirty]);
  const event=events.find(e=>e.id===settings.event_id&&!e.deleted_at)||null;
  const savedEvent=events.find(e=>e.id===saved.event_id&&!e.deleted_at)||null;
  const change=<K extends keyof Settings>(key:K,value:Settings[K])=>setSettings(current=>({...current,[key]:value}));
  async function save(value:Settings){
    setError('');const parsed=specialThemeSchema.safeParse(value);if(!parsed.success){setError(parsed.error.issues.map(i=>i.message).join(' '));return}
    setBusy(true);try{
      const r=await request('/api/admin/special-theme',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(parsed.data)});
      const d=await r.json();if(!r.ok)throw Error(d.error||'Falha ao salvar.');
      if(!d.saved_at||!Number.isFinite(Date.parse(d.saved_at))||!d.settings)throw Error('O Supabase não confirmou o salvamento. Recarregue os dados antes de tentar novamente.');
      setSettings(d.settings);setSaved(d.settings);onSaved(d.saved_at);window.dispatchEvent(new Event('tr:theme-refresh'));
    }catch(e){setError(e instanceof Error?e.message:'Falha ao salvar.')}finally{setBusy(false)}
  }
  if(loading)return <p role="status">Carregando o tema salvo…</p>;
  return <section className="panel"><h2>Tema especial do site</h2>
    <p>Escolha um evento para dar o clima da página inicial e dos menus. Só um tema pode ficar ativo por vez.</p>
    <SaveConfirmation at={saved.updated_at} dirty={dirty} busy={busy}/>
    <p className="notice">Configuração salva: {!saved.enabled?'desativada':themeActive(saved,savedEvent,now)?'ativa agora':'aguardando o período/evento, ou já encerrada'}. O tema sai quando o prazo termina, o evento encerra, é cancelado ou deixa de estar público.</p>
    {error&&<p role="alert" className="error-text">{error}</p>}
    <form onSubmit={e=>{e.preventDefault();void save(settings)}}>
      <fieldset disabled={busy||(!saved.updated_at&&!!error)} className="theme-settings-fields">
        <div className="form-grid">
          <label className="check"><input type="checkbox" checked={settings.enabled} onChange={e=>change('enabled',e.target.checked)}/>Ativar tema especial</label>
          <label>Tema<select value={settings.theme} onChange={e=>change('theme',e.target.value as Settings['theme'])}>{Object.entries(themeLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          <label className="full">Evento destacado<select value={settings.event_id||''} onChange={e=>change('event_id',e.target.value||null)}><option value="">Selecione um evento</option>{events.filter(e=>!e.deleted_at&&(e.status==='published'||e.status==='scheduled')).map(e=><option key={e.id} value={e.id}>{e.title} · {localInput(e.starts_at).replace('T',' ')}</option>)}</select><small>Eventos com publicação agendada só aparecem ao público depois da publicação.</small></label>
          <label>Animação<select value={settings.motion} onChange={e=>change('motion',e.target.value as Settings['motion'])}><option value="off">Sem animação</option><option value="soft">Suave</option><option value="full">Intensa</option></select><small>O brilho percorre os menus lentamente. Respeita a preferência de reduzir animações do aparelho.</small></label>
          <label>Começar em (Brasília)<input type="datetime-local" value={settings.starts_at?localInput(settings.starts_at):''} onChange={e=>change('starts_at',e.target.value?toISO(e.target.value):null)}/><small>Vazio: começa assim que você ativar e salvar.</small></label>
          <label>Terminar em (Brasília)<input type="datetime-local" value={settings.ends_at?localInput(settings.ends_at):''} onChange={e=>change('ends_at',e.target.value?toISO(e.target.value):null)}/><small>Vazio: acompanha o encerramento do evento.</small></label>
        </div>
        <div className="share-buttons"><button className="button lime-button" disabled={!dirty}>{busy?'Aguardando confirmação…':'Salvar tema'}</button><button className="button secondary" type="button" onClick={()=>setPreview(v=>!v)}>{preview?'Fechar prévia':'Pré-visualizar'}</button><button className="button secondary" type="button" disabled={!saved.enabled} onClick={()=>void save({...saved,enabled:false})}>Desativar agora</button></div>
      </fieldset>
    </form>
    {preview&&<div className="theme-preview" data-special-theme={settings.theme} data-theme-motion={settings.motion}><ThemeAtmosphere theme={settings.theme}/><p className="eyebrow">PRÉVIA LOCAL · AINDA NÃO PUBLICADA</p><div className="theme-preview-menu"><button type="button">Explorar</button><button type="button">Fim de semana</button><button type="button">Minha agenda</button></div>{event?<ThemeBanner data={{settings,event}} now={now} preview/>:<p>Selecione um evento para visualizar o destaque.</p>}</div>}
  </section>;
}
