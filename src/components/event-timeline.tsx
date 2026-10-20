"use client";
import {useState} from 'react';
import {formatInTimeZone} from 'date-fns-tz';
import {ptBR} from 'date-fns/locale';
import type {Event} from '@/lib/types';
import {day,TZ} from '@/lib/dates';
import {timelineGroups,type TimelinePeriod} from '@/lib/timeline';
import {EventCard} from './event-card';
export function EventTimeline({events,error=false}:{events:Event[];error?:boolean}) {
  const [period,setPeriod]=useState<TimelinePeriod>('upcoming'),[query,setQuery]=useState(''),[month,setMonth]=useState(''),[limit,setLimit]=useState(12);
  const groups=timelineGroups(events.filter(e=>(!month||day(e.starts_at).startsWith(month))&&(!query||[e.title,e.venue_name,e.organizer,e.categories?.name].some(v=>v?.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim())))),period);
  const today=day(),count=groups.reduce((n,g)=>n+g.events.length,0);
  return <div className="shell page timeline-page"><span className="eyebrow">CADA DIA, UM NOVO ROLÊ</span><h1>Linha do tempo<span className="lime">.</span></h1><p>Veja os eventos por data, explore o que vem aí e relembre os que já passaram. Horários de Brasília.</p>
    <div className="period-list" role="group" aria-label="Período da linha do tempo">{([['upcoming','Próximos'],['past','Anteriores'],['all','Todos']] as const).map(([value,label])=><button key={value} className={period===value?'active':''} aria-pressed={period===value} onClick={()=>{setPeriod(value);setLimit(12)}}>{label}</button>)}</div>
    <div className="timeline-filters"><label>Buscar evento ou local<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(12)}} placeholder="Nome, local ou organizador"/></label><label>Mês<input type="month" value={month} onChange={e=>{setMonth(e.target.value);setLimit(12)}}/></label>{(query||month)&&<button className="button secondary" onClick={()=>{setQuery('');setMonth('');setLimit(12)}}>Limpar busca</button>}</div>
    {error?<p className="notice" role="alert">Não foi possível carregar os eventos. Atualize a página para tentar novamente.</p>:<><p className="muted" role="status">{count} {count===1?'evento':'eventos'} nesta seleção{period==='past'?' · Mais recentes primeiro':''}.</p>{!groups.length?<div className="empty">Nenhum evento encontrado neste período. Experimente outra seleção.</div>:<ol className="event-timeline">{groups.slice(0,limit).map(group=><li className="timeline-day" key={group.date}><div className="timeline-date"><span className="timeline-dot"/><h2><time dateTime={group.date}>{formatInTimeZone(group.date+'T12:00:00Z',TZ,'dd MMM yyyy',{locale:ptBR})}</time></h2><span>{formatInTimeZone(group.date+'T12:00:00Z',TZ,'EEEE',{locale:ptBR})}</span>{group.date===today&&<strong className="lime">Hoje</strong>}</div><div className="event-grid">{group.events.map(event=><EventCard key={event.id} event={event}/>)}</div></li>)}</ol>}{groups.length>limit&&<button className="button secondary load-more" onClick={()=>setLimit(n=>n+12)}>Ver mais datas</button>}</>}
  </div>;
}
