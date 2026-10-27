"use client";
import {VenuePicker} from './venue-picker';
import {OrganizerPicker} from './organizer-picker';
import {venueEvent} from '@/lib/venues';
import { request, navigate } from "@/lib/transport";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Event, Category } from "@/lib/types";
import { eventSchema } from "@/lib/validation";
import { localInput, toISO, displayDate } from "@/lib/dates";
import { InstagramLink } from "./instagram-link";
import { SaveConfirmation } from "./save-confirmation";
import {AGE_OPTIONS} from '@/lib/age-options';
type Values = z.infer<typeof eventSchema>;
export function EventForm({
  event: e,
  initialUnsaved=false,
  categories,
  savedEvents=[],
  onClose,
  onSaved,
  submissionId,
  submissionPhoto,
  onDirtyChange,
}: {
  event: Partial<Event>;
  initialUnsaved?:boolean;
  categories: Category[];
  savedEvents?: Event[];
  onClose: () => void;
  onSaved: (savedAt: string) => void;
  submissionId?: string;
  submissionPhoto?:string;
  onDirtyChange?:(dirty:boolean)=>void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(false),
    [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: e.title || "",
      description: e.description || "",
      category_id: e.category_id || categories.find((c) => c.active)?.id || "",
      starts_at: e.starts_at || "",
      ends_at: e.ends_at || null,
      venue_name: e.venue_name || "",
      address: e.address || "",
      neighborhood: e.neighborhood || "",
      city: e.city || "Ipatinga",
      state: e.state || "MG",
      organizer: e.organizer || "",
      instagram_url: e.instagram_url || "",
      is_free: e.is_free ?? true,
      price: e.price || "",
      ticket_url: e.ticket_url || "",
      age_rating: e.age_rating || "Não informada",
      family_friendly:e.family_friendly??null,
      change_notice:e.change_notice||"",
      cover_url: e.cover_url || "",
      gallery: e.gallery || [],
      additional_info: e.additional_info || "",
      status: e.status || "draft",
      publish_at: e.publish_at || null,
      featured: e.featured || false,
    },
  });
  const [frequency,setFrequency]=useState('none'),[count,setCount]=useState(4),[usePhoto,setUsePhoto]=useState(!!submissionPhoto),[extraDirty,setExtraDirty]=useState(initialUnsaved);
  const requestId=useRef<{id:string;payload:string}|null>(null);
  const v = watch();
  const dirty=isDirty||extraDirty;
  useEffect(()=>{onDirtyChange?.(dirty);return()=>onDirtyChange?.(false)},[dirty,onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const navigation=(e:MouseEvent)=>{const a=(e.target as Element).closest<HTMLAnchorElement>('a');if(!a||a.target==='_blank'||a.getAttribute('href')?.startsWith('#main'))return;if(!confirm('Existem alterações não salvas. Deseja sair sem salvar?')){e.preventDefault();e.stopPropagation()}};
    window.addEventListener("beforeunload", guard);
    document.addEventListener('click',navigation,true);
    return () => {window.removeEventListener("beforeunload", guard);document.removeEventListener('click',navigation,true)};
  }, [dirty]);
  const close = () => {
    if (
      !dirty ||
      confirm("Existem alterações não salvas. Deseja sair sem salvar?")
    )
      onClose();
  };
  async function upload(files: FileList | null, gallery = false) {
    if (!files) return;
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const f = new FormData();
        f.set("file", file);
        const r = await request("/api/admin/upload", {
          method: "POST",
          body: f,
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        urls.push(d.url);
      }
      if (gallery)
        setValue("gallery", [...v.gallery, ...urls].slice(0, 10), {
          shouldDirty: true,
        });
      else {setUsePhoto(false);setValue("cover_url", urls[0], { shouldDirty: true });}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }
  const field = (
    name: keyof Values,
    label: string,
    required = false,
    type = "text",
  ) => (
    <label>
      {label}
      {required ? " *" : ""}
      <input type={type} {...register(name)} required={required} />
      {errors[name] && (
        <small className="error-text">{errors[name]?.message}</small>
      )}
    </label>
  );
  const datetime = (
    name: "starts_at" | "ends_at" | "publish_at",
    label: string,
  ) => (
    <label>
      {label}
      <input
        type="datetime-local"
        value={v[name] ? localInput(v[name]!) : ""}
        onChange={(ev) =>
          setValue(
            name,
            ev.target.value
              ? toISO(ev.target.value)
              : name === "starts_at"
                ? ""
                : null,
            { shouldValidate: true, shouldDirty: true },
          )
        }
      />
      {errors[name] && (
        <small className="error-text">{errors[name]?.message}</small>
      )}
    </label>
  );
  return (
    <form
      className="panel event-form"
      onSubmit={handleSubmit(async (data) => {
        setBusy(true);
        setError("");
        try {
          const recurrence={frequency,count:frequency==='none'?1:count};
          const payload=JSON.stringify({data,recurrence});
          if(!requestId.current||requestId.current.payload!==payload)requestId.current={id:crypto.randomUUID(),payload};
          const r = await request(
            submissionId ? "/api/admin/submissions" : "/api/admin/events",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                submissionId
                  ? { id: submissionId, decision: "approved", event: data, use_photo:usePhoto }
                  : { ...data, id: e.id, request_id:requestId.current.id,recurrence },
              ),
            },
          );
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          if (!d.saved_at || !Number.isFinite(Date.parse(d.saved_at)))
            throw Error(
              "Não recebemos a confirmação do Supabase. Confira a lista antes de tentar novamente.",
            );
          onSaved(d.saved_at);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Falha ao salvar.");
        } finally {
          setBusy(false);
        }
      })}
    >
      <div className="section-heading">
        <h2>
          {submissionId
            ? "Revisar sugestão"
            : e.id
              ? "Editar evento"
              : "Novo evento"}
        </h2>
        <button
          type="button"
          disabled={busy}
          className="button secondary"
          onClick={close}
        >
          Fechar
        </button>
      </div>
      <p>Horários de Brasília. Campos com * são obrigatórios.</p>
      <SaveConfirmation at={e.updated_at} dirty={dirty} busy={busy} />
      <OrganizerPicker events={savedEvents} onSelect={values=>{for(const key of Object.keys(values) as (keyof typeof values)[])setValue(key,values[key],{shouldDirty:true,shouldValidate:true})}}/>
      <VenuePicker onSelect={venue=>{const values=venueEvent(venue);for(const key of Object.keys(values) as (keyof typeof values)[])setValue(key,values[key],{shouldDirty:true,shouldValidate:true})}}/>
      <div className="form-grid">
        {field("title", "Título", true)}
        <label>
          Categoria *
          <select {...register("category_id")}>
            {categories.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
                {!c.active ? " (inativa)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          Descrição *<textarea {...register("description")} rows={5} required />
          {errors.description && (
            <small className="error-text">{errors.description.message}</small>
          )}
        </label>
        {datetime("starts_at", "Início *")}
        {datetime("ends_at", "Encerramento")}
        {field("venue_name", "Nome do local", true)}
        {field("address", "Endereço", true)}
        {field("neighborhood", "Bairro")}
        {field("city", "Cidade", true)}
        {field("state", "Estado (UF)", true)}
        {field("organizer", "Organizador")}
        <label>
          Instagram do evento/organizador
          <input
            type="url"
            {...register("instagram_url")}
            placeholder="https://www.instagram.com/organizador/"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <small>Opcional. O perfil aparecerá na página do evento.</small>
          {errors.instagram_url && (
            <small className="error-text">{errors.instagram_url.message}</small>
          )}
        </label>
        <label className="check">
          <input type="checkbox" {...register("is_free")} /> Entrada gratuita
        </label>
        {field("price", "Preço ou faixa de preço")}
        {field("ticket_url", "Link HTTPS dos ingressos", false, "url")}
        <label>Classificação indicativa<select {...register('age_rating')}>{!AGE_OPTIONS.includes(v.age_rating)&&<option>{v.age_rating}</option>}{AGE_OPTIONS.map(a=><option key={a}>{a}</option>)}</select></label>
        <label>Adequado para crianças?<select value={v.family_friendly===null?'':String(v.family_friendly)} onChange={ev=>setValue('family_friendly',ev.target.value===''?null:ev.target.value==='true',{shouldDirty:true})}><option value="">Não informado / consultar organizador</option><option value="true">Sim, adequado para crianças</option><option value="false">Não recomendado para crianças</option></select></label>
        {!e.id&&!submissionId&&<fieldset className="full recurrence-fields"><legend>Repetir evento</legend><div className="form-grid"><label>Frequência<select value={frequency} onChange={ev=>{setFrequency(ev.target.value);setExtraDirty(true)}}><option value="none">Somente esta data</option><option value="weekly">Toda semana</option><option value="fortnightly">A cada 2 semanas (14 dias)</option><option value="monthly">Todo mês</option></select></label>{frequency!=='none'&&<label>Quantidade de edições (incluindo a primeira)<input type="number" min={2} max={24} value={count} onChange={ev=>{setCount(Number(ev.target.value));setExtraDirty(true)}} required /></label>}</div><small>Cria até 24 edições, cada uma com sua própria data. Depois, você pode editar ou cancelar cada edição separadamente. Nos meses mais curtos, usa o último dia disponível.</small></fieldset>}
        {e.recurrence_group&&<p className="full muted">Esta edição faz parte de uma série. Alterações aqui afetam somente esta data.</p>}
        {submissionPhoto&&<div className="full suggestion-photo"><img src={submissionPhoto} alt="Foto enviada na sugestão"/><label className="check"><input type="checkbox" checked={usePhoto} onChange={ev=>{setUsePhoto(ev.target.checked);setExtraDirty(true)}}/>Usar esta foto como capa</label></div>}
        <label>
          Imagem de capa (JPG, PNG ou WebP, até 5 MB)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => upload(e.target.files)}
          />
        </label>
        <label>
          Imagens adicionais (até 10)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={(e) => upload(e.target.files, true)}
          />
        </label>
        {v.cover_url && (
          <div className="image-edit">
            <img src={v.cover_url} alt="Capa selecionada" />
            <button
              type="button"
              onClick={() => setValue("cover_url", "", { shouldDirty: true })}
            >
              Remover capa
            </button>
          </div>
        )}
        {v.gallery.map((src, i) => (
          <div className="image-edit" key={src}>
            <img src={src} alt={`Imagem adicional ${i + 1}`} />
            <button
              type="button"
              onClick={() =>
                setValue(
                  "gallery",
                  v.gallery.filter((x) => x !== src),
                  { shouldDirty: true },
                )
              }
            >
              Remover imagem
            </button>
          </div>
        ))}
        <label className="full">
          Informações adicionais
          <textarea {...register("additional_info")} rows={3} />
        </label>
        <label className="full">Aviso de alteração para visitantes<textarea {...register('change_notice')} maxLength={1000} rows={2}/><small>Alterações de data, local e outros dados importantes geram um aviso automaticamente. Você pode escrever uma orientação mais específica aqui.</small></label>
        <label>
          Status
          <select {...register("status")}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="scheduled">Publicação agendada</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </label>
        {v.status === "scheduled" && datetime("publish_at", "Publicar em *")}
        <label className="check">
          <input type="checkbox" {...register("featured")} /> Destacar na página
          inicial
        </label>
      </div>
      {Object.keys(errors).length > 0 && (
        <p className="error-text" role="alert">
          Revise os campos:{" "}
          {Object.entries(errors)
            .map(([k, v]) => `${k}: ${v.message}`)
            .join(" · ")}
        </p>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {uploading && <p role="status">Enviando imagens…</p>}
      <div className="share-buttons">
        <button className="button lime-button" disabled={busy || uploading}>
          {busy
            ? "Salvando e aguardando confirmação…"
            : submissionId
              ? "Aceitar e salvar evento"
              : "Salvar evento"}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => setPreview(!preview)}
        >
          Pré-visualizar
        </button>
        <button
          type="button"
          disabled={busy}
          className="button secondary"
          onClick={close}
        >
          Cancelar
        </button>
      </div>
      {preview && (
        <section className="panel preview">
          <span className="eyebrow">PRÉ-VISUALIZAÇÃO · AINDA NÃO SALVO</span>
          {v.cover_url && <img src={v.cover_url} alt="Prévia da capa" />}
          <h1>{v.title || "Título do evento"}</h1>
          <p>
            {v.starts_at ? displayDate(v.starts_at) : "Informe a data"} ·{" "}
            {v.venue_name}
          </p>
          <p>
            {v.address}, {v.city} — {v.state}
          </p>
          <p>{v.is_free ? "Gratuito" : v.price}</p>
          <p className="description">{v.description}</p>
          <InstagramLink url={v.instagram_url} />
        </section>
      )}
    </form>
  );
}

