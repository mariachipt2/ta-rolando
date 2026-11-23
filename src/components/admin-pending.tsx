"use client";
import {useState} from 'react';
import {Trash2} from 'lucide-react';
import type {Event,EventSubmission} from '@/lib/types';
import {pendingEventItems} from '@/lib/event-discovery';
import {displayDate} from '@/lib/dates';
import {useNow} from '@/lib/use-now';
export function AdminPending({events,submissions,onEdit,onTrash,onSubmissions,busy=false}:{events:Event[];submissions:EventSubmission[];onEdit:(e:Event)=>void;onTrash:(e:Event)=>void;onSubmissions:()=>void;busy?:boolean}){
 const [filter,setFilter]=useState('all');
 const now=new Date(useNow());
 const items=pendingEventItems(events,now);
 const pending=submissions.filter(s=>s.status==='pending').length;
 const visible=items.filter(item=>filter==='all'||item.issues.some(issue=>issue.type===filter));
 return <section className="admin-pending">
  <h2>Pendências para revisar</h2>
  <p>Revise os dados dos próximos eventos e dos rascunhos. Eventos encerrados, cancelados ou na lixeira não entram nesta lista.</p>
  <p className="muted">Fotos na galeria também contam. Para endereços sem número, informe s/n. Mover para a lixeira retira o evento da agenda e permite restaurá-lo depois.</p>
  <div className="pending-suggestions panel"><div><strong>{pending} {pending===1?'sugestão aguardando análise':'sugestões aguardando análise'}</strong><p className="muted">Confira os envios antes de aceitar ou recusar.</p></div><button className="button secondary" disabled={busy} onClick={onSubmissions}>Revisar sugestões</button></div>
  <div className="period-list" role="group" aria-label="Tipo de pendência">{[['all','Todas'],['photo','Sem foto'],['address','Endereço a revisar']].map(([value,label])=><button key={value} aria-pressed={filter===value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{label} ({items.filter(item=>value==='all'||item.issues.some(i=>i.type===value)).length})</button>)}</div>
  <div className="admin-list">{visible.map(({event,issues})=><article className="admin-row" key={event.id}>
   <div><h3>{event.title}</h3><p>{displayDate(event.starts_at,event.time_tbd)}</p><ul className="pending-reasons">{issues.map(issue=><li key={issue.type}>{issue.label}</li>)}</ul></div>
   <div className="row-actions"><button className="button secondary" disabled={busy} onClick={()=>onEdit(event)}>Completar cadastro</button><button className="button secondary" disabled={busy} aria-label={'Mover para a lixeira: '+event.title} onClick={()=>onTrash(event)}><Trash2 size={17}/>Mover para a lixeira</button></div>
  </article>)}{!visible.length&&<div className="empty">Nenhuma pendência de cadastro nesta seleção.</div>}</div>
 </section>;
}
