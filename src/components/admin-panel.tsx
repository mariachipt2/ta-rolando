"use client";
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
import type { Event, Category } from "@/lib/types";
import { displayDate, upcoming, day } from "@/lib/dates";
import { EventForm } from "./event-form";
type Metric = {
  event_id: string;
  day: string;
  views: number;
  ticket_clicks: number;
  interests_added: number;
  interests_removed: number;
};
export function AdminPanel({
  events,
  categories,
  metrics,
}: {
  events: Event[];
  categories: Category[];
  metrics: Metric[];
}) {
  const router = useRouter();
  const [edit, setEdit] = useState<Partial<Event> | null>(null),
    [tab, setTab] = useState("events"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState(""),
    [category, setCategory] = useState<Partial<Category> | null>(null),
    [stats, setStats] = useState<string | null>(null);
  const refresh = () => {
    setEdit(null);
    router.refresh();
  };
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
        `Excluir definitivamente “${e.title}” e suas marcações? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: e.id }),
      });
      if (!r.ok) throw Error("Falha ao excluir.");
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
        <button
          className="button secondary"
          onClick={async () => {
            await fetch("/api/admin/login", { method: "DELETE" });
            location.reload();
          }}
        >
          <LogOut size={17} /> Sair
        </button>
      </div>
      <div className="stats-grid">
        {[
          ["Eventos cadastrados", events.length],
          ["Futuros", events.filter((e) => upcoming(e)).length],
          ["Encerrados", events.filter((e) => !upcoming(e)).length],
          [
            "Publicados",
            events.filter(
              (e) =>
                e.status === "published" ||
                (e.status === "scheduled" &&
                  !!e.publish_at &&
                  new Date(e.publish_at) <= new Date()),
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
          ["categories", "Categorias"],
          ["stats", "Estatísticas"],
        ].map(([v, t]) => (
          <button
            className={tab === v ? "active" : ""}
            onClick={() => setTab(v)}
            key={v}
          >
            {t}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {tab === "events" && (
        <>
          <div className="search-row">
            <input
              aria-label="Buscar no painel"
              placeholder="Buscar evento…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button className="button lime-button" onClick={() => setEdit({})}>
              <Plus size={17} /> Novo evento
            </button>
          </div>
          {edit ? (
            <EventForm
              key={edit.id || "new"}
              event={edit}
              categories={categories}
              onClose={() => setEdit(null)}
              onSaved={refresh}
            />
          ) : (
            <div className="admin-list">
              {events
                .filter((e) =>
                  e.title.toLowerCase().includes(filter.toLowerCase()),
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
                      </span>
                      <h3>{e.title}</h3>
                      <p>
                        {displayDate(e.starts_at)} · {e.interest_count}{" "}
                        marcações
                      </p>
                    </div>
                    <div className="row-actions">
                      <button
                        title="Editar"
                        aria-label={"Editar " + e.title}
                        onClick={() => setEdit(e)}
                      >
                        <Pencil size={18} />
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
                        title="Pré-visualizar"
                        aria-label={"Pré-visualizar " + e.title}
                        onClick={() => setEdit(e)}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        disabled={busy}
                        title="Excluir"
                        aria-label={"Excluir " + e.title}
                        onClick={() => remove(e)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              {events.length === 0 && (
                <div className="empty">
                  Tudo pronto para o primeiro evento. Clique em “Novo evento”.
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
                  const r = await fetch("/api/admin/categories", {
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
