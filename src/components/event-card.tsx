import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowUpRight, Users, CalendarDays } from "lucide-react";
import type { Event } from "@/lib/types";
import { displayDate } from "@/lib/dates";
export function EventCard({ event: e, rank }: { event: Event; rank?: number }) {
  return (
    <article className="event-card">
      <Link href={"/evento/" + e.slug} className="cover">
        {e.cover_url ? (
          <Image
            src={e.cover_url}
            alt={e.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
          />
        ) : (
          <div className="cover-placeholder">
            <span>tá rolando?</span>
            <CalendarDays size={54} />
          </div>
        )}
        <span className={"price-tag " + (e.is_free ? "free" : "")}>
          {e.status === "cancelled"
            ? "Cancelado"
            : e.is_free
              ? "Entrada gratuita"
              : e.price || "Evento pago"}
        </span>
        {rank && <b className="rank">#{rank}</b>}
      </Link>
      <div className="card-body">
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
          <span>
            <Users size={15} />
            {e.interest_count}{" "}
            {e.interest_count === 1 ? "pessoa vai" : "pessoas vão"}
          </span>
          <Link href={"/evento/" + e.slug}>
            Ver evento <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
