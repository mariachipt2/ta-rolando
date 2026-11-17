"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { day } from "@/lib/dates";
import type { Event } from "@/lib/types";
import { PosterZoom } from "./poster-zoom";

const zone = "America/Sao_Paulo";
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: zone });
const dateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: zone });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: zone });
const cover = (event: Event) => event.cover_url || event.gallery?.[0];
const eventLink = (event: Event) => "/evento/" + event.slug;

export function DailyAgendaPreview({ events, now }: { events: Event[]; now: number }) {
  const [chosen, setChosen] = useState("");
  const reduceMotion = useReducedMotion();
  const start = Date.parse(day(new Date(now)) + "T12:00:00-03:00");
  const days = Array.from({ length: 7 }, (_, i) => new Date(start + i * 86400000));
  const forDay = (date: Date) => {
    const key = day(date);
    return events.filter(event => day(event.starts_at) <= key && day(event.ends_at || event.starts_at) >= key);
  };
  const selected = days.find(date => day(date) === chosen) || days.find(date => forDay(date).length) || days[0];
  const list = forDay(selected).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const featured = list.find(event => event.featured && cover(event)) || list.find(cover) || list[0];
  const poster = featured && cover(featured);

  return (
    <section className="shell daily-preview" aria-labelledby="daily-preview-title">
      <h2 id="daily-preview-title">Agenda por dia</h2>
      <div className="daily-preview-days" role="group" aria-label="Próximos sete dias">
        {days.map((date, index) => {
          const key = day(date);
          return (
            <button type="button" key={key} aria-pressed={key === day(selected)} onClick={() => setChosen(key)}>
              <span>{index === 0 ? "Hoje" : weekday.format(date).replace(".", "")}</span>
              <strong>{key.slice(-2)}</strong>
            </button>
          );
        })}
      </div>
      <h3 className="daily-preview-date" aria-live="polite">{dateLabel.format(selected)}</h3>
      <LazyMotion features={domAnimation} strict>
        <m.div key={day(selected)} initial={reduceMotion ? false : { opacity: 0.55, y: 8 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22 }}>
          {featured ? (
            <>
              <article className="daily-preview-feature">
                {poster && <>
                  <img className="daily-preview-glow" src={poster} alt="" aria-hidden="true" loading="lazy" decoding="async" fetchPriority="low" />
                  <div className="daily-preview-poster">
                    <img src={poster} alt={"Cartaz de " + featured.title} loading="lazy" decoding="async" />
                    <PosterZoom key={poster} src={poster} title={featured.title} />
                  </div>
                </>}
                <div className="daily-preview-copy">
                  <h4>{featured.title}</h4>
                  <p>{time.format(new Date(featured.starts_at))} · {featured.venue_name}</p>
                  <Link href={eventLink(featured)} className="button lime-button">Ver evento <ArrowUpRight size={16} /></Link>
                </div>
              </article>
              <ul className="daily-preview-list">
                {list.map(event => (
                  <li key={event.id}>
                    <Link href={eventLink(event)}>
                      <time dateTime={event.starts_at}>{time.format(new Date(event.starts_at))}</time>
                      {cover(event) ? <img src={cover(event)} alt="" loading="lazy" decoding="async" fetchPriority="low" /> : <span aria-hidden="true" />}
                      <span><strong>{event.title}</strong><small>{event.venue_name}</small></span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="notice">Nenhum evento encontrado para este dia.</p>}
        </m.div>
      </LazyMotion>
    </section>
  );
}
