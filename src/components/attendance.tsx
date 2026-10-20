"use client";
import {request,navigate} from "@/lib/transport";
import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import { Check, Plus, Users } from "lucide-react";
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}
export function Attendance({
  id,
  count,
  disabled = false,
  onChange,
}: {
  id: string;
  count: number;
  disabled?: boolean;
  onChange?: (attending: boolean) => void;
}) {
  const [going, setGoing] = useState(false),
    [total, setTotal] = useState(count),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [token, setToken] = useState("");
  const box = useRef<HTMLDivElement>(null),
    widget = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const render = () => {
    if (box.current && window.turnstile && widget.current === null)
      widget.current = window.turnstile.render(box.current, {
        sitekey,
        theme: "dark",
        callback: (v: string) => setToken(v),
        "expired-callback": () => setToken(""),
      });
  };
  useEffect(() => {
    let active = true;
    setReady(false);
    setError('');
    request("/api/attendance", { cache: "no-store" })
      .then(async (r) => {
        const data=await r.json();
        if (!r.ok) throw Error(data.error || 'Não foi possível consultar sua marcação. Tente novamente.');
        return data;
      })
      .then((d) => {
        if (active) {
          setGoing(d.ids.includes(id));
          setReady(true);
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error && e.message ? e.message : "Não foi possível consultar sua marcação. Tente novamente.",
          );
      });
    render();
    return () => {
      active = false;
      if (widget.current && window.turnstile) {
        window.turnstile.remove(widget.current);
        widget.current = null;
      }
    };
  }, [id, attempt]);
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const r = await request("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: id, attending: !going, token }),
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setGoing(d.attending);
      setTotal(d.count);
      onChange?.(d.attending);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
      if (widget.current) window.turnstile?.reset(widget.current);
      setToken("");
    }
  }
  return (
    <div className="attendance">
      <p>
        <Users size={17} />
        {total} {total === 1 ? "pessoa marcou" : "pessoas marcaram"} “Eu vou!”
      </p>
      <button
        className={"button " + (going ? "secondary" : "lime-button")}
        disabled={
          !ready ||
          busy ||
          (disabled && !going) ||
          (!going && !!sitekey && !token)
        }
        onClick={toggle}
      >
        {going ? <Check size={20} /> : <Plus size={20} />}{" "}
        {busy
          ? "Salvando…"
          : going
            ? "Presença marcada!"
            : disabled
              ? "Evento indisponível"
              : "Eu vou!"}
      </button>
      {going && <small>Clique novamente para retirar sua marcação.</small>}
      {sitekey && !disabled && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onReady={render}
          />
          <div ref={box} />
        </>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {error && !ready && <button className="button secondary" onClick={()=>setAttempt(n=>n+1)}>Tentar novamente</button>}
      <small>
        Marcações de interesse, não ingressos ou presenças confirmadas.
      </small>
    </div>
  );
}
