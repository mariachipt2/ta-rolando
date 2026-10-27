import {publicClock} from '@/lib/public-clock';
import {loadSpecialTheme,saveSpecialTheme} from '@/lib/special-theme-actions';
import {siteClock} from '@/lib/site-clock';
import {publicationInbox,readPublicationNotice} from '@/lib/publication-notifications';
import {loadVenues,saveVenue,publicVenue} from '@/lib/venue-actions';
import {loadDiscoveryMarks,saveDiscoveryMark} from '@/lib/discovery-mark-actions';
import {loadRegistryExport} from '@/lib/admin-export';
import {saveEvent,trashEvent,reviewSuggestion,reviewReport,getVersions,restoreVersion,signedSubmissions} from '@/lib/admin-actions';
import { createClient } from "@supabase/supabase-js";
import { readAll } from "@/lib/pagination";
import { eventSchema, slugify } from "@/lib/validation";
import { calendar } from "@/lib/calendar";
import type { Category, Event, EventSubmission, SaveState, EventReport } from "@/lib/types";
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
    const [events, categories,serverNow] = await Promise.all([
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
      publicClock(db),
    ]);
    siteClock.sync(serverNow);
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
  const [events, categories, metrics, submissions, saveState, reports] =
    await Promise.all([
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
      readAll<EventSubmission>((a, b) =>
        db!
          .from("event_submissions")
          .select(
            "id,event_data,status,submitted_at,updated_at,reviewed_at,approved_event_id,photo_path",
          )
          .order("submitted_at", { ascending: false })
          .order("id")
          .range(a, b),
      ),
      db
        .from("admin_save_state")
        .select("saved_at,entity,record_id,operation")
        .eq("singleton", true)
        .single(),
      readAll<EventReport>((a,b)=>db!.from('event_reports').select('id,event_id,kind,details,status,created_at,updated_at').order('created_at',{ascending:false}).order('id').range(a,b)),
    ]);
  if (saveState.error) throw saveState.error;
  return {
    events,
    categories,
    metrics,
    submissions:await signedSubmissions(db,submissions),
    reports,
    saveState: saveState.data as SaveState,
  };
}
function visitor() {
  const stored = localStorage.getItem("tr_pages_visitor");
  let entry: { value: string; expires: number } | null = null;
  try {
    entry = stored ? JSON.parse(stored) : null;
  } catch {}
  if (
    !entry ||
    typeof entry.value !== "string" ||
    !/^[a-f0-9]{64}$/.test(entry.value) ||
    typeof entry.expires !== "number" ||
    entry.expires < Date.now()
  ) {
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
  const response = await fetch(
    __SUPABASE_URL__ + "/functions/v1/public-events",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: __SUPABASE_PUBLIC_KEY__,
      },
      body: JSON.stringify({ action, visitor: visitor(), ...payload }),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (response.status === 404)
    return json(
      {
        error:
          "As marcações estão temporariamente indisponíveis. Tente novamente mais tarde.",
      },
      503,
    );
  return response;
}
async function edgePhoto(form:FormData){const payload=JSON.parse(String(form.get('payload')||'{}'));form.set('payload',JSON.stringify({...payload,action:'submission',visitor:visitor()}));return fetch(__SUPABASE_URL__+'/functions/v1/public-events',{method:'POST',headers:{apikey:__SUPABASE_PUBLIC_KEY__},body:form,signal:AbortSignal.timeout(60000)});}
export async function transport(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  try {
    const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
    if (path === "/api/attendance") {
      if (!configured && (!init.method || init.method === "GET"))
        return json({ ids: [] });
      return await edge(init.method === "POST" ? "attendance" : "agenda", body);
    }
    if (path === "/api/metrics") return await edge("metric", body);
    if (path === '/api/submissions') return init.body instanceof FormData?await edgePhoto(init.body):await edge('submission',body);
    if(path==='/api/reports')return await edge('report',body);
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
    if(path.startsWith('/api/venues?'))return json(await publicVenue(db,new URL(path,'https://local').searchParams.get('local')||''));
    if(path==='/api/special-theme')return json(await loadSpecialTheme(db));
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
    if(path==='/api/admin/special-theme')return json(init.method==='POST'?await saveSpecialTheme(db,body):await loadSpecialTheme(db,true));
    if(path==='/api/admin/notifications')return json(init.method==='POST'?await readPublicationNotice(db,body):await publicationInbox(db));
    if(path==='/api/admin/venues')return json(init.method==='POST'?await saveVenue(db,body):await loadVenues(db));
    if(path==='/api/admin/places'){const {data:{session}}=await db.auth.getSession();if(!session)return json({error:'Sessão expirada.'},401);return fetch(__SUPABASE_URL__+'/functions/v1/admin-places',{method:'POST',headers:{apikey:__SUPABASE_PUBLIC_KEY__,Authorization:'Bearer '+session.access_token},signal:AbortSignal.timeout(40000)})}
    if(path==='/api/admin/discovery-marks')return json(init.method==='POST'?await saveDiscoveryMark(db,body):await loadDiscoveryMarks(db));
    if(path==='/api/admin/discovery'){
      const {data:{session}}=await db.auth.getSession();
      if(!session)return json({error:'Sessão expirada. Entre novamente.'},401);
      return fetch(__SUPABASE_URL__+'/functions/v1/admin-discovery',{method:'POST',headers:{apikey:__SUPABASE_PUBLIC_KEY__,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({source:body.source}),signal:AbortSignal.timeout(60000)});
    }
    if(path==='/api/admin/export')return json(await loadRegistryExport(db));
    if(path.startsWith('/api/admin/history?'))return json({versions:await getVersions(db,new URL(path,'https://local').searchParams.get('event_id')||'')});
    if(path==='/api/admin/history')return json(await restoreVersion(db,body.version_id));
    if(path==='/api/admin/reports')return json(await reviewReport(db,body));
    if(path==='/api/admin/trash')return json(await trashEvent(db,body.id,body.deleted===true));
    if(path==='/api/admin/submissions')return json(await reviewSuggestion(db,body));
    if(path==='/api/admin/events')return json(init.method==='DELETE'?await trashEvent(db,body.id,true):await saveEvent(db,body));
    if (path === "/api/admin/categories") {
      const { id, ...value } = body;
      const { data, error } = id
        ? await db
            .from("categories")
            .update(value)
            .eq("id", id)
            .select("id,updated_at")
            .single()
        : await db
            .from("categories")
            .insert(value)
            .select("id,updated_at")
            .single();
      if (error) throw error;
      return json({ ok: true, id: data.id, saved_at: data.updated_at });
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


