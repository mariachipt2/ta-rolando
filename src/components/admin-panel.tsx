"use client";
import { AdminArtists } from "./admin-artists";
import { AdminAgendaSpecial } from './admin-agenda-special';
import { AdminStatistics } from './admin-statistics';
import type { EventMetric } from '@/lib/admin-statistics';
import {AdminNavigation} from './admin-navigation';
import {useNow} from '@/lib/use-now';
import {AdminSpecialTheme} from './admin-special-theme';
import {AdminNotifications} from './admin-notifications';
import {AdminVenues} from './admin-venues';
import {AdminOrganizers} from './admin-organizers';
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
import { displayDate, upcoming } from "@/lib/dates";
import { EventForm } from "./event-form";
import {AdminEventPreview} from './admin-event-preview';
import { SubmissionList } from "./submission-list";
import { SaveConfirmation, savedTime } from "./save-confirmation";
import {EventHistory} from './event-history';
import {EventTrash} from './event-trash';
import {AdminDiscovery,discoveryHasResults} from './admin-discovery';
import {AdminExport} from './admin-export';
import {AdminPending} from './admin-pending';
import {eventIssues,pendingEventItems} from '@/lib/event-discovery';
import {AdminReports} from './admin-reports';
export function AdminPanel({
  events:allEvents,
  reports,
  categories,
  metrics,
  metricsRetrievedAt,
  submissions,
  saveState,
  draftId,
}: {
  events: Event[];
  reports: EventReport[];
  categories: Category[];
  metrics: EventMetric[];
  metricsRetrievedAt: string;
  submissions: EventSubmission[];
  saveState: SaveState;
  draftId?: string;
}) {
  const now=new Date(useNow());
  const events=allEvents.filter(e=>!e.deleted_at);
  const [historyEvent,setHistoryEvent]=useState<Event|null>(null);
  const [showEnded,setShowEnded]=useState(false);
  const [openBotOnly,setOpenBotOnly]=useState(false);
  const [previewEvent,setPreviewEvent]=useState<Event|null>(null);
  const router = useRouter();
  const linkedDraft = draftId ? events.find(event => event.id === draftId && event.status === "draft" && event.slug.startsWith("openbot-")) : undefined;
  const [edit, setEdit] = useState<Partial<Event> | null>(linkedDraft ?? null),
    [tab, setTab] = useState(()=>draftId?"drafts":discoveryHasResults()?"discovery":"events"),
    [error, setError] = useState(draftId && !linkedDraft ? "Este rascunho não está disponível. Confira a lista de rascunhos abaixo." : ""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState(""),
    [category, setCategory] = useState<Partial<Category> | null>(null),
    [stats, setStats] = useState<string | null>(null),
    [reviewId, setReviewId] = useState<string | undefined>(),
    [receipt, setReceipt] = useState(saveState.saved_at),
    [dirty,setDirty]=useState(false);
  const clearDraftLink = () => {
    if (draftId && location.hash.startsWith("#/admin?")) {
      const params = new URLSearchParams(location.hash.split("?")[1]);
      params.delete("rascunho");
      history.replaceState(history.state, "", params.size ? `#/admin?${params}` : "#/admin");
    }
  };
  const refresh = (savedAt: string) => {
    clearDraftLink();
    setReceipt(savedAt);
    if(!edit?.id&&edit?.additional_info?.startsWith('Fonte da busca:'))setTab('discovery');
    setHistoryEvent(null);
    setEdit(null);
    setReviewId(undefined);
    router.refresh();
  };
  const pendingEvents=pendingEventItems(events,now),pendingSuggestions=submissions.filter(s=>s.status==='pending').length;
  const openPending=(event?:Event)=>{if(dirty&&!confirm('Há alterações não salvas. Sair sem salvar?'))return;setReviewId(undefined);setEdit(event||null);setTab(event?'events':'pending')};
  const endedEvents=events.filter(event=>event.status!=='draft'&&!upcoming(event,now));
  const listedEvents=events.filter(event=>{
    const inView=tab==='drafts'?event.status==='draft':showEnded?event.status!=='draft'&&!upcoming(event,now):event.status==='draft'||upcoming(event,now);
    return inView&&(!openBotOnly||tab!=='drafts'||event.slug.startsWith('openbot-'))&&event.title.toLocaleLowerCase('pt-BR').includes(filter.toLocaleLowerCase('pt-BR'));
  });
  const total = events.reduce((n, e) => n + e.interest_count, 0);
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
      <div className="section-heading admin-page-heading">
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
      <div className="stats-grid admin-overview">
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
      <div className="admin-workspace">
      <AdminNavigation selected={tab} counts={{drafts:events.filter(e=>e.status==='draft').length,pending:pendingEvents.length+pendingSuggestions,submissions:pendingSuggestions,reports:reports.filter(r=>r.status==='pending').length,trash:allEvents.filter(e=>e.deleted_at).length}} onSelect={value=>{if(value===tab)return true;if(dirty&&!confirm('Há alterações não salvas. Sair sem salvar?'))return false;setEdit(null);setReviewId(undefined);setShowEnded(false);setTab(value);return true}}/>
      <div className="admin-workspace-content">
      {error && <p role="alert">{error}</p>}
      {previewEvent&&<AdminEventPreview event={previewEvent} onClose={()=>setPreviewEvent(null)} onEdit={()=>{setReviewId(undefined);setEdit(previewEvent);setPreviewEvent(null);setTab('events')}}/>}
      {historyEvent&&<EventHistory key={historyEvent.id} event={historyEvent} onClose={()=>setHistoryEvent(null)} onSaved={refresh}/>}
      {tab==='export'&&<AdminExport/>}
      {tab==='specials'&&<AdminAgendaSpecial onSaved={setReceipt} onDirtyChange={setDirty}/>}
      {tab==='theme'&&<AdminSpecialTheme events={allEvents} onSaved={setReceipt} onDirtyChange={setDirty}/>}
      {tab==='artists'&&<AdminArtists onSaved={setReceipt} onDirtyChange={setDirty}/>}
      {tab==='organizers'&&<AdminOrganizers events={allEvents} onSaved={setReceipt} onDirtyChange={setDirty}/>}
      {tab==='venues'&&<AdminVenues events={allEvents} onSaved={setReceipt} onDirtyChange={setDirty} onEvent={v=>{setReviewId(undefined);setEdit({...venueEvent(v),status:'draft'});setTab('events')}}/>}
      <div hidden={tab!=='discovery'}><AdminDiscovery onMarked={setReceipt} events={allEvents} categories={categories} onReview={event=>{setReviewId(undefined);setEdit(event);setTab('events')}}/></div>
      {tab==='pending'&&<AdminPending events={events} submissions={submissions} onEdit={event=>openPending(event)} onTrash={event=>void remove(event)} busy={busy} onSubmissions={()=>setTab('submissions')}/>}
      {tab==='trash'&&<EventTrash events={allEvents.filter(e=>!!e.deleted_at)} onSaved={refresh} onHistory={setHistoryEvent}/>}
      {tab==='reports'&&<AdminReports reports={reports} events={allEvents} onSaved={refresh} onEdit={e=>{setReviewId(undefined);setEdit(e);setTab('events')}}/>}
      {(tab === "events"||tab === "drafts") && (
        <>
          {tab==='drafts'&&<p className="notice">Rascunhos salvos no Supabase. Eles só aparecem aqui; use Editar e publicar, escolha Status: Publicado e salve quando estiver pronto.</p>}
          {tab==='drafts'&&<button type="button" className="button secondary" aria-pressed={openBotOnly} onClick={()=>setOpenBotOnly(value=>!value)}>{openBotOnly?'Ver todos os rascunhos':'Importados do OpenBot'} ({events.filter(e=>e.status==='draft'&&e.slug.startsWith('openbot-')).length})</button>}
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
          {!edit&&tab==='events'&&<div className="admin-event-view"><p>{showEnded?'Eventos encerrados':'Próximos eventos e rascunhos'}</p><button type="button" className="button secondary" aria-pressed={showEnded} onClick={()=>setShowEnded(value=>!value)}><Eye size={16}/>{showEnded?'Voltar aos próximos eventos':`Visualizar encerrados (${endedEvents.length})`}</button></div>}
          {edit ? (
            <EventForm
              key={edit.id || "new"}
              event={edit}
              savedEvents={events}
              initialUnsaved={!edit.id&&!!edit.additional_info?.startsWith('Fonte da busca:')}
              categories={categories}
              onClose={() => {clearDraftLink();if(!edit.id&&edit.additional_info?.startsWith('Fonte da busca:'))setTab('discovery');setEdit(null)}}
              onSaved={refresh}
              submissionId={reviewId}
              submissionPhoto={submissions.find(s=>s.id===reviewId)?.photo_url}
              onDirtyChange={setDirty}
            />
          ) : (
            <div className="admin-list">
              {listedEvents.map((e) => (
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
                      <h3>{e.title}</h3>{e.sold_out&&<span className="discovery-badge">Ingressos esgotados</span>}
                      {e.slug.startsWith('openbot-')&&<small>Importado do OpenBot</small>}
                      {eventIssues(e).length>0&&<ul className="pending-reasons">{eventIssues(e).map(issue=><li key={issue.type}>{issue.label}</li>)}</ul>}
                      <p>
                        {e.updated_at
                          ? "Salvo no Supabase em " + savedTime(e.updated_at)
                          : "Data de salvamento não disponível."}
                      </p>
                      <p>
                        {displayDate(e.starts_at, e.time_tbd)} · {e.interest_count}{" "}
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
                            sold_out:false,
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
              {listedEvents.length===0 && (
                <div className="empty">
                  {tab==='drafts'?'Nenhum rascunho nesta busca.':showEnded?'Nenhum evento encerrado nesta busca.':'Nenhum evento nesta seleção. Confira a busca ou use Visualizar encerrados para consultar os que já passaram.'}
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
        <AdminStatistics
          events={allEvents}
          metrics={metrics}
          retrievedAt={metricsRetrievedAt}
          selectedEvent={stats}
          onSelectEvent={setStats}
        />
      )}
      </div>
      </div>
    </>
  );
}





