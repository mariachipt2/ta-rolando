"use client";
import {useNow} from '@/lib/use-now';
import {useState} from 'react';
import Link from 'next/link';
import {ChevronLeft,ChevronRight,ArrowUpRight} from 'lucide-react';
import {formatInTimeZone} from 'date-fns-tz';
import {ptBR} from 'date-fns/locale';
import type {Event} from '@/lib/types';
import {day,TZ,upcoming} from '@/lib/dates';
import {timelineGroups,timelineMonths,shiftMonth,timelineOptions,matchesTimelineFilters,type TimelinePrice,type TimelinePeriod} from '@/lib/timeline';
import {forChildren} from '@/lib/event-discovery';

const monthLabel=(month:string)=>formatInTimeZone(month+'-01T12:00:00Z',TZ,'MMMM yyyy',{locale:ptBR});
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function EventTimeline({events,error=false}:{events:Event[];error?:boolean}) {
 const now=new Date(useNow());
 const currentMonth=day(now).slice(0,7);
 const [period,setPeriod]=useState<TimelinePeriod>('all'),[query,setQuery]=useState(''),[month,setMonth]=useState(currentMonth),[childrenOnly,setChildrenOnly]=useState(false);
 const [price,setPrice]=useState<TimelinePrice>('all'),[organizer,setOrganizer]=useState(''),[neighborhood,setNeighborhood]=useState('');
 const organizers=timelineOptions(events,'organizer'),neighborhoods=timelineOptions(events,'neighborhood');
 const months=timelineMonths(events);
 const groups=timelineGroups(events.filter(e=>matchesTimelineFilters(e,{price,organizer,neighborhood})&&day(e.starts_at).startsWith(month)&&(!childrenOnly||forChildren(e))&&(!query||[e.title,e.venue_name,e.organizer,e.categories?.name].some(v=>v&&normalize(v).includes(normalize(query))))),period,now);
 const today=day(now),count=groups.reduce((n,g)=>n+g.events.length,0);
 return <div className="shell page timeline-page"><span className="eyebrow">SUA PROGRAMAÇÃO, MÊS A MÊS</span><h1>Linha do tempo<span className="lime">.</span></h1><p>Confira o mês inteiro em uma lista rápida. Toque em um evento para ver os detalhes. Horários de Brasília.</p>
 <section className="month-browser" aria-label="Navegação por mês">
  <div className="month-heading"><button className="button secondary" aria-label="Mês anterior" onClick={()=>setMonth(shiftMonth(month,-1))}><ChevronLeft size={20}/></button><h2 aria-live="polite">{monthLabel(month)}</h2><button className="button secondary" aria-label="Próximo mês" onClick={()=>setMonth(shiftMonth(month,1))}><ChevronRight size={20}/></button></div>
  <div className="month-controls"><label>Ir para o mês<input type="month" value={month} onChange={e=>{if(/^\d{4}-\d{2}$/.test(e.target.value))setMonth(e.target.value)}}/></label><button className="button secondary" onClick={()=>setMonth(currentMonth)}>Mês atual</button><label>Meses com eventos<select value={months.some(m=>m.month===month)?month:''} onChange={e=>{if(e.target.value)setMonth(e.target.value)}}><option value="" disabled>Escolha um mês</option>{months.map(m=><option key={m.month} value={m.month}>{monthLabel(m.month)} · {m.count} {m.count===1?'evento':'eventos'}</option>)}</select></label></div>
 </section>
 <div className="timeline-filters"><label>Buscar neste mês<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome, local, organizador ou categoria"/></label><label>Entrada<select value={price} onChange={e=>setPrice(e.target.value as TimelinePrice)}><option value="all">Todas</option><option value="free">Gratuito</option><option value="paid">Pago</option></select></label><label>Organizador<select value={organizer} onChange={e=>setOrganizer(e.target.value)}><option value="">Todos os organizadores</option>{organizers.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><label>Bairro<select value={neighborhood} onChange={e=>setNeighborhood(e.target.value)}><option value="">Todos os bairros</option>{neighborhoods.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><button className={'button secondary '+(childrenOnly?'selected':'')} aria-pressed={childrenOnly} onClick={()=>setChildrenOnly(!childrenOnly)}>Para crianças</button>{(query||childrenOnly||period!=='all'||price!=='all'||organizer||neighborhood)&&<button className="button secondary" onClick={()=>{setQuery('');setChildrenOnly(false);setPeriod('all');setPrice('all');setOrganizer('');setNeighborhood('')}}>Limpar filtros</button>}</div>
 <div className="period-list" role="group" aria-label="Período da linha do tempo">{([['all','Todos do mês'],['upcoming','Próximos'],['past','Anteriores']] as const).map(([value,label])=><button key={value} className={period===value?'active':''} aria-pressed={period===value} onClick={()=>setPeriod(value)}>{label}</button>)}</div>
 {error?<p className="notice" role="alert">Não foi possível carregar os eventos. Atualize a página para tentar novamente.</p>:<><p className="muted" role="status">{count} {count===1?'evento':'eventos'} em {monthLabel(month)}{period==='past'?' · Mais recentes primeiro':''}.{childrenOnly&&' Somente eventos adequados para crianças.'}</p>{!groups.length?<div className="empty">Nenhum evento nesta seleção. Escolha outro mês ou limpe os filtros.</div>:<ol className="monthly-events">{groups.map(group=><li className="monthly-day" key={group.date}><h2 className="monthly-day-label"><time dateTime={group.date}>{formatInTimeZone(group.date+'T12:00:00Z',TZ,"dd '·' EEEE",{locale:ptBR})}</time>{group.date===today&&<span>Hoje</span>}</h2><ul>{group.events.map(event=><li key={event.id}><Link className="monthly-event-row" href={'/evento/'+event.slug}><time className="monthly-time" dateTime={event.starts_at}>{formatInTimeZone(event.starts_at,TZ,'HH:mm')}</time><div className="monthly-event-info"><h3>{event.title}</h3><p>{event.venue_name}{event.neighborhood||event.city?' · '+(event.neighborhood||event.city):''}</p><div className="monthly-tags"><span>{event.categories?.name||'Evento'}</span>{event.family_friendly===true&&<span>Para crianças</span>}{event.status==='cancelled'?<strong className="monthly-cancelled">Cancelado</strong>:<>{event.change_notice&&<strong>Alterado</strong>}{!upcoming(event,now)&&<span>Encerrado</span>}</>}</div></div><span className="monthly-price">{event.is_free?'Grátis':event.price||'Pago'}</span><span className="monthly-open">Ver evento <ArrowUpRight size={16}/></span></Link></li>)}</ul></li>)}</ol>}</>}
 </div>;
}

