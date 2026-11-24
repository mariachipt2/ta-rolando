"use client";
import { useEffect, useState, useRef } from "react";
import { Bot, RefreshCw } from "lucide-react";
import { request } from "@/lib/transport";
import type { OpenBotSearchJob } from "@/lib/openbot-search";
import type {
  DiscoveryResult,
  DiscoverySource,
} from "../../supabase/functions/_shared/discovery";
import { savedTime } from "./save-confirmation";
export function AdminOpenBotSearch({
  source,
  onResult,
  active = true,
}: {
  source: DiscoverySource;
  active?: boolean;
  onResult: (result: DiscoveryResult) => void;
}) {
  const [job, setJob] = useState<OpenBotSearchJob | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const callback = useRef(onResult),
    seen = useRef("");
  callback.current = onResult;
  useEffect(() => {
    if (!active) return;
    let alive = true,
      running = false;
    const controller = new AbortController();
    setJob(null);
    setError("");
    seen.current = "";
    const load = async () => {
      if (running || document.hidden) return;
      running = true;
      try {
        const r = await request("/api/admin/openbot-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status", source }),
          signal: controller.signal,
        });
        const d = await r.json();
        if (!r.ok)
          throw Error(d.error || "Não foi possível consultar o OpenBot.");
        if (alive) {
          setJob(d.job);
          setError("");
        }
      } catch (e) {
        if (alive)
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível consultar o OpenBot.",
          );
      } finally {
        running = false;
      }
    };
    void load();
    const timer = setInterval(load, 10000);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [source, active]);
  useEffect(() => {
    if (job?.status === "completed" && job.result && seen.current !== job.id) {
      seen.current = job.id;
      callback.current(job.result);
    }
  }, [job]);
  async function act(action: "request" | "cancel") {
    setBusy(true);
    setError("");
    try {
      const r = await request("/api/admin/openbot-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, source }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Não foi possível enviar a busca.");
      if (action === "cancel")
        setJob((old) => (old ? { ...old, status: "cancelled" } : null));
      else setJob(d.job);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na integração.");
    } finally {
      setBusy(false);
    }
  }
  const waiting = job?.status === "queued" || job?.status === "running";
  return (
    <section className="openbot-search-panel" aria-label="Busca com OpenBot">
      <div className="openbot-search-heading">
        <div>
          <span className="eyebrow">
            <Bot size={15} /> RADAR DE ROLÊS
          </span>
          <h3>Deixe o OpenBot procurar para você</h3>
          <p>
            Ele visita a fonte selecionada, procura links e cartazes e devolve
            os resultados aqui para sua revisão.
          </p>
        </div>
        <button
          type="button"
          className="button secondary"
          disabled={busy || waiting}
          onClick={() => void act("request")}
        >
          <Bot size={18} />
          {busy ? "Enviando…" : "Buscar com OpenBot"}
        </button>
      </div>
      <small>
        O computador, o OpenBot e o conector local precisam estar ligados.
        A coleta pode levar alguns minutos. Nenhum resultado é publicado automaticamente.
      </small>
      {job && (
        <div className="openbot-search-status" role="status">
          <strong>
            {job.status === "queued"
              ? "Aguardando o conector no computador"
              : job.status === "running"
                ? "OpenBot coletando eventos…"
                : job.status === "completed"
                  ? `${job.result?.items.length || 0} ${job.result?.items.length === 1 ? "resultado recebido" : "resultados recebidos"} para revisão`
                  : job.status === "cancelled"
                    ? "Busca cancelada"
                    : "Busca não concluída"}
          </strong>
          <span>
            Pedido salvo em {savedTime(job.requested_at)} · Brasília
            {job.finished_at &&
              ` · Atualizado em ${savedTime(job.finished_at)}`}
          </span>
          {job.error && <p>{job.error}</p>}
          {waiting && <small>Cancelar impede receber os resultados deste pedido. Uma tarefa já iniciada pode terminar no OpenBot.</small>}
          {waiting && (
            <button
              className="button secondary"
              type="button"
              disabled={busy}
              onClick={() => void act("cancel")}
            >
              Cancelar busca
            </button>
          )}
          {job.status === "completed" && job.result && (
            <button
              className="button secondary"
              type="button"
              onClick={() => callback.current(job.result!)}
            >
              <RefreshCw size={15} />
              Mostrar resultados do OpenBot
            </button>
          )}
        </div>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
