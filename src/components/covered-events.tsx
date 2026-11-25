"use client";
import {useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,Umbrella,Search} from 'lucide-react';
import type {Event} from '@/lib/types';
import {useNow} from '@/lib/use-now';
import {coveredEvents} from '@/lib/covered-events';
import {EventCard} from './event-card';
export function CoveredEvents({events,error=false}:{events:Event[];error?:boolean}) {
 const now=useNow(),[period,setPeriod]=useState('all'),[entry,setEntry]=useState('all'),[query,setQuery]=useState(''),[limit,setLimit]=useState(9);
 const selected=coveredEvents(events,new Date(now),period,entry,query);
 const reset=()=>{setPeriod('all');setEntry('all');setQuery('');setLimit(9)};
 return <div className="shell page covered-page">
  <Link className="back" href="/"><ArrowLeft size={17}/>Voltar para a agenda</Link>
  <div className="covered-heading"><span className="covered-icon" aria-hidden="true"><Umbrella size={34}/></span><div><span className="eyebrow">O ROLÊ TEM PLANO B</span><h1>Tá chovendo?</h1></div></div>
  <p className="covered-lead">Encontre seu próximo rolê em um local coberto.</p>
  <p className="muted">Só entram eventos cadastrados como <strong>Coberto</strong>. Ambientes mistos, ao ar livre ou sem classificação ficam fora desta seleção. Confira os detalhes com a organização antes de sair.</p>
  <div className="covered-filters">
   <label className="search"><Search size={20}/><input aria-label="Buscar evento, local ou bairro coberto" placeholder="Evento, local ou bairro..." value={query} onChange={e=>{setQuery(e.target.value);setLimit(9)}}/></label>
   <label>Quando<select value={period} onChange={e=>{setPeriod(e.target.value);setLimit(9)}}><option value="all">Qualquer dia</option><option value="today">Hoje</option><option value="tomorrow">Amanhã</option><option value="weekend">Fim de semana</option><option value="week">Próximos 7 dias</option></select></label>
   <label>Entrada<select value={entry} onChange={e=>{setEntry(e.target.value);setLimit(9)}}><option value="all">Todas</option><option value="free">Gratuitos</option><option value="paid">Pagos</option></select></label>
  </div>
  {error?<p className="notice" role="alert">Não conseguimos carregar os eventos. Atualize a página para tentar novamente.</p>:<>
   <div className="covered-results-heading"><p role="status">{selected.length} {selected.length===1?'rolê em local coberto':'rolês em locais cobertos'}</p>{(period!=='all'||entry!=='all'||query)&&<button className="clear" onClick={reset}>Limpar filtros</button>}</div>
   {selected.length?<><div className="event-grid">{selected.slice(0,limit).map(event=><EventCard key={event.id} event={event}/>)}</div>{selected.length>limit&&<button className="button secondary load-more" onClick={()=>setLimit(limit+9)}>Mostrar mais eventos</button>}</>:<div className="empty"><Umbrella size={28}/><div><h2>Nenhum rolê coberto nesta seleção por enquanto.</h2><p>Tente outro dia ou confira a agenda completa.</p><Link className="button secondary" href="/#explorar">Ver todos os eventos</Link></div></div>}
  </>}
 </div>;
}
