"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Event } from "@/lib/types";
import { EventCard } from "./event-card";
import { Attendance } from "./attendance";
import { upcoming } from "@/lib/dates";
export function Agenda({ events }: { events: Event[] }) {
  const [ids, setIds] = useState<string[] | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/attendance", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => setIds(d.ids))
      .catch(() =>
        setError("Não foi possível carregar sua agenda. Tente recarregar."),
      );
  }, []);
  const selected = events.filter((e) => ids?.includes(e.id));
  return (
    <>
      <p role="status">{error || (!ids ? "Carregando seus planos…" : "")}</p>
      {ids && selected.length === 0 ? (
        <div className="empty">
          <div>
            <h2>Sua agenda está pronta para novas histórias.</h2>
            <p>Encontre um evento e toque em “Eu vou!” para salvar aqui.</p>
            <Link className="button lime-button" href="/#explorar">
              Descobrir eventos ↗
            </Link>
          </div>
        </div>
      ) : (
        <div className="event-grid">
          {selected.map((e) => (
            <div key={e.id}>
              <EventCard event={e} />
              <div className="agenda-actions">
                <Attendance
                  id={e.id}
                  count={e.interest_count}
                  disabled={!upcoming(e) || e.status === "cancelled"}
                  onChange={(going) => {
                    if (!going) setIds(ids!.filter((id) => id !== e.id));
                  }}
                />
                <a className="text-link" href={"/api/calendar/" + e.id}>
                  Adicionar ao calendário
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
