"use client";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { request } from "@/lib/transport";
export function CalendarDownload({ id }: { id: string }) {
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="button secondary"
        onClick={async () => {
          try {
            const r = await request("/api/calendar/" + id);
            if (!r.ok) throw Error();
            const url = URL.createObjectURL(await r.blob());
            const a = document.createElement("a");
            a.href = url;
            a.download = "evento.ics";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch {
            setError("Não foi possível baixar o calendário. Tente novamente.");
          }
        }}
      >
        <CalendarDays size={17} /> Adicionar ao calendário
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
