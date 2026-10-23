import Link from "next/link";
import { MapPin, ArrowUpRight, Users, CalendarDays } from "lucide-react";
import type { Event } from "@/lib/types";
import { displayDate,upcoming } from "@/lib/dates";
import {CompareButton} from './compare-selection';
import {EventNotice} from "./event-notice";
import {InstagramLink} from './instagram-link';
export function EventCard({ event: e, rank }: { event: Event; rank?: number }) {
  const cover=e.cover_url||e.gallery?.[0];
  return (
    <article className="event-card">
      <Link href={"/evento/" + e.slug} className="cover">
        {cover ? (
          <img
            src={cover}
            alt={e.title}
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="cover-placeholder">
            <span>tá rolando</span>
            <CalendarDays size={54} />
          </div>
        )}
        <span className={"price-tag " + (e.is_free ? "free" : "")}>
          {e.status === "cancelled"
            ? "Cancelado"
            : !upcoming(e)
              ? "Encerrado"
              : e.is_free
              ? "Entrada gratuita"
              : e.price || "Evento pago"}
        </span>
        {rank && <b className="rank">#{rank}</b>}
      </Link>
      <div className="card-body">
        <EventNotice event={e} compact/>
        <span className="eyebrow">{e.categories?.name || "Evento"}</span>
        <Link href={"/evento/" + e.slug}>
          <h3>{e.title}</h3>
        </Link>
        <p className="event-date">
          <CalendarDays size={15} />
          {displayDate(e.starts_at)}
        </p>
        <p>
          <MapPin size={15} />
          {e.venue_name} · {e.neighborhood || e.city}
        </p>
        <div className="card-bottom">
          {e.interest_count>0&&<span>
            <Users size={15} />
            {e.interest_count}{" "}
            {e.interest_count === 1 ? "pessoa vai" : "pessoas vão"}
          </span>}
          <div className="card-links">
          <InstagramLink url={e.instagram_url} compact/>
          <Link href={"/evento/" + e.slug}>
            Ver evento <ArrowUpRight size={18} />
          </Link>
          </div>
        </div>
        <CompareButton id={e.id} title={e.title}/>
      </div>
    </article>
  );
}
