"use client";
import { useState } from "react";
import type { EventSubmission } from "@/lib/types";
import { request } from "@/lib/transport";
import { savedTime } from "./save-confirmation";
export function SubmissionList({
  items,
  onReview,
  onSaved,
}: {
  items: EventSubmission[];
  onReview: (item: EventSubmission) => void;
  onSaved: (at: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("pending");
  return (
    <section>
      <h2>Sugestões enviadas pelo público</h2>
      <p>
        Somente sugestões aceitas viram eventos. Revise as informações antes de
        publicar.
      </p>
      <label>
        Mostrar
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="pending">Aguardando análise</option>
          <option value="approved">Aceitas</option>
          <option value="rejected">Recusadas</option>
        </select>
      </label>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <div className="admin-list">
        {items
          .filter((s) => s.status === filter)
          .map((s) => (
            <article className="admin-row" key={s.id}>
              <div>
                <h3>{s.event_data.title}</h3>
                <p>
                  {s.event_data.venue_name} · {s.event_data.neighborhood}
                </p>
                <p>Recebida e salva em {savedTime(s.submitted_at)}</p>
                {s.reviewed_at && (
                  <p>Análise salva em {savedTime(s.reviewed_at)}</p>
                )}
              </div>
              {s.status === "pending" && (
                <div className="row-actions">
                  <button
                    className="button lime-button"
                    disabled={!!busy}
                    onClick={() => onReview(s)}
                  >
                    Revisar e aceitar
                  </button>
                  <button
                    className="button secondary"
                    disabled={!!busy}
                    onClick={async () => {
                      if (
                        !confirm(`Recusar a sugestão “${s.event_data.title}”?`)
                      )
                        return;
                      setBusy(s.id);
                      setError("");
                      try {
                        const r = await request("/api/admin/submissions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: s.id,
                            decision: "rejected",
                          }),
                        });
                        const d = await r.json();
                        if (!r.ok || !d.saved_at)
                          throw Error(
                            d.error || "Não recebemos confirmação do Supabase.",
                          );
                        onSaved(d.saved_at);
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Falha ao salvar a análise.",
                        );
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === s.id ? "Salvando…" : "Recusar"}
                  </button>
                </div>
              )}
            </article>
          ))}
        {!items.some((s) => s.status === filter) && (
          <div className="empty">Nenhuma sugestão nesta seleção.</div>
        )}
      </div>
    </section>
  );
}
