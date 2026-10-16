import { admin } from "@/lib/supabase";
import { eventSchema, slugify } from "@/lib/validation";
import { sameOrigin } from "@/lib/visitor";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return new Response(null, { status: 403 });
    const db = await admin();
    if (!db) return Response.json({ error: "Acesso negado." }, { status: 401 });
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues.map((e) => e.message).join(" ") },
        { status: 400 },
      );
    const base =
      process.env.NEXT_PUBLIC_SUPABASE_URL +
      "/storage/v1/object/public/event-images/";
    if (
      [parsed.data.cover_url, ...parsed.data.gallery].some(
        (url) => url && !url.startsWith(base),
      )
    )
      return Response.json(
        { error: "Use imagens enviadas ao armazenamento do projeto." },
        { status: 400 },
      );
    const id = z.string().uuid().optional().safeParse(body.id);
    if (!id.success)
      return Response.json({ error: "ID inválido." }, { status: 400 });
    const value = parsed.data;
    const result = id.data
      ? await db
          .from("events")
          .update(value)
          .eq("id", id.data)
          .select("id")
          .single()
      : await db
          .from("events")
          .insert({
            ...value,
            slug: slugify(value.title) + "-" + crypto.randomUUID().slice(0, 8),
          })
          .select("id")
          .single();
    if (result.error) throw result.error;
    return Response.json({ ok: true, id: result.data.id });
  } catch {
    return Response.json(
      { error: "Não foi possível salvar o evento." },
      { status: 500 },
    );
  }
}
export async function DELETE(req: Request) {
  try {
    if (!sameOrigin(req)) return new Response(null, { status: 403 });
    const db = await admin();
    if (!db) return new Response(null, { status: 401 });
    const p = z.object({ id: z.string().uuid() }).safeParse(await req.json());
    if (!p.success) return new Response(null, { status: 400 });
    const { error } = await db.from("events").delete().eq("id", p.data.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Não foi possível excluir." },
      { status: 500 },
    );
  }
}
