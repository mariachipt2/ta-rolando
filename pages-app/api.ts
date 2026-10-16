import { createClient } from "@supabase/supabase-js";
import { readAll } from "@/lib/pagination";
import { eventSchema, slugify } from "@/lib/validation";
import { calendar } from "@/lib/calendar";
import type { Category, Event } from "@/lib/types";
export const configured = !!(__SUPABASE_URL__ && __SUPABASE_PUBLIC_KEY__);
export const db = configured
  ? createClient(__SUPABASE_URL__, __SUPABASE_PUBLIC_KEY__)
  : null;
const json = (v: unknown, status = 200) => Response.json(v, { status });
export async function loadPublic() {
  if (!db)
    return {
      events: [] as Event[],
      categories: [] as Category[],
      error: false,
    };
  try {
    const [events, categories] = await Promise.all([
      readAll<Event>((a, b) =>
        db!
          .from("public_events")
          .select("*")
          .order("starts_at")
          .order("id")
          .range(a, b),
      ),
      readAll<Category>((a, b) =>
        db!
          .from("categories")
          .select("*")
          .eq("active", true)
          .order("name")
          .range(a, b),
      ),
    ]);
    return { events, categories, error: false };
  } catch {
    return { events: [] as Event[], categories: [] as Category[], error: true };
  }
}
export async function isAdmin() {
  if (!db) return false;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return false;
  const { data, error } = await db
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  return !error && !!data;
}
export async function loadAdmin() {
  if (!db || !(await isAdmin())) return null;
  const [events, categories, metrics] = await Promise.all([
    readAll<Event>((a, b) =>
      db!
        .from("admin_events")
        .select("*")
        .order("starts_at")
        .order("id")
        .range(a, b),
    ),
    readAll<Category>((a, b) =>
      db!.from("categories").select("*").order("name").range(a, b),
    ),
    readAll<{
      event_id: string;
      day: string;
      views: number;
      ticket_clicks: number;
      interests_added: number;
      interests_removed: number;
    }>((a, b) =>
      db!
        .from("event_metrics")
        .select("*")
        .order("day")
        .order("event_id")
        .range(a, b),
    ),
  ]);
  return { events, categories, metrics };
}
function visitor() {
  const stored = localStorage.getItem("tr_pages_visitor");
  let entry: { value: string; expires: number } | null = null;
  try {
    entry = stored ? JSON.parse(stored) : null;
  } catch {}
  if (!entry || entry.expires < Date.now()) {
    entry = {
      value: Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
        n.toString(16).padStart(2, "0"),
      ).join(""),
      expires: Date.now() + 180 * 86400000,
    };
    localStorage.setItem("tr_pages_visitor", JSON.stringify(entry));
  }
  return entry.value;
}
async function edge(action: string, payload: Record<string, unknown> = {}) {
  if (!db) return json({ error: "O Supabase ainda não foi configurado." }, 503);
  return fetch(__SUPABASE_URL__ + "/functions/v1/public-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: __SUPABASE_PUBLIC_KEY__,
    },
    body: JSON.stringify({ action, visitor: visitor(), ...payload }),
    signal: AbortSignal.timeout(20000),
  });
}
export async function transport(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  try {
    const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
    if (path === "/api/attendance") {
      if (!configured && (!init.method || init.method === "GET"))
        return json({ ids: [] });
      return edge(init.method === "POST" ? "attendance" : "agenda", body);
    }
    if (path === "/api/metrics") return edge("metric", body);
    if (path.startsWith("/api/calendar/")) {
      const { events } = await loadPublic();
      const e = events.find((e) => e.id === path.split("/").at(-1));
      return e
        ? new Response(calendar(e), {
            headers: { "Content-Type": "text/calendar;charset=utf-8" },
          })
        : json({ error: "Evento não encontrado." }, 404);
    }
    if (!db)
      return json(
        {
          error:
            "Configure as variáveis públicas do Supabase no GitHub e publique novamente.",
        },
        503,
      );
    if (path === "/api/admin/login") {
      if (init.method === "DELETE") {
        await db.auth.signOut();
        return json({ ok: true });
      }
      const { error } = await db.auth.signInWithPassword(body);
      if (error) return json({ error: "E-mail ou senha inválidos." }, 401);
      if (!(await isAdmin())) {
        await db.auth.signOut();
        return json({ error: "Conta sem permissão administrativa." }, 403);
      }
      return json({ ok: true });
    }
    if (!(await isAdmin())) return json({ error: "Acesso negado." }, 401);
    if (path === "/api/admin/events") {
      if (init.method === "DELETE") {
        const { error } = await db.from("events").delete().eq("id", body.id);
        if (error) throw error;
        return json({ ok: true });
      }
      const parsed = eventSchema.safeParse(body);
      if (!parsed.success)
        return json(
          { error: parsed.error.issues.map((i) => i.message).join(" ") },
          400,
        );
      const result = body.id
        ? await db
            .from("events")
            .update(parsed.data)
            .eq("id", body.id)
            .select("id")
            .single()
        : await db
            .from("events")
            .insert({
              ...parsed.data,
              slug:
                slugify(parsed.data.title) +
                "-" +
                crypto.randomUUID().slice(0, 8),
            })
            .select("id")
            .single();
      if (result.error) throw result.error;
      return json({ ok: true, id: result.data.id });
    }
    if (path === "/api/admin/categories") {
      const { id, ...value } = body;
      const { error } = id
        ? await db.from("categories").update(value).eq("id", id)
        : await db.from("categories").insert(value);
      if (error) throw error;
      return json({ ok: true });
    }
    if (path === "/api/admin/upload") {
      const file = (init.body as FormData).get("file");
      if (!(file instanceof File) || file.size > 5242880)
        return json({ error: "Selecione uma imagem de até 5 MB." }, 400);
      const b = new Uint8Array(await file.arrayBuffer());
      const ascii = (a: number, z: number) =>
        String.fromCharCode(...b.slice(a, z));
      const ext =
        b[0] === 255 && b[1] === 216 && b[2] === 255
          ? "jpg"
          : b.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
            ? "png"
            : ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
              ? "webp"
              : "";
      if (!ext) return json({ error: "Use JPG, PNG ou WebP." }, 400);
      const name = crypto.randomUUID() + "." + ext;
      const { error } = await db.storage
        .from("event-images")
        .upload(name, file, {
          contentType: ext === "jpg" ? "image/jpeg" : "image/" + ext,
          upsert: false,
        });
      if (error) throw error;
      return json({
        url: db.storage.from("event-images").getPublicUrl(name).data.publicUrl,
      });
    }
    return json({ error: "Operação não encontrada." }, 404);
  } catch {
    return json(
      {
        error:
          "Não foi possível concluir. Verifique a conexão e a configuração do Supabase.",
      },
      503,
    );
  }
}
