"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { day, eventTime } from "@/lib/dates";
import {agendaSelection,type AgendaMode} from '@/lib/daily-agenda';
import type { Event } from "@/lib/types";
import { PosterZoom } from "./poster-zoom";

const zone = "America/Sao_Paulo";
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: zone });
const dateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: zone });
const shortDate=new Intl.DateTimeFormat('pt-BR',{timeZone:zone,day:'2-digit',month:'2-digit'});
const cover = (event: Event) => event.cover_url || event.gallery?.[0];
const eventLink = (event: Event) => "/evento/" + event.slug;

export function DailyAgendaPreview({ events, now,period='all',dateFilter='',onViewChange,initialView='day' }: { events: Event[]; now: number;period?:string;dateFilter?:string;onViewChange?:()=>void;initialView?:AgendaMode }) {
  const [chosen, setChosen] = useState("");
  const [view,setMode]=useState<AgendaMode>(initialView),[limit,setLimit]=useState(10);
  const mode:AgendaMode=period==='weekend'?'weekend':period==='week'?'all':dateFilter||period==='today'||period==='tomorrow'?'day':view;
  const dayStrip = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const reduceMotion = useReducedMotion();
  const start = Date.parse(day(new Date(now)) + "T12:00:00-03:00");
  const days = Array.from({ length: 7 }, (_, i) => new Date(start + i * 86400000));
  const selectedDate=dateFilter||(period==='today'?day(new Date(now)):period==='tomorrow'?day(new Date(start+86400000)):chosen);
  const selection=agendaSelection(events,selectedDate,new Date(now),mode);
  const chooseDay=(key:string)=>{setChosen(key);setLimit(10);setMode('day');onViewChange?.()};
  const selected=days.find(date=>day(date)===selection.date)||new Date(selection.date+'T12:00:00-03:00');
  const list=selection.events;
  const featured = list.find(event => event.featured && cover(event)) || list.find(cover) || list[0];
  const poster = featured && cover(featured);

  return (
    <section className="shell daily-preview" aria-labelledby="daily-preview-title">
      <h2 id="daily-preview-title">Agenda por dia</h2>
      <div className="agenda-view-controls" role="group" aria-label="Visualização da agenda">{([['day','Por dia'],['weekend','Fim de semana'],['all','Próximos eventos']] as const).map(([key,label])=><button key={key} type="button" className={mode===key?'active':''} aria-pressed={mode===key} onClick={()=>{setMode(key);setLimit(10);onViewChange?.()}}>{label}</button>)}</div>
      {mode==='day'&&<><div ref={dayStrip} className="daily-preview-days" role="group" aria-label="Próximos sete dias">
        {days.map((date, index) => {
          const key = day(date);
          return (
            <button type="button" key={key} aria-pressed={key === day(selected)} onClick={() => chooseDay(key)}>
              <span>{index === 0 ? "Hoje" : weekday.format(date).replace(".", "")}</span>
              <strong>{key.slice(-2)}</strong>
            </button>
          );
        })}
      </div><label className="agenda-date-picker">Escolher outra data<input type="date" value={selection.date} onChange={event=>chooseDay(event.target.value)}/></label></>}
      <div className="daily-preview-swipe"
        onPointerDown={event => {
          suppressClick.current = false;
          touchStart.current = mode==='day'&&event.pointerType === "touch" && event.isPrimary
            ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
        }}
        onPointerCancel={() => { touchStart.current = null; }}
        onPointerUp={() => { touchStart.current = null; }}
        onPointerMove={event => {
          const start = touchStart.current;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
            touchStart.current = null;
            return;
          }
          if (Math.abs(dx) < 24 || Math.abs(dx) <= 1.4 * Math.abs(dy)) return;
          touchStart.current = null;
          suppressClick.current = true;
          const nextIndex = days.indexOf(selected) + (dx < 0 ? 1 : -1);
          const nextDay = days[nextIndex];
          if (!nextDay) return;
          chooseDay(day(nextDay));
          const strip = dayStrip.current;
          const button = strip?.children[nextIndex];
          if (strip && button instanceof HTMLElement) {
            const bounds = button.getBoundingClientRect();
            const stripBounds = strip.getBoundingClientRect();
            if (bounds.left < stripBounds.left || bounds.right > stripBounds.right) {
              strip.scrollLeft += bounds.left - stripBounds.left - (strip.clientWidth - button.offsetWidth) / 2;
            }
          }
        }}
        onClickCapture={event => {
          if (!event.detail || !suppressClick.current) return;
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}>
      <h3 className="daily-preview-date" aria-live="polite">{mode==='day'?dateLabel.format(selected):mode==='weekend'?'Programação do fim de semana':'Todos os próximos eventos'} <small>· {list.length} {list.length===1?'evento':'eventos'}</small></h3>
      <LazyMotion features={domAnimation} strict>
        <m.div key={mode+day(selected)} initial={reduceMotion ? false : { opacity: 0.55, y: 8 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22 }}>
          {featured ? (
            <>
              <article className="daily-preview-feature">
                {poster && <>
                  <img className="daily-preview-glow" src={poster} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low" />
                  <div className="daily-preview-poster">
                    <img src={poster} alt={"Cartaz de " + featured.title} loading="lazy" decoding="async" draggable={false} />
                    <PosterZoom key={poster} src={poster} title={featured.title} />
                  </div>
                </>}
                <div className="daily-preview-copy">
                  <h4>{featured.title}</h4>
                  <p>{mode!=='day'&&shortDate.format(new Date(featured.starts_at))+' · '}{eventTime(featured)} · {featured.venue_name}</p>
                  <Link href={eventLink(featured)} className="button lime-button">Ver evento <ArrowUpRight size={16} /></Link>
                </div>
              </article>
              <ul className="daily-preview-list">
                {list.slice(0,limit).map(event => (
                  <li key={event.id}>
                    <Link href={eventLink(event)}>
                      <time className={event.time_tbd?'is-time-pending':undefined} dateTime={event.time_tbd?day(event.starts_at):event.starts_at}>{mode!=='day'&&<small>{shortDate.format(new Date(event.starts_at))}</small>}<span className="agenda-clock">{eventTime(event)}</span></time>
                      {cover(event) ? <img src={cover(event)} alt="" loading="lazy" decoding="async" fetchPriority="low" /> : <span aria-hidden="true" />}
                      <span><strong>{event.title}</strong><small>{event.venue_name}</small></span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              {list.length>limit&&<button type="button" className="button secondary" onClick={()=>setLimit(value=>value+10)}>Ver mais eventos ({list.length-limit})</button>}
            </>
          ) : <p className="notice">Nenhum evento nesta seleção. Escolha outra data ou veja os próximos eventos.</p>}
        </m.div>
      </LazyMotion>
      </div>
    </section>
  );
}
