import { NextResponse } from "next/server";
import { z } from "zod";
import { visitor, limit, sameOrigin, verifyBot } from "@/lib/visitor";
import { service, configured } from "@/lib/supabase";
import { readAll } from "@/lib/pagination";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET() {
  try {
    if (!configured()) return reply({ ids: [] });
    const hash = await visitor();
    if (!hash) return reply({ ids: [] });
    const data = await readAll<{ event_id: string }>((from, to) =>
      service()
        .from("event_attendance")
        .select("event_id")
        .eq("visitor_hash", hash)
        .order("event_id")
        .range(from, to),
    );
    return reply({ ids: data.map((x) => x.event_id) });
  } catch {
    return reply({ error: "Não foi possível carregar sua agenda." }, 503);
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return reply({ error: "Origem inválida." }, 403);
    if (!configured())
      return reply(
        { error: "O banco de dados ainda não foi configurado." },
        503,
      );
    const parsed = z
      .object({
        event_id: z.string().uuid(),
        attending: z.boolean(),
        token: z.string().max(4096).optional(),
      })
      .safeParse(await req.json());
    if (!parsed.success) return reply({ error: "Dados inválidos." }, 400);
    if (parsed.data.attending && !(await verifyBot(parsed.data.token || "")))
      return reply({ error: "Complete a verificação de segurança." }, 403);
    const hash = await visitor(true);
    if (!(await limit("attendance:" + hash)))
      return reply({ error: "Muitas tentativas. Aguarde um minuto." }, 429);
    const { data, error } = await service().rpc("set_attendance", {
      p_event: parsed.data.event_id,
      p_visitor: hash,
      p_attending: parsed.data.attending,
    });
    if (error)
      return reply(
        {
          error:
            "Não foi possível alterar a marcação. O evento pode estar encerrado.",
        },
        400,
      );
    return reply({ count: Number(data), attending: parsed.data.attending });
  } catch {
    return reply({ error: "Serviço indisponível. Tente novamente." }, 503);
  }
}
