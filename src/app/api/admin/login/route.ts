import { session, configured } from "@/lib/supabase";
import { sameOrigin, limit } from "@/lib/visitor";
import { z } from "zod";
import { createHash } from "node:crypto";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req))
      return Response.json({ error: "Origem inválida" }, { status: 403 });
    if (!configured())
      return Response.json(
        { error: "Configure o Supabase no arquivo .env.local." },
        { status: 503 },
      );
    const p = z
      .object({
        email: z.string().email(),
        password: z.string().min(1).max(200),
      })
      .safeParse(await req.json());
    if (!p.success)
      return Response.json(
        { error: "Informe e-mail e senha." },
        { status: 400 },
      );
    const hash = createHash("sha256")
      .update(p.data.email.toLowerCase())
      .digest("hex");
    if (!(await limit("login:" + hash, 8, 600)))
      return Response.json(
        { error: "Muitas tentativas. Aguarde dez minutos." },
        { status: 429 },
      );
    const db = await session();
    const { data, error } = await db.auth.signInWithPassword(p.data);
    if (error || !data.user)
      return Response.json(
        { error: "Não foi possível entrar. Verifique suas credenciais." },
        { status: 401 },
      );
    const { data: profile } = await db
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", data.user.id)
      .eq("active", true)
      .maybeSingle();
    if (!profile) {
      await db.auth.signOut();
      return Response.json(
        { error: "Esta conta não tem acesso administrativo." },
        { status: 403 },
      );
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      {
        error: "Não foi possível conectar. Confira a configuração do servidor.",
      },
      { status: 503 },
    );
  }
}
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return new Response(null, { status: 403 });
  const db = await session();
  await db.auth.signOut();
  return Response.json({ ok: true });
}
