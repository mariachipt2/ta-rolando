'use client';
import {useEffect,useState} from 'react';
import type { Artist } from '@/lib/artists';
import type {Event,EventVersion} from '@/lib/types';
import {request} from '@/lib/transport';
import {savedTime} from './save-confirmation';
const actions:Record<string,string>={baseline:'Registro inicial do histórico',created:'Evento cadastrado',updated:'Informações alteradas',trashed:'Movido para a lixeira',restored:'Retirado da lixeira',version_restored:'Versão anterior restaurada'};
const fields:Record<string,string>={artist_ids:'Artistas e atrações',title:'Título',description:'Descrição',starts_at:'Início',ends_at:'Encerramento',venue_name:'Local',address:'Endereço',price:'Preço',is_free:'Gratuito',status:'Status',cover_url:'Capa',gallery:'Fotos',age_rating:'Classificação',family_friendly:'Crianças',change_notice:'Aviso',deleted_at:'Lixeira',instagram_url:'Instagram',organizer:'Organizador',category_id:'Categoria',featured:'Destaque'};
function value(content: unknown, key: string, artists: Artist[]) {
  if (key === 'artist_ids' && Array.isArray(content)) {
    return content.map(id => artists.find(artist => artist.id === id)?.name || id).join(', ') || 'Sem artistas';
  }
  if (typeof content === 'string' && ['starts_at','ends_at','publish_at','deleted_at','created_at'].includes(key) && Number.isFinite(Date.parse(content))) return savedTime(content);
  if (key === 'status') return ({draft:'Rascunho',published:'Publicado',scheduled:'Agendado',cancelled:'Cancelado'}[String(content)] || String(content));
  if (content === '') return 'Vazio';
  if (content === null) return 'Não informado';
  if (typeof content === 'boolean') return content ? 'Sim' : 'Não';
  return typeof content === 'object' ? JSON.stringify(content) : String(content);
}

export function EventHistory({event,onClose,onSaved}:{event:Event;onClose:()=>void;onSaved:(at:string)=>void}){const [artists,setArtists]=useState<Artist[]>([]);const [versions,setVersions]=useState<EventVersion[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);useEffect(()=>{let active=true;request('/api/admin/artists').then(async r=>{const data=await r.json();if(active&&r.ok&&Array.isArray(data.artists))setArtists(data.artists)}).catch(()=>{});setLoading(true);request('/api/admin/history?event_id='+event.id).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(active)setVersions(d.versions)}).catch(()=>{if(active)setError('Não foi possível carregar o histórico.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[event.id]);return <section className="panel history-panel"><div className="section-heading"><div><span className="eyebrow">HISTÓRICO PRIVADO</span><h2>{event.title}</h2></div><button className="button secondary" onClick={onClose}>Fechar</button></div><p>Últimas 50 versões. Restaurar recupera os dados sem apagar o histórico, as marcações ou retirar o evento da lixeira.</p>{error&&<p role="alert" className="error-text">{error}</p>}<div className="admin-list">{loading&&<p role="status">Carregando versões…</p>}{!loading&&!error&&!versions.length&&<p>Nenhuma versão registrada ainda.</p>}{versions.map(v=><details className="history-version" key={v.id}><summary>{actions[v.action]||v.action} · {savedTime(v.created_at)}</summary><div className="history-body"><h3>{v.snapshot.title}</h3>{Object.entries(v.changes).map(([key,change])=><div className="history-change" key={key}><h4>{fields[key]||key}</h4><div className="history-values"><div><small>Antes</small><p>{value(change.before,key,artists)}</p></div><div><small>Depois</small><p>{value(change.after,key,artists)}</p></div></div></div>)}<button disabled={busy} className="button secondary" onClick={async()=>{if(!confirm('Restaurar os dados desta versão? A versão atual ficará guardada no histórico.'))return;setBusy(true);setError('');try{const r=await request('/api/admin/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version_id:v.id})});const d=await r.json();if(!r.ok||!d.saved_at)throw Error(d.error||'Sem confirmação do banco.');onSaved(d.saved_at)}catch(e){setError(e instanceof Error?e.message:'Não foi possível restaurar.')}finally{setBusy(false)}}}>Restaurar esta versão</button></div></details>)}</div></section>;}

