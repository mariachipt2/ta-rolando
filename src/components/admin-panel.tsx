"use client";
import {useNow} from '@/lib/use-now';
import {AdminSpecialTheme} from './admin-special-theme';
import {AdminNotifications} from './admin-notifications';
import {AdminVenues} from './admin-venues';
import {venueEvent} from '@/lib/venues';
import { request, navigate } from "@/lib/transport";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  LogOut,
  Copy,
  Pencil,
  Trash2,
  Eye,
  BarChart3,
} from "lucide-react";
import type { Event, Category, EventSubmission, SaveState, EventReport } from "@/lib/types";
import { displayDate, upcoming, day } from "@/lib/dates";
import { EventForm } from "./event-form";
import {AdminEventPreview} from './admin-event-preview';
import { SubmissionList } from "./submission-list";
import { SaveConfirmation, savedTime } from "./save-confirmation";
import {EventHistory} from './event-history';
import {EventTrash} from './event-trash';
import {AdminDiscovery,discoveryHasResults} from './admin-discovery';
import {AdminExport} from './admin-export';
import {AdminPending} from './admin-pending';
import {eventIssues} from '@/lib/event-discovery';
import {AdminReports} from './admin-reports';
type Metric = {
  event_id: string;
  day: string;
  views: number;
  ticket_clicks: number;
  interests_added: number;
  interests_removed: number;
};
export function AdminPanel({
  events:allEvents,
  reports,
  categories,
  metrics,
  submissions,
  saveState,
}: {
  events: Event[];
  reports: EventReport[];
  categories: Category[];
  metrics: Metric[];
  submissions: EventSubmission[];
  saveState: SaveState;
}) {
  const now=new Date(useNow());
  const events=allEvents.filter(e=>!e.deleted_at);
  const [historyEvent,setHistoryEvent]=useState<Event|null>(null);
  const [previewEvent,setPreviewEvent]=useState<Event|null>(null);
  const router = useRouter();
  const [edit, setEdit] = useState<Partial<Event> | null>(null),
    [tab, setTab] = useState(()=>discoveryHasResults()?"discovery":"events"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState(""),
    [category, setCategory] = useState<Partial<Category> | null>(null),
    [stats, setStats] = useState<string | null>(null),
    [reviewId, setReviewId] = useState<string | undefined>(),
    [receipt, setReceipt] = useState(saveState.saved_at),
    [dirty,setDirty]=useState(false);
  const refresh = (savedAt: string) => {
    setReceipt(savedAt);
    if(!edit?.id&&edit?.additional_info?.startsWith('Fonte da busca:'))setTab('discovery');
    setHistoryEvent(null);
    setEdit(null);
    setReviewId(undefined);
    router.refresh();
  };
  const pendingEvents=events.filter(e=>eventIssues(e).length),pendingSuggestions=submissions.filter(s=>s.status==='pending').length;
  const openPending=(event?:Event)=>{if(dirty&&!confirm('Há alterações não salvas. Sair sem salvar?'))return;setReviewId(undefined);setEdit(event||null);setTab(event?'events':'pending')};
  const total = events.reduce((n, e) => n + e.interest_count, 0);
  const metricList = metrics.filter((m) => !stats || m.event_id === stats);
  const days = Array.from({ length: 14 }, (_, i) =>
    day(new Date(Date.now() - (13 - i) * 86400000)),
  );
  const values = days.map((d) =>
    metricList
      .filter((m) => m.day === d)
      .reduce((n, m) => n + m.interests_added, 0),
  );
  const max = Math.max(1, ...values);
  async function remove(e: Event) {
    if (
      !confirm(
        `Mover “${e.title}” para a lixeira? Você poderá restaurá-lo depois, com as marcações preservadas.`,
      )
    )
      return;
    setBusy(true);
    try {
      const r = await request("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: e.id }),
      });
      const result=await r.json();
      if (!r.ok||!result.saved_at) throw Error("Não foi possível confirmar a exclusão no Supabase.");
      setReceipt(result.saved_at);
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>
            A cidade em movimento<span className="lime">.</span>
          </h1>
        </div>
        <div className="admin-header-actions"><AdminNotifications/><button
          className="button secondary"
          onClick={async () => {
            await request("/api/admin/login", { method: "DELETE" });
            location.reload();
          }}
        >
          <LogOut size={17} /> Sair
        </button></div>
      </div>
      <SaveConfirmation at={receipt} />
      {(pendingEvents.length>0||pendingSuggestions>0)&&<div className="pending-summary"><p><strong>Para revisar:</strong> {pendingEvents.length} {pendingEvents.length===1?'evento com dados pendentes':'eventos com dados pendentes'} · {pendingSuggestions} {pendingSuggestions===1?'sugestão aguardando análise':'sugestões aguardando análise'}.</p><button className="button secondary" onClick={()=>openPending()}>Ver pendências</button></div>}
      <div className="stats-grid">
        {[
          ["Eventos cadastrados", events.length],
          ["Futuros", events.filter((e) => upcoming(e,now)).length],
          ["Encerrados", events.filter((e) => !upcoming(e,now)).length],
          [
            "Publicados",
            events.filter(
              (e) =>
                e.status === "published" ||
                (e.status === "scheduled" &&
                  !!e.publish_at &&
                  new Date(e.publish_at) <= now),
            ).length,
          ],
          ["Rascunhos", events.filter((e) => e.status === "draft").length],
          ["Marcações “Eu vou!”", total],
        ].map(([t, n]) => (
          <div className="stat" key={t}>
            <span>{t}</span>
            <strong>{n}</strong>
          </div>
        ))}
      </div>
      <div className="period-list">
        {[
          ["events", "Eventos"],
          ["drafts", `Rascunhos (${events.filter(e=>e.status==='draft').length})`],
          ["categories", "Categorias"],
          ["pending", `Pendências (${pendingEvents.length+pendingSuggestions})`],
          [
            "submissions",
            `Sugestões (${submissions.filter((s) => s.status === "pending").length})`,
          ],
          ["reports", `Problemas (${reports.filter(r=>r.status==='pending').length})`],
          ["trash", `Lixeira (${allEvents.filter(e=>e.deleted_at).length})`],
          ["stats", "Estatísticas"],
          ["export", "Exportar cadastros"],
          ["discovery", "Buscar eventos"],
          ["venues", "Bares e boates"],
          ["theme", "Tema especial"],
        ].map(([v, t]) => (
          <button
            className={tab === v ? "active" : ""}
            onClick={() => {if(dirty&&!confirm('Há alterações não salvas. Sair sem salvar?'))return;setEdit(null);setReviewId(undefined);setTab(v)}}
            key={v}
          >
            {t}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {previewEvent&&<AdminEventPreview event={previewEvent} onClose={()=>setPreviewEvent(null)} onEdit={()=>{setReviewId(undefined);setEdit(previewEvent);setPreviewEvent(null);setTab('events')}}/>}
      {historyEvent&&<EventHistory key={historyEvent.id} event={historyEvent} onClose={()=>setHistoryEvent(null)} onSaved={refresh}/>}
      {tab==='export'&&<AdminExport/>}
      {tab==='theme'&&<AdminSpecialTheme events={allEvents} onSaved={setReceipt} onDirtyChange={setDirty}/>}
      {tab==='venues'&&<AdminVenues events={allEvents} onSaved={setReceipt} onDirtyChange={setDirty} onEvent={v=>{setReviewId(undefined);setEdit({...venueEvent(v),status:'draft'});setTab('events')}}/>}
      <div hidden={tab!=='discovery'}><AdminDiscovery onMarked={setReceipt} events={allEvents} categories={categories} onReview={event=>{setReviewId(undefined);setEdit(event);setTab('events')}}/></div>
      {tab==='pending'&&<AdminPending events={events} submissions={submissions} onEdit={event=>openPending(event)} onSubmissions={()=>setTab('submissions')}/>}
      {tab==='trash'&&<EventTrash events={allEvents.filter(e=>!!e.deleted_at)} onSaved={refresh} onHistory={setHistoryEvent}/>}
      {tab==='reports'&&<AdminReports reports={reports} events={allEvents} onSaved={refresh} onEdit={e=>{setReviewId(undefined);setEdit(e);setTab('events')}}/>}
      {(tab === "events"||tab === "drafts") && (
        <>
          {tab==='drafts'&&<p className="notice">Rascunhos salvos no Supabase. Eles só aparecem aqui; use Editar e publicar, escolha Status: Publicado e salve quando estiver pronto.</p>}
          <div className="search-row">
            <input
              aria-label="Buscar no painel"
              placeholder="Buscar evento…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button
              className="button lime-button"
              disabled={!!edit}
              onClick={() => {
                setReviewId(undefined);
                setEdit({});
              }}
            >
              <Plus size={17} /> Novo evento
            </button>
          </div>
          {edit ? (
            <EventForm
              key={edit.id || "new"}
              event={edit}
              savedEvents={events}
              initialUnsaved={!edit.id&&!!edit.additional_info?.startsWith('Fonte da busca:')}
              categories={categories}
              onClose={() => {if(!edit.id&&edit.additional_info?.startsWith('Fonte da busca:'))setTab('discovery');setEdit(null)}}
              onSaved={refresh}
              submissionId={reviewId}
              submissionPhoto={submissions.find(s=>s.id===reviewId)?.photo_url}
              onDirtyChange={setDirty}
            />
          ) : (
            <div className="admin-list">
              {events
                .filter((e) =>
                  (tab!=='drafts'||e.status==='draft')&&e.title.toLowerCase().includes(filter.toLowerCase()),
                )
                .map((e) => (
                  <article className="admin-row" key={e.id}>
                    <div>
                      <span className="eyebrow">
                        {
                          {
                            draft: "Rascunho",
                            published: "Publicado",
                            scheduled: "Agendado",
                            cancelled: "Cancelado",
                          }[e.status]
                        }
                        {e.status!=='draft'&&e.status!=='cancelled'&&!upcoming(e,now)&&' · Encerrado'}
                      </span>
                      <h3>{e.title}</h3>
                      {eventIssues(e).length>0&&<ul className="pending-reasons">{eventIssues(e).map(issue=><li key={issue.type}>{issue.label}</li>)}</ul>}
                      <p>
                        {e.updated_at
                          ? "Salvo no Supabase em " + savedTime(e.updated_at)
                          : "Data de salvamento não disponível."}
                      </p>
                      <p>
                        {displayDate(e.starts_at)} · {e.interest_count}{" "}
                        marcações
                      </p>
                    </div>
                    <div className="row-actions">
                      <button
                        className={e.status==='draft'?'button secondary':undefined}
                        title="Editar"
                        aria-label={"Editar " + e.title}
                        onClick={() => {
                          setReviewId(undefined);
                          setEdit(e);
                        }}
                      >
                        <Pencil size={18} /> {e.status==='draft'&&'Editar e publicar'}
                      </button>
                      <button
                        title="Duplicar como rascunho"
                        aria-label={"Duplicar " + e.title}
                        onClick={() =>
                          setEdit({
                            ...e,
                            id: undefined,
                            slug: undefined,
                            title: e.title + " (cópia)",
                            status: "draft",
                            updated_at: undefined,
                            recurrence_group:undefined,change_notice:"",change_at:undefined,
                          })
                        }
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        title="Estatísticas"
                        aria-label={"Estatísticas de " + e.title}
                        onClick={() => {
                          setStats(e.id);
                          setTab("stats");
                        }}
                      >
                        <BarChart3 size={18} />
                      </button>
                      <button
                        className="button secondary"
                        title="Pré-visualizar"
                        aria-label={"Pré-visualizar " + e.title}
                        onClick={() => setPreviewEvent(e)}
                      >
                        <Eye size={18} /> Ver prévia
                      </button>
                      <button
                        disabled={busy}
                        title="Mover para a lixeira"
                        aria-label={"Mover para a lixeira: " + e.title}
                        onClick={() => remove(e)}
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className="button secondary" title="Histórico de alterações" aria-label={"Histórico de "+e.title} onClick={()=>setHistoryEvent(e)}>Histórico</button>
                    </div>
                  </article>
                ))}
              {!events.some(e=>(tab!=='drafts'||e.status==='draft')&&e.title.toLowerCase().includes(filter.toLowerCase())) && (
                <div className="empty">
                  Nenhum evento nesta seleção. Confira a busca e a aba Eventos.
                </div>
              )}
            </div>
          )}
        </>
      )}
      {tab === "categories" && (
        <>
          <button
            className="button lime-button"
            onClick={() => setCategory({ active: true, icon: "Sparkles" })}
          >
            <Plus size={18} /> Nova categoria
          </button>
          {category && (
            <form
              className="panel category-form"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                const f = new FormData(e.currentTarget);
                try {
                  const r = await request("/api/admin/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: category.id,
                      name: f.get("name"),
                      icon: f.get("icon"),
                      active: f.get("active") === "on",
                    }),
                  });
                  const d = await r.json();
                  if (!r.ok) throw Error(d.error);
                  if (!d.saved_at)
                    throw Error(
                      "Não recebemos a confirmação do Supabase. Verifique antes de tentar novamente.",
                    );
                  setReceipt(d.saved_at);
                  setCategory(null);
                  router.refresh();
                } catch (e) {
                  setError(String(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Nome
                <input name="name" required defaultValue={category.name} />
              </label>
              <label>
                Ícone
                <select name="icon" defaultValue={category.icon}>
                  {[
                    "Sparkles",
                    "Music2",
                    "PartyPopper",
                    "Wine",
                    "Utensils",
                    "Theater",
                    "Clapperboard",
                    "Trophy",
                    "Baby",
                    "Store",
                    "Church",
                    "GraduationCap",
                    "Users",
                  ].map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={category.active}
                />{" "}
                Ativa (desativar oculta seus eventos do público)
              </label>
              <button disabled={busy} className="button primary">
                Salvar categoria
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setCategory(null)}
              >
                Cancelar
              </button>
            </form>
          )}
          <div className="admin-list">
            {categories.map((c) => (
              <div className="admin-row" key={c.id}>
                <strong>{c.name}</strong>
                {c.updated_at&&<small>Salvo em {savedTime(c.updated_at)}</small>}
                <span>{c.active ? "Ativa" : "Inativa"}</span>
                <button
                  className="button secondary"
                  onClick={() => setCategory(c)}
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === "submissions" && (
        <SubmissionList
          items={submissions}
          onReview={(item) => {
            setReviewId(item.id);
            setEdit({ ...item.event_data, status: "published" });
            setTab("events");
          }}
          onSaved={refresh}
        />
      )}
      {tab === "stats" && (
        <>
          <label>
            Estatísticas
            <select
              value={stats || ""}
              onChange={(e) => setStats(e.target.value || null)}
            >
              <option value="">Todos os eventos</option>
              {events.map((e) => (
                <option value={e.id} key={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <div className="stats-grid">
            <div className="stat">
              <span>Visualizações registradas</span>
              <strong>{metricList.reduce((n, m) => n + m.views, 0)}</strong>
            </div>
            <div className="stat">
              <span>Cliques em ingressos</span>
              <strong>
                {metricList.reduce((n, m) => n + m.ticket_clicks, 0)}
              </strong>
            </div>
            <div className="stat">
              <span>Marcações retiradas</span>
              <strong>
                {metricList.reduce((n, m) => n + m.interests_removed, 0)}
              </strong>
            </div>
          </div>
          <section className="panel">
            <h2>Interesse nos últimos 14 dias</h2>
            <p>Novas marcações por dia · horário de Brasília</p>
            <div
              className="chart"
              role="img"
              aria-label={days
                .map((d, i) => `${d}: ${values[i]} marcações`)
                .join("; ")}
            >
              {days.map((d, i) => (
                <div key={d}>
                  <span>{values[i]}</span>
                  <i style={{ height: Math.max(2, (values[i] / max) * 150) }} />
                  <small>
                    {d.slice(8)}/{d.slice(5, 7)}
                  </small>
                </div>
              ))}
            </div>
          </section>
          <h2>Eventos mais populares</h2>
          <div className="admin-list">
            {[...events]
              .sort((a, b) => b.interest_count - a.interest_count)
              .slice(0, 10)
              .map((e) => (
                <div className="admin-row" key={e.id}>
                  <span>{e.title}</span>
                  <strong>{e.interest_count} marcações</strong>
                </div>
              ))}
          </div>
          <p className="muted">
            Visualizações e cliques são limitados a um registro por navegador,
            evento e tipo a cada hora. Não representam pessoas únicas.
          </p>
        </>
      )}
    </>
  );
}





