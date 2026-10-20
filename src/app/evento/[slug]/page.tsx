import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  MapPin,
  ArrowLeft,
  Navigation,
  Ticket,
  UserRound,
} from "lucide-react";
import { publicData } from "@/lib/data";
import { displayDate, upcoming } from "@/lib/dates";
import { Attendance } from "@/components/attendance";
import {FollowOrganizer} from '@/components/follow-organizer';
import {SimilarEvents} from '@/components/similar-events';
import {SharePoster} from '@/components/share-poster';
import { Share } from "@/components/share";
import {EventNotice} from '@/components/event-notice';
import {ReportEvent} from '@/components/report-event';
import {childrenLabel} from '@/lib/age-options';
import {InstagramLink} from '@/components/instagram-link';
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { events } = await publicData();
  const e = events.find((e) => e.slug === slug);
  return e
    ? {
        title: e.title,
        description: e.description.slice(0, 160),
        alternates: { canonical: "/evento/" + e.slug },
        openGraph: {
          title: e.title,
          description: e.description.slice(0, 160),
          images: e.cover_url ? [e.cover_url] : [],
          type: "website" as const,
        },
      }
    : { title: "Evento não encontrado" };
}
export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { events, error } = await publicData();
  if (error) throw Error("Não foi possível consultar o evento.");
  const e = events.find((e) => e.slug === slug);
  if (!e) notFound();
  const address = `${e.address}, ${e.neighborhood}, ${e.city} - ${e.state}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.starts_at,
    ...(e.ends_at ? { endDate: e.ends_at } : {}),
    description: e.description,
    image: e.cover_url ? [e.cover_url] : undefined,
    eventStatus:
      e.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.venue_name,
      address: {
        "@type": "PostalAddress",
        streetAddress: e.address,
        addressLocality: e.city,
        addressRegion: e.state,
        addressCountry: "BR",
      },
    },
    organizer: { "@type": "Organization", name: e.organizer || e.venue_name },
    isAccessibleForFree: e.is_free,
  };
  return (
    <div className="shell detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <Link href="/#explorar" className="back">
        <ArrowLeft size={17} /> Explorar eventos
      </Link>
      <div className="detail-cover">
        {e.cover_url ? (
          <Image src={e.cover_url} alt={e.title} fill priority sizes="100vw" />
        ) : (
          <div className="cover-placeholder">
            <span>tá rolando</span>
          </div>
        )}
      </div>
      <div className="detail-grid">
        <article>
          <span className="eyebrow">
            {e.categories?.name} · {e.city}
          </span>
          <h1>{e.title}</h1>
          {(e.status === "cancelled" || !upcoming(e)) && (
            <p className="notice">
              {e.status === "cancelled"
                ? "Este evento foi cancelado."
                : "Este evento já encerrou. As informações ficam disponíveis para consulta."}
            </p>
          )}
          <div className="event-facts">
            <p>
              <CalendarDays />
              {displayDate(e.starts_at)}
              {e.ends_at && " até " + displayDate(e.ends_at)}
            </p>
            <p>
              <MapPin />
              {e.venue_name} — {address}
            </p>
            <p>
              <Ticket />
              {e.is_free
                ? "Entrada gratuita"
                : e.price || "Consulte o organizador"}{" "}
              · Classificação: {e.age_rating || "Não informada"}
            </p>
            <p>
              <UserRound />
              Organização: {e.organizer || "Não informada"}
            </p>
          </div>
          <p className="family-info">{childrenLabel(e.family_friendly)}</p>
          <EventNotice event={e}/>
          <InstagramLink url={e.instagram_url}/>
          <FollowOrganizer event={e}/>
          <h2>Sobre esse rolê</h2>
          <p className="description">{e.description}</p>
          {e.additional_info && (
            <>
              <h2>Bom saber</h2>
              <p className="description">{e.additional_info}</p>
            </>
          )}
          <h2>Como chegar</h2>
          <p>{address}</p>
          <div className="share-buttons">
            <a
              className="button secondary"
              target="_blank"
              rel="noopener noreferrer"
              href={
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(e.venue_name + " " + address)
              }
            >
              <MapPin size={17} /> Google Maps
            </a>
            <a
              className="button secondary"
              target="_blank"
              rel="noopener noreferrer"
              href={
                "https://waze.com/ul?q=" +
                encodeURIComponent(address) +
                "&navigate=yes"
              }
            >
              <Navigation size={17} /> Waze
            </a>
          </div>
          {e.gallery.length > 0 && (
            <div className="gallery">
              {e.gallery.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  width={600}
                  height={400}
                  alt={`${e.title}, imagem ${i + 1}`}
                />
              ))}
            </div>
          )}
        </article>
        <aside className="detail-aside">
          <span className="eyebrow">SEU PRÓXIMO ENCONTRO</span>
          <h2>Bora nesse?</h2>
          <Attendance
            id={e.id}
            count={e.interest_count}
            disabled={e.status === "cancelled" || !upcoming(e)}
          />
          <a className="button secondary" href={`/api/calendar/${e.id}`}>
            <CalendarDays size={17} /> Adicionar ao calendário
          </a>
          <Share title={e.title} id={e.id} ticket={e.ticket_url} />
          <SharePoster key={e.updated_at||e.id} event={e}/>
          <ReportEvent id={e.id}/>
        </aside>
      </div>
      <SimilarEvents event={e} events={events}/>
    </div>
  );
}
