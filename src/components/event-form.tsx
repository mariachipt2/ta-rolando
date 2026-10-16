"use client";
import {request,navigate} from "@/lib/transport";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Event, Category } from "@/lib/types";
import { eventSchema } from "@/lib/validation";
import { localInput, toISO, displayDate } from "@/lib/dates";
type Values = z.infer<typeof eventSchema>;
export function EventForm({
  event: e,
  categories,
  onClose,
  onSaved,
}: {
  event: Partial<Event>;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
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
    formState: { errors },
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
      is_free: e.is_free ?? true,
      price: e.price || "",
      ticket_url: e.ticket_url || "",
      age_rating: e.age_rating || "Livre",
      cover_url: e.cover_url || "",
      gallery: e.gallery || [],
      additional_info: e.additional_info || "",
      status: e.status || "draft",
      publish_at: e.publish_at || null,
      featured: e.featured || false,
    },
  });
  const v = watch();
  async function upload(files: FileList | null, gallery = false) {
    if (!files) return;
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const f = new FormData();
        f.set("file", file);
        const r = await request("/api/admin/upload", { method: "POST", body: f });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        urls.push(d.url);
      }
      if (gallery) setValue("gallery", [...v.gallery, ...urls].slice(0, 10));
      else setValue("cover_url", urls[0]);
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
            { shouldValidate: true },
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
          const r = await request("/api/admin/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, id: e.id }),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          onSaved();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Falha ao salvar.");
        } finally {
          setBusy(false);
        }
      })}
    >
      <div className="section-heading">
        <h2>{e.id ? "Editar evento" : "Novo evento"}</h2>
        <button type="button" className="button secondary" onClick={onClose}>
          Fechar
        </button>
      </div>
      <p>Horários de Brasília. Campos com * são obrigatórios.</p>
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
        <label className="check">
          <input type="checkbox" {...register("is_free")} /> Entrada gratuita
        </label>
        {field("price", "Preço ou faixa de preço")}
        {field("ticket_url", "Link HTTPS dos ingressos", false, "url")}
        {field("age_rating", "Classificação indicativa")}
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
            <button type="button" onClick={() => setValue("cover_url", "")}>
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
          {busy ? "Salvando…" : "Salvar evento"}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => setPreview(!preview)}
        >
          Pré-visualizar
        </button>
        <button type="button" className="button secondary" onClick={onClose}>
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
        </section>
      )}
    </form>
  );
}
