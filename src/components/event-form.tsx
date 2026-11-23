"use client";
import { ArtistPicker } from "./artist-picker";
import { discoverySourceCover } from "@/lib/discovery-draft";
import {VenueAutocomplete,EnvironmentPicker} from './venue-autocomplete';
import {venueOptions,type VenueOption} from '@/lib/venue-directory';
import type {Venue} from '@/lib/venues';
import {OrganizerPicker} from './organizer-picker';
import { request, navigate } from "@/lib/transport";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Event, Category } from "@/lib/types";
import { eventSchema } from "@/lib/validation";
import { day, localInput, toISO, displayDate } from "@/lib/dates";
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
    [uploading, setUploading] = useState(false),
    [failedCover, setFailedCover] = useState("");
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
      time_tbd: e.time_tbd || false,
      ends_at: e.ends_at || null,
      environment:e.environment??null,
      venue_name: e.venue_name || "",
      address: e.address || "",
      neighborhood: e.neighborhood || "",
      city: e.city || "Ipatinga",
      state: e.state || "MG",
      organizer: e.organizer || "",
      artist_ids: e.artist_ids || [],
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
  const [savedVenues,setSavedVenues]=useState<Venue[]>([]);
  useEffect(()=>{let active=true;request('/api/admin/venues').then(async r=>{if(r.ok){const data=await r.json();if(active)setSavedVenues(data.venues||[])}}).catch(()=>{});return()=>{active=false}},[]);
  const locations=venueOptions(savedVenues,savedEvents);
  function selectVenue(venue:VenueOption){
    const values={venue_name:venue.name,neighborhood:venue.neighborhood,environment:venue.environment,city:venue.city,state:venue.state,address:venue.address||''};
    for(const key of Object.keys(values) as (keyof typeof values)[])setValue(key,values[key],{shouldDirty:true,shouldValidate:key!=='address'||!!values.address});
    if(venue.organizer)setValue('organizer',venue.organizer,{shouldDirty:true});
    if(venue.instagram_url)setValue('instagram_url',venue.instagram_url,{shouldDirty:true});
  }
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
      <ArtistPicker value={v.artist_ids || []} onChange={ids => setValue("artist_ids", ids, { shouldDirty: true, shouldValidate: true })}/>
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
        <label className="check full"><input type="checkbox" checked={!!v.time_tbd} onChange={ev=>{setValue('time_tbd',ev.target.checked,{shouldDirty:true,shouldValidate:true});if(ev.target.checked){setValue('ends_at',null,{shouldDirty:true});if(v.starts_at)setValue('starts_at',toISO(day(v.starts_at)+'T00:00'),{shouldDirty:true})}}}/>Horário a confirmar</label>
        {v.time_tbd?<label>Data do evento *<input type="date" required value={v.starts_at?day(v.starts_at):''} onChange={ev=>setValue('starts_at',ev.target.value?toISO(ev.target.value+'T00:00'):'',{shouldDirty:true,shouldValidate:true})}/><small>O site mostra a data e “Horário a confirmar”. Quando souber o horário, desmarque a opção e preencha o início.</small>{errors.starts_at&&<small className="error-text">Informe a data do evento.</small>}</label>:datetime("starts_at", "Início *")}
        {!v.time_tbd&&datetime("ends_at", "Encerramento")}
        <VenueAutocomplete error={errors.venue_name?.message} value={v.venue_name} options={locations} onSelect={selectVenue} onChange={name=>{setValue('venue_name',name,{shouldDirty:true,shouldValidate:true});setValue('environment',null,{shouldDirty:true});setValue('neighborhood','',{shouldDirty:true});setValue('address','',{shouldDirty:true})}}/>
        <EnvironmentPicker value={v.environment??null} onChange={value=>setValue('environment',value,{shouldDirty:true,shouldValidate:true})}/>
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
        {!v.cover_url && discoverySourceCover(e) && <div className="full">
          <button type="button" className="button secondary" onClick={() => setValue("cover_url", discoverySourceCover(e), { shouldDirty: true })}>Carregar cartaz da fonte como capa</button>
        </div>}
        {v.cover_url && (
          <div className="image-edit">
            {failedCover === v.cover_url ? <p role="status">Não foi possível carregar esta capa. Abra o cartaz na fonte ou envie a imagem pelo campo de upload.</p> : <img src={v.cover_url} alt="Capa selecionada" referrerPolicy="no-referrer" onError={() => setFailedCover(v.cover_url)} />}
            <a href={v.cover_url} target="_blank" rel="noopener noreferrer">Abrir imagem da capa ↗</a>
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
            {v.starts_at ? displayDate(v.starts_at, v.time_tbd) : "Informe a data"} ·{" "}
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

