"use client";
import {useEffect,useRef,useState} from 'react';
import {Bell} from 'lucide-react';
import Link from 'next/link';
import {request} from '@/lib/transport';
import type {PublicationInbox} from '@/lib/publication-notifications';
import {savedTime} from './save-confirmation';
export function AdminNotifications(){
 const [open,setOpen]=useState(false),[data,setData]=useState<PublicationInbox|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const running=useRef(false),mounted=useRef(false);
 async function load(body?:{id:string}|{before:string}){
  if(running.current)return;running.current=true;setBusy(true);
  try{const r=await request('/api/admin/notifications',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);const d=await r.json();if(!r.ok)throw Error();if(mounted.current){setData(d);setError('')}}
  catch{if(mounted.current)setError('Não foi possível atualizar os avisos. Os avisos exibidos podem estar desatualizados.')}
  finally{running.current=false;if(mounted.current)setBusy(false)}
 }
 useEffect(()=>{mounted.current=true;void load();const check=()=>{if(!document.hidden)void load()};const timer=setInterval(check,60000);window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);return()=>{mounted.current=false;clearInterval(timer);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check)}},[]);
 return <div className="admin-notifications"><button type="button" className="button secondary" aria-expanded={open} aria-controls="publication-inbox" onClick={()=>{setOpen(v=>!v);if(!open)void load()}}><Bell size={18}/><span>Publicações</span><span className="notification-count" aria-label={data?`${data.unread_count} avisos não lidos`:'Avisos ainda não consultados'}>{data?data.unread_count:'…'}</span>{error&&<span aria-label="Falha ao atualizar avisos">!</span>}</button>
 {open&&<section id="publication-inbox" className="notification-inbox" aria-label="Avisos de publicações agendadas"><div className="section-heading"><h2>Publicações agendadas</h2><button type="button" className="button secondary" onClick={()=>setOpen(false)}>Fechar avisos</button></div><p>Os avisos ficam guardados mesmo quando você não acessa o painel. Horários de Brasília.</p>{error&&<p className="notice" role="alert">{error}</p>}<div className="share-buttons"><button type="button" className="button secondary" disabled={busy} onClick={()=>void load()}>{busy?'Conferindo…':'Atualizar avisos'}</button>{!!data?.unread_count&&<button type="button" className="button secondary" disabled={busy} onClick={()=>void load({before:data.checked_at})}>Marcar todos como lidos</button>}</div>
 {data&&<p className="muted" role="status">{data.unread_count} não lidos · Última conferência: {savedTime(data.checked_at)}</p>}
 {data?.items.length===0&&<p>Nenhuma publicação agendada confirmada até esta conferência.</p>}
 <div className="notification-list">{data?.items.map(n=><article className={'publication-notice '+(!n.read_at?'unread':'')} key={n.id}><span className="eyebrow">{n.read_at?'LIDO':'NÃO LIDO'} · PUBLICAÇÃO CONFIRMADA</span><h3>{n.title}</h3><p>Este evento ficou público após o agendamento.</p><p className="muted">Agendado para {savedTime(n.scheduled_at)}<br/>Visibilidade confirmada em {savedTime(n.confirmed_at)}</p>{!n.public_now?<p className="notice">Este evento não está público agora. Confira o cadastro, a categoria e a lixeira.</p>:n.cancelled_now?<p className="notice">O evento foi cancelado depois da publicação. O aviso de cancelamento está no site.</p>:null}<div className="share-buttons">{n.public_now&&n.slug&&<Link className="button secondary" href={'/evento/'+encodeURIComponent(n.slug)} target="_blank" rel="noopener noreferrer">Ver evento no site</Link>}{!n.read_at&&<button type="button" className="button secondary" disabled={busy} onClick={()=>void load({id:n.id})}>Marcar como lido</button>}</div></article>)}</div>{data?.items.length===100&&<p className="muted">Mostrando até 100 avisos, com os não lidos primeiro. Ao marcar como lidos, os próximos aparecem.</p>}
 </section>}
 </div>;
}
