import { admin } from "@/lib/supabase";
import { sameOrigin } from "@/lib/visitor";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return new Response(null, { status: 403 });
    const db = await admin();
    if (!db) return new Response(null, { status: 401 });
    const p = z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(80),
        icon: z.string().max(40),
        active: z.boolean(),
      })
      .safeParse(await req.json());
    if (!p.success)
      return Response.json({ error: "Categoria inválida." }, { status: 400 });
    const { id, ...value } = p.data;
    const { data,error } = id
      ? await db.from("categories").update(value).eq("id", id).select('id,updated_at').single()
      : await db.from("categories").insert(value).select('id,updated_at').single();
    if (error) throw error;
    return Response.json({ ok: true, id:data.id, saved_at:data.updated_at });
  } catch {
    return Response.json(
      { error: "Não foi possível salvar. Confira se o nome já existe." },
      { status: 400 },
    );
  }
}
