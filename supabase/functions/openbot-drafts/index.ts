import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4";
import { timingSafeEqual } from "node:crypto";
import { resolveDraftArtists } from "../_shared/artist-matching.ts";
import { photoType } from "../_shared/photos.ts";
import { normalizeDraftStart } from "../_shared/draft-time.ts";

const secret = Deno.env.get("OPENBOT_DRAFT_TOKEN");
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const line = (max: number) => z.string().trim().max(max);
const https = z.url({ protocol: /^https$/ }).max(2048);
const date = z.iso.datetime({ offset: true });
const schema = z.object({
  title: line(160).min(3),
  category: line(100).min(1),
  starts_at: z.union([date,z.iso.date()]),
  time_tbd: z.boolean().default(false),
  ends_at: date.optional(),
  venue_name: line(160).min(1),
  address: line(240).default(""),
  neighborhood: line(120).default(""),
  organizer: line(160).default(""),
  artist_ids: z.array(z.string().uuid()).max(20).optional(),
  artists: z.array(line(160).min(2)).max(20).optional(),
  description: line(5000).default(""),
  price: line(150).default(""),
  is_free: z.boolean().default(false),
  family_friendly: z.boolean().optional(),
  cover_url: https.optional(),
  cover_base64: z.base64().max(6990508).optional(),
  ticket_url: https.optional(),
  instagram_url: z.string().regex(/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/).optional(),
  source_url: https.optional(),
}).strict().superRefine((value,ctx)=>{
  if(!value.time_tbd&&!value.starts_at.includes('T'))ctx.addIssue({code:'custom',path:['starts_at'],message:'Informe o horário ou marque time_tbd.'});
  if(value.time_tbd&&value.ends_at)ctx.addIssue({code:'custom',path:['ends_at'],message:'O encerramento deve ficar vazio enquanto o horário estiver a confirmar.'});
}).transform(value=>({...value,starts_at:normalizeDraftStart(value.starts_at,value.time_tbd)}));

const encoder = new TextEncoder();
const normalize = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const maxBodyBytes = 6990508 + 24000;
const reviewUrl = (id: string) => `https://tarolandoipatinga.com.br/#/admin?rascunho=${encodeURIComponent(id)}`;

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ error: "Use POST." }, 405);
  const token = req.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
  if (!secret || !token || secret.length !== token.length ||
      !timingSafeEqual(encoder.encode(secret), encoder.encode(token))) {
    return reply({ error: "Credencial inválida." }, 401);
  }
  try {
    const reader = req.body?.getReader();
    if (!reader) return reply({ error: "Ficha vazia." }, 400);
    const decoder = new TextDecoder();
    let raw = "";
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        return reply({ error: "Ficha muito grande." }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return reply({ error: "JSON inválido." }, 400); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return reply({ error: "Ficha inválida.", fields: parsed.error.issues.map(issue => issue.path.join(".") || "ficha") }, 400);
    const { category, source_url, cover_base64, artists: artistNames, ...fields } = parsed.data;
    if (fields.ends_at && Date.parse(fields.ends_at) <= Date.parse(fields.starts_at)) {
      return reply({ error: "O término precisa ser depois do início." }, 400);
    }
    const categories = await db.from("categories").select("id,name").eq("active", true);
    if (categories.error) throw categories.error;
    const match = categories.data.find(item => normalize(item.name) === normalize(category));
    if (!match) return reply({ error: "Escolha uma categoria ativa.", categories: categories.data.map(item => item.name) }, 422);

    let linkedNames: string[] = [];
    if (fields.artist_ids?.length || artistNames?.length) {
      const profiles: { id: string; name: string }[] = [];
      for (let offset = 0; ; offset += 500) {
        const result = await db.from("artists").select("id,name").eq("active", true).order("id").range(offset, offset + 499);
        if (result.error) throw result.error;
        profiles.push(...result.data);
        if (result.data.length < 500) break;
      }
      const resolved = resolveDraftArtists(artistNames || [], fields.artist_ids || [], profiles);
      if (resolved.unknown.length || resolved.ambiguous.length || resolved.invalidIds.length || resolved.ids.length > 20) {
        return reply({
          error: "Não foi possível identificar todos os artistas. Confira os nomes e o cadastro no painel.",
          unknown_artists: resolved.unknown, ambiguous_artists: resolved.ambiguous,
          invalid_artist_ids: resolved.invalidIds, fields: ["artists", "artist_ids"],
        }, 422);
      }
      fields.artist_ids = resolved.ids;
      linkedNames = resolved.names;
    }
    async function attachArtists(eventId: string) {
      if (!fields.artist_ids?.length) return null;
      const result = await db.rpc("attach_draft_artists", { p_event: eventId, p_artists: fields.artist_ids });
      if (result.error) throw result.error;
      return result.data;
    }

    const identity = JSON.stringify([normalize(fields.title), new Date(fields.starts_at).toISOString(), normalize(fields.venue_name)]);
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(identity));
    const slug = "openbot-" + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    const existing = await db.from("events").select("id,status,cover_url,deleted_at").eq("slug", slug).maybeSingle();
    if (existing.error) throw existing.error;
    const previous = existing.data;
    const canAttach = previous?.status === "draft" && !previous.deleted_at && !previous.cover_url;
    if (previous && !(cover_base64 && canAttach)) {
      const linked = await attachArtists(previous.id);
      return reply({
        status: "already_imported",
        ...(linked ? { artists_linked: linkedNames, saved_at: linked.saved_at } : {}),
        ...(previous.status === "draft" && !previous.deleted_at ? { review_url: reviewUrl(previous.id) } : {}),
      });
    }

    if (cover_base64) {
      const bytes = Uint8Array.from(atob(cover_base64), char => char.charCodeAt(0));
      let type: ReturnType<typeof photoType>;
      try { type = photoType(bytes); } catch {
        return reply({ error: "Use um cartaz JPG, PNG ou WebP de até 5 MB." }, 400);
      }
      const imageDigest = await crypto.subtle.digest("SHA-256", bytes);
      const imageHash = Array.from(new Uint8Array(imageDigest), byte => byte.toString(16).padStart(2, "0")).join("");
      const path = `openbot/${slug}/${imageHash}.${type.ext}`;
      const bucket = db.storage.from("event-images");
      const upload = await bucket.upload(path, bytes, { contentType: type.mime, upsert: true });
      if (upload.error) return reply({ error: "Falha ao enviar o cartaz ao Supabase. Tente novamente." }, 502);
      fields.cover_url = bucket.getPublicUrl(path).data.publicUrl;
    }

    if (previous) {
      const result = await db.rpc("attach_draft_artists", {
        p_event: previous.id, p_artists: fields.artist_ids || [], p_cover_url: fields.cover_url || null,
      });
      if (result.error) throw result.error;
      if (result.data) return reply({
        status: "draft", id: result.data.id, saved_at: result.data.saved_at,
        cover_attached: result.data.cover_attached, artists_linked: linkedNames, review_url: reviewUrl(previous.id),
      });
      return reply({ status: "already_imported" });
    }
    const { data, error } = await db.from("events").upsert({
      ...fields,
      slug,
      category_id: match.id,
      city: "Ipatinga",
      state: "MG",
      status: "draft",
      age_rating: "Não informada",
      additional_info: source_url ? `Fonte da importação: ${source_url}` : "",
    }, { onConflict: "slug", ignoreDuplicates: true }).select("id,updated_at").maybeSingle();
    if (error) throw error;
    if (data) return reply({ status: "draft", ...data, artists_linked: linkedNames, cover_attached: !!fields.cover_url, review_url: reviewUrl(data.id) }, 201);
    const concurrent = await db.from("events").select("id").eq("slug", slug).eq("status", "draft").is("deleted_at", null).maybeSingle();
    if (concurrent.error) throw concurrent.error;
    const linked = concurrent.data ? await attachArtists(concurrent.data.id) : null;
    return reply({ status: "already_imported", ...(linked ? { artists_linked: linkedNames, saved_at: linked.saved_at } : {}), ...(concurrent.data ? { review_url: reviewUrl(concurrent.data.id) } : {}) });
  } catch {
    return reply({ error: "Não foi possível salvar o rascunho." }, 500);
  }
});
