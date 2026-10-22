import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Radio, MapPin, CalendarDays, ArrowLeft } from "lucide-react";
import {SiteNavigation} from '@/components/site-navigation';
import { Discover } from "@/components/discover";
import { Agenda } from "@/components/agenda";
import {CompareTray,CompareButton} from '@/components/compare-selection';
import {CompareEvents} from '@/components/compare-events';
import {ProgramBuilder} from '@/components/program-builder';
import {SharedProgram} from '@/components/shared-program';
import {OrganizerHub} from '@/components/organizer-hub';
import {WeekendSummary} from '@/components/weekend-summary';
import {FollowOrganizer} from '@/components/follow-organizer';
import {SimilarEvents} from '@/components/similar-events';
import {SharePoster} from '@/components/share-poster';
import {EventTimeline} from '@/components/event-timeline';
import { AdminLogin } from "@/components/admin-login";
import { AdminPanel } from "@/components/admin-panel";
import { Attendance } from "@/components/attendance";
import { Share } from "@/components/share";
import { CalendarDownload } from "@/components/calendar-download";
import {EventNotice} from '@/components/event-notice';
import {ReportEvent} from '@/components/report-event';
import {childrenLabel} from '@/lib/age-options';
import {InstagramLink} from '@/components/instagram-link';
import {SubmitEvent} from '@/components/submit-event';
import Privacy from "@/app/privacidade/page";
import { configureTransport } from "@/lib/transport";
import { displayDate, upcoming } from "@/lib/dates";
import type { Event } from "@/lib/types";
import { transport, loadPublic, loadAdmin, configured } from "./api";
import "@/app/globals.css";
configureTransport(transport);
const route = () => location.hash.slice(1).split("?")[0] || "/";
function Detail({ event: e,events }: { event: Event;events:Event[] }) {
  const address = `${e.address}, ${e.neighborhood}, ${e.city} - ${e.state}`;
  return (
    <div className="shell detail">
      <a className="back" href="#/">
        <ArrowLeft size={17} /> Explorar eventos
      </a>
      <div className="detail-cover">
        {e.cover_url ? (
          <img
            src={e.cover_url}
            alt={e.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="cover-placeholder">tá rolando</div>
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
                : "Este evento já encerrou."}
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
              {e.is_free
                ? "Entrada gratuita"
                : e.price || "Consulte o organizador"}{" "}
              · Classificação: {e.age_rating || "Não informada"}
            </p>
            <p>Organização: {e.organizer || "Não informada"}</p>
          </div>
          <p className="family-info">{childrenLabel(e.family_friendly)}</p>
          <EventNotice event={e}/>
          <InstagramLink url={e.instagram_url}/>
          <FollowOrganizer event={e}/>
          <CompareButton id={e.id} title={e.title}/>
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
              href={
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(e.venue_name + " " + address)
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Maps
            </a>
            <a
              className="button secondary"
              href={
                "https://waze.com/ul?q=" +
                encodeURIComponent(address) +
                "&navigate=yes"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Waze
            </a>
          </div>
          <div className="gallery">
            {e.gallery.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`${e.title}, imagem ${i + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </article>
        <aside className="detail-aside">
          <span className="eyebrow">SEU PRÓXIMO ENCONTRO</span>
          <h2>Bora nesse?</h2>
          <Attendance
            id={e.id}
            count={e.interest_count}
            disabled={!upcoming(e) || e.status === "cancelled"}
          />
          <CalendarDownload id={e.id} />
          <Share title={e.title} id={e.id} ticket={e.ticket_url} />
          <SharePoster key={e.updated_at||e.id} event={e}/>
          <ReportEvent id={e.id}/>
        </aside>
      </div>
      <SimilarEvents event={e} events={events}/>
    </div>
  );
}
function App() {
  const [path, setPath] = useState(route),
    [revision, setRevision] = useState(0),
    [data, setData] = useState<Awaited<ReturnType<typeof loadPublic>> | null>(
      null,
    ),
    [admin, setAdmin] = useState<Awaited<ReturnType<typeof loadAdmin>>>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const change = () => {
      setPath(route());
      setRevision((n) => n + 1);
      window.scrollTo(0, 0);
    };
    const refresh = () => setRevision((n) => n + 1);
    window.addEventListener("hashchange", change);
    window.addEventListener("tr:refresh", refresh);
    const click = (event: MouseEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.button !== 0
      )
        return;
      const a = (event.target as Element).closest<HTMLAnchorElement>("a");
      const href = a?.getAttribute("href");
      if (href?.startsWith("/")) {
        event.preventDefault();
        location.hash = href;
      } else if (href?.startsWith("#") && !href.startsWith("#/")) {
        event.preventDefault();
        document
          .getElementById(href.slice(1))
          ?.scrollIntoView({ behavior: "smooth" });
      }
    };
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("tr:refresh", refresh);
      document.removeEventListener("click", click);
    };
  }, []);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const result = await loadPublic();
        if (!current) return;
        setData(result);
        if (path === "/admin") {
          const result = await loadAdmin();
          if (!current) return;
          setAdmin(result);
        }
        if (current) {
          setLoading(false);
          const anchor = new URLSearchParams(
            location.hash.split("?")[1] || "",
          ).get("section");
          if (anchor)
            requestAnimationFrame(() =>
              document.getElementById(anchor)?.scrollIntoView(),
            );
        }
      } catch {
        if (current) {
          setError(
            "Não foi possível carregar os dados. Confira a conexão e as migrations do Supabase.",
          );
          setLoading(false);
        }
      }
    })();
    return () => {
      current = false;
    };
  }, [path, revision]);
  const event = path.startsWith("/evento/")
    ? data?.events.find((e) => e.slug === decodeURIComponent(path.slice(8)))
    : undefined;
  useEffect(() => {
    document.title = event
      ? event.title + " | Tá Rolando"
      : path === "/admin"
        ? "Administração | Tá Rolando"
        : path === '/comparar' ? 'Comparar rolês | Tá Rolando'
        : path === '/programacao' ? 'Minha programação | Tá Rolando'
        : path === '/programacao-compartilhada' ? 'Programação compartilhada | Tá Rolando'
        : path === '/organizadores' ? 'Organizadores | Tá Rolando'
        : path === '/fim-de-semana' ? 'Resumo do fim de semana | Tá Rolando'
        : path === '/linha-do-tempo'
          ? 'Linha do tempo | Tá Rolando'
        : "Tá Rolando — Ipatinga";
  }, [path, event]);
  return (
    <>
      <a className="skip" href="#main">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="shell nav site-nav">
          <a className="logo" href="#/" aria-label="Tá Rolando, início">
            <Radio size={27} /> tá rolando
          </a>
          <span className="location">
            <MapPin size={14} /> Ipatinga, MG
          </span>
          <SiteNavigation path={path}/>
        </div>
      </header>
      <main id="main">
        {error ? (
          <div className="shell page">
            <p role="alert">{error}</p>
            <button
              className="button secondary"
              onClick={() => setRevision((n) => n + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="shell page" role="status">
            Preparando seu próximo rolê…
          </div>
        ) : path === "/admin" ? (
          <div className="shell page">
            {admin ? (
              <AdminPanel key={revision} {...admin} />
            ) : (
              <AdminLogin
                configured={configured}
                configurationHint="Configure as variáveis públicas do Supabase no GitHub Actions e publique novamente. Consulte o guia GITHUB-PAGES.md do projeto."
              />
            )}
          </div>
        ) : path === "/agenda" ? (
          <div className="shell page">
            <span className="eyebrow">TEM COISA BOA TE ESPERANDO</span>
            <h1>
              Minha agenda<span className="lime">.</span>
            </h1>
            <p className="notice">
              Sua agenda pertence a este navegador. Limpar os dados ou trocar de
              dispositivo pode apagar seu acesso às marcações.
            </p>
            <Agenda events={data?.events || []} />
          </div>
        ) : path === '/comparar' ? (
          <CompareEvents events={data?.events||[]} error={data?.error}/>
        ) : path === '/programacao' ? (
          <ProgramBuilder events={data?.events||[]} error={data?.error}/>
        ) : path === '/programacao-compartilhada' ? (
          <SharedProgram events={data?.events||[]} error={data?.error} ids={new URLSearchParams(location.hash.split('?')[1]||'').get('eventos')} title={new URLSearchParams(location.hash.split('?')[1]||'').get('titulo')}/>
        ) : path === '/organizadores' ? (
          <OrganizerHub events={data?.events||[]} error={data?.error}/>
        ) : path === '/fim-de-semana' ? (
          <WeekendSummary key={revision} events={data?.events||[]} error={data?.error} initialStart={new URLSearchParams(location.hash.split('?')[1]||'').get('inicio')}/>
        ) : path === '/linha-do-tempo' ? (
          <EventTimeline events={data?.events||[]} error={data?.error}/>
        ) : path === "/privacidade" ? (
          <Privacy />
        ) : path.startsWith("/evento/") ? (
          event ? (
            <Detail key={event.id} event={event} events={data?.events||[]} />
          ) : (
            <div className="shell page">
              <h1>Esse rolê não está por aqui.</h1>
              <a className="button lime-button" href="#/">
                Voltar ao início
              </a>
            </div>
          )
        ) : (
          <><Discover {...data!} /><SubmitEvent categories={data?.categories||[]}/></>
        )}
      </main>
      <footer className="shell">
        <a href="#/" className="logo">
          tá rolando
        </a>
        <p>
          Feito para quem vive a cidade.
          <br />
          Ipatinga · Vale do Aço · MG
        </p>
        <a href="#/privacidade">Privacidade</a>
        <span>Não fique de fora. ♡</span>
      </footer>
      <CompareTray hidden={path==='/admin'||path==='/comparar'}/>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
if (
  "serviceWorker" in navigator &&
  !location.hostname.match(/^(localhost|127\.)/)
)
  navigator.serviceWorker.register("./sw.js").catch(() => {});

