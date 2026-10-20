import { admin } from "@/lib/supabase";
import { sameOrigin } from "@/lib/visitor";
import { eventSchema } from "@/lib/validation";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return new Response(null, { status: 403 });
    const db = await admin();
    if (!db) return new Response(null, { status: 401 });
    const body = await req.json();
    const parsed = z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
      })
      .safeParse(body);
    if (!parsed.success)
      return Response.json({ error: "Decisão inválida." }, { status: 400 });
    const event =
      parsed.data.decision === "approved"
        ? eventSchema.parse(body.event)
        : null;
    const { data, error } = await db.rpc("review_submission", {
      p_id: parsed.data.id,
      p_decision: parsed.data.decision,
      p_event: event,
    });
    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json(
      {
        error:
          "Não foi possível confirmar a análise. Recarregue a fila e tente novamente.",
      },
      { status: 400 },
    );
  }
}
