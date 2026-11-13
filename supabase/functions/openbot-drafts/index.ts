import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4";
import { timingSafeEqual } from "node:crypto";

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
  starts_at: date,
  ends_at: date.optional(),
  venue_name: line(160).min(1),
  address: line(240).default(""),
  neighborhood: line(120).default(""),
  organizer: line(160).default(""),
  description: line(5000).default(""),
  price: line(150).default(""),
  is_free: z.boolean().default(false),
  family_friendly: z.boolean().optional(),
  cover_url: https.optional(),
  ticket_url: https.optional(),
  instagram_url: z.string().regex(/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/).optional(),
  source_url: https.optional(),
}).strict();

const encoder = new TextEncoder();
const normalize = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ error: "Use POST." }, 405);
  const token = req.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
  if (!secret || !token || secret.length !== token.length ||
      !timingSafeEqual(encoder.encode(secret), encoder.encode(token))) {
    return reply({ error: "Credencial inválida." }, 401);
  }
  try {
    const raw = await req.text();
    if (raw.length > 24000) return reply({ error: "Ficha muito grande." }, 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return reply({ error: "JSON inválido." }, 400); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return reply({ error: "Ficha inválida.", fields: parsed.error.issues.map(issue => issue.path.join(".") || "ficha") }, 400);
    const { category, source_url, ...fields } = parsed.data;
    if (fields.ends_at && Date.parse(fields.ends_at) <= Date.parse(fields.starts_at)) {
      return reply({ error: "O término precisa ser depois do início." }, 400);
    }
    const categories = await db.from("categories").select("id,name").eq("active", true);
    if (categories.error) throw categories.error;
    const match = categories.data.find(item => normalize(item.name) === normalize(category));
    if (!match) return reply({ error: "Escolha uma categoria ativa.", categories: categories.data.map(item => item.name) }, 422);

    const identity = JSON.stringify([normalize(fields.title), new Date(fields.starts_at).toISOString(), normalize(fields.venue_name)]);
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(identity));
    const slug = "openbot-" + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
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
    return data ? reply({ status: "draft", ...data }, 201) : reply({ status: "already_imported" });
  } catch {
    return reply({ error: "Não foi possível salvar o rascunho." }, 500);
  }
});
