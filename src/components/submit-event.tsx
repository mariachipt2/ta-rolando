"use client";
import {venueEvent,type PublicVenue} from '@/lib/venues';
import { useRef, useState, useEffect } from "react";
import { Send, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { request } from "@/lib/transport";
import { toISO } from "@/lib/dates";
import { validateSubmission } from "@/lib/submission-validation";
import { BotCheck } from "./bot-check";
import { savedTime } from "./save-confirmation";
import {AGE_OPTIONS} from '@/lib/age-options';
import {photoType} from '../../supabase/functions/_shared/photos';

const quickFields = [
  { name: "nome", label: "Nome do evento", required: true, maxLength: 160 },
  { name: "data_horario", label: "Data e Horário", placeholder: "Sexta 20/11 às 22h", required: true, maxLength: 100 },
  { name: "local_bairro", label: "Local e Bairro", placeholder: "Garajão - Novo Centro", required: true, maxLength: 240 },
  { name: "valor", label: "Valor / Entrada", placeholder: "Entrada gratuita ou R$ 20", maxLength: 100 },
  { name: "link", label: "Link de Ingresso ou Instagram", placeholder: "Opcional", maxLength: 2048 },
];

export function SubmitEvent({ categories,initialVenue }: { categories: Category[];initialVenue?:PublicVenue }) {
  const [open, setOpen] = useState(!!initialVenue),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(""),
    [token, setToken] = useState(""),
    [botVersion, setBotVersion] = useState(0);
  const [photo,setPhoto]=useState<File|null>(null),[photoPreview,setPhotoPreview]=useState('');
  useEffect(()=>{if(!photo){setPhotoPreview('');return}const url=URL.createObjectURL(photo);setPhotoPreview(url);return()=>URL.revokeObjectURL(url)},[photo]);
  const photoInput=useRef<HTMLInputElement>(null);
  const quickDialog = useRef<HTMLDialogElement>(null);
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
      <input name={name} type={type} required={required} defaultValue={initialVenue?(venueEvent(initialVenue) as Record<string,string>)[name]||'':''} />
    </label>
  );
  return (
    <section className="shell suggest-section" id="enviar-evento">
      <div className="agenda-banner">
        <div>
          <span className="eyebrow">A CIDADE TAMBÉM É FEITA POR VOCÊ</span>
          <h2>{initialVenue?'Envie a programação de '+initialVenue.name:'Sabe de um evento que vai rolar?'}</h2>
          <p>
            {initialVenue
              ? "Envie sua sugestão. A administração confere as informações antes de publicar."
              : "Envie as informações e o cartaz pelo WhatsApp. A administração confere a sugestão antes de publicar."}
          </p>
        </div>
        {initialVenue ? (
          <button className="button lime-button" onClick={() => setOpen(!open)} aria-expanded={open}>
            <Send size={18} /> Sugerir um evento
          </button>
        ) : (
          <button type="button" className="button lime-button" aria-haspopup="dialog"
            aria-controls="quick-event-dialog" onClick={() => quickDialog.current?.showModal()}>
            <svg viewBox="0 0 16 16" width="17" height="17" fill="currentColor" aria-hidden="true">
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
            </svg>
            Sugerir um evento
          </button>
        )}
      </div>
      {!initialVenue && (
        <dialog ref={quickDialog} className="quick-event-dialog" id="quick-event-dialog"
          aria-labelledby="quick-event-title" aria-describedby="quick-event-description">
          <button type="button" className="button secondary quick-event-close" aria-label="Fechar"
            onClick={() => quickDialog.current?.close()}><X size={18} aria-hidden="true" /></button>
          <h2 id="quick-event-title">Divulgue seu evento no Tá Rolando</h2>
          <p id="quick-event-description">Preencha os dados abaixo e envie direto para a nossa equipe no WhatsApp</p>
          <form onSubmit={event => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const fieldValue = (name: string) => String(data.get(name) ?? "").trim();
            const message = [
              "🎉 *Sugestão de Evento — Tá Rolando Ipatinga*",
              "",
              "*Nome do evento:* " + fieldValue("nome"),
              "*Data e Horário:* " + fieldValue("data_horario"),
              "*Local e Bairro:* " + fieldValue("local_bairro"),
              "*Valor/Entrada:* " + fieldValue("valor"),
              "*Link/Instagram:* " + fieldValue("link"),
              "",
              "(Estou anexando o cartaz/flyer abaixo 👇)",
            ].join("\n");
            const link = document.createElement("a");
            link.href = "https://wa.me/5531920113713?text=" + encodeURIComponent(message);
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.click();
          }}>
            <div className="quick-event-fields">
              {quickFields.map(({name, label, required, placeholder, maxLength}) => (
                <label key={name}>{label}{required ? " *" : ""}
                  <input name={name} required={required} pattern={required ? ".*\\S.*" : undefined}
                    placeholder={placeholder} maxLength={maxLength} />
                </label>
              ))}
            </div>
            <p className="notice quick-event-tip">⚠️ Ao abrir a conversa no WhatsApp, não esqueça de anexar a imagem do cartaz!</p>
            <button type="submit" className="button lime-button">Enviar dados no WhatsApp</button>
          </form>
        </dialog>
      )}
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
                  setSaved("");setPhoto(null);
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
                    family_friendly:values.family_friendly===''?null:values.family_friendly==='true',
                  });
                  if(photo)photoType(new Uint8Array(await photo.arrayBuffer()));
                  const payload=JSON.stringify({event,photo:photo?[photo.name,photo.size,photo.lastModified]:null});
                  if(!requestId.current||requestId.current.payload!==payload)requestId.current={id:crypto.randomUUID(),payload};
                  const form=new FormData();form.set('payload',JSON.stringify({request_id:requestId.current.id,event,token}));if(photo)form.set('photo',photo);
                  const r = await request("/api/submissions", {
                    method: "POST",
                    body: form,
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
                <label>Classificação indicativa<select name="age_rating">{AGE_OPTIONS.map(a=><option key={a}>{a}</option>)}</select></label>
                <label>Adequado para crianças?<select name="family_friendly"><option value="">Não sei / consultar organizador</option><option value="true">Sim, adequado para crianças</option><option value="false">Não recomendado para crianças</option></select></label>
                <label className="full">Foto do evento (opcional)<input type="file" ref={photoInput} accept="image/jpeg,image/png,image/webp" onChange={async e=>{const file=e.target.files?.[0];setError('');if(!file){setPhoto(null);return}try{if(file.size>5242880)throw Error('Use uma foto de até 5 MB.');photoType(new Uint8Array(await file.arrayBuffer()));setPhoto(file)}catch(err){setPhoto(null);e.target.value='';setError(err instanceof Error?err.message:'Foto inválida.')}}}/><small>JPG, PNG ou WebP, até 5 MB. Envie uma imagem que você tem autorização para usar. Ela ficará privada até a análise.</small></label>
                {photoPreview&&<div className="full suggestion-photo"><img src={photoPreview} alt="Prévia da foto da sugestão"/><button type="button" className="button secondary" onClick={()=>{setPhoto(null);if(photoInput.current)photoInput.current.value=''}}>Remover foto</button></div>}
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
