"use client";
import {venueEvent,type PublicVenue} from '@/lib/venues';
import { useRef, useState, useEffect } from "react";
import { Send } from "lucide-react";
import type { Category } from "@/lib/types";
import { request } from "@/lib/transport";
import { toISO } from "@/lib/dates";
import { validateSubmission } from "@/lib/submission-validation";
import { BotCheck } from "./bot-check";
import { savedTime } from "./save-confirmation";
import {AGE_OPTIONS} from '@/lib/age-options';
import {photoType} from '../../supabase/functions/_shared/photos';
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
