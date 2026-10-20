"use client";
import { useRef, useState } from "react";
import { Send } from "lucide-react";
import type { Category } from "@/lib/types";
import { request } from "@/lib/transport";
import { toISO } from "@/lib/dates";
import { validateSubmission } from "@/lib/submission-validation";
import { BotCheck } from "./bot-check";
import { savedTime } from "./save-confirmation";
export function SubmitEvent({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(""),
    [token, setToken] = useState(""),
    [botVersion, setBotVersion] = useState(0);
  const requestId = useRef<{id:string;payload:string} | null>(null);
  const field = (
    name: string,
    label: string,
    required = false,
    type = "text",
  ) => (
    <label>
      {label}
      {required ? " *" : ""}
      <input name={name} type={type} required={required} />
    </label>
  );
  return (
    <section className="shell suggest-section" id="enviar-evento">
      <div className="agenda-banner">
        <div>
          <span className="eyebrow">A CIDADE TAMBÉM É FEITA POR VOCÊ</span>
          <h2>Sabe de um evento que vai rolar?</h2>
          <p>
            Envie sua sugestão. A administração confere as informações antes de
            publicar.
          </p>
        </div>
        <button
          className="button lime-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <Send size={18} /> Sugerir um evento
        </button>
      </div>
      {open && (
        <div className="panel">
          {saved ? (
            <div role="status">
              <h3>Sugestão recebida!</h3>
              <p>
                Enviada e salva em {savedTime(saved)} · horário de Brasília.
                Agora ela aguarda análise. O envio não garante publicação.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  setSaved("");
                  requestId.current = null;
                }}
              >
                Enviar outra sugestão
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  const values = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );
                  const event = validateSubmission({
                    ...values,
                    starts_at: toISO(String(values.starts_at)),
                    ends_at: values.ends_at
                      ? toISO(String(values.ends_at))
                      : null,
                    is_free: values.is_free === "free",
                  });
                  const payload=JSON.stringify(event);
                  if(!requestId.current||requestId.current.payload!==payload)requestId.current={id:crypto.randomUUID(),payload};
                  const r = await request("/api/submissions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      request_id: requestId.current.id,
                      event,
                      token,
                    }),
                  });
                  const data = await r.json();
                  if (!r.ok)
                    throw Error(data.error || "Não foi possível enviar.");
                  if (!data.saved_at || !data.id)
                    throw Error(
                      "Não recebemos a confirmação do salvamento. Tente enviar novamente.",
                    );
                  setSaved(data.saved_at);
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Não foi possível enviar.",
                  );
                } finally {
                  setBusy(false);
                  setToken("");
                  setBotVersion((n) => n + 1);
                }
              }}
            >
              <p>
                Eventos de Ipatinga. Não informe dados pessoais na descrição.
                Campos com * são obrigatórios.
              </p>
              <div className="form-grid">
                {field("title", "Nome do evento", true)}
                <label>
                  Categoria *
                  <select name="category_id" required>
                    <option value="">Selecione</option>
                    {categories
                      .filter((c) => c.active)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="full">
                  Descrição *
                  <textarea
                    name="description"
                    required
                    minLength={10}
                    maxLength={10000}
                    rows={4}
                  />
                </label>
                {field(
                  "starts_at",
                  "Data e horário de início (Brasília)",
                  true,
                  "datetime-local",
                )}
                {field(
                  "ends_at",
                  "Encerramento (Brasília)",
                  false,
                  "datetime-local",
                )}
                {field("venue_name", "Local", true)}
                {field("address", "Endereço", true)}
                {field("neighborhood", "Bairro")}
                {field("organizer", "Organizador")}
                {field("instagram_url", "Perfil no Instagram", false, "url")}
                <label>
                  Entrada
                  <select name="is_free">
                    <option value="free">Gratuita</option>
                    <option value="paid">Paga</option>
                  </select>
                </label>
                {field("price", "Preço ou faixa de preço")}
                {field(
                  "ticket_url",
                  "Link oficial dos ingressos",
                  false,
                  "url",
                )}
                {field("age_rating", "Classificação indicativa")}
                <label className="full">
                  Informações adicionais
                  <textarea name="additional_info" rows={2} maxLength={3000} />
                </label>
              </div>
              <div className="submit-bottom">
                <BotCheck key={botVersion} onToken={setToken} />
                {error && (
                  <p role="alert" className="error-text">
                    {error}
                  </p>
                )}
                <button
                  disabled={busy || !token}
                  className="button lime-button"
                >
                  {busy
                    ? "Enviando e aguardando confirmação…"
                    : "Enviar para análise"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
