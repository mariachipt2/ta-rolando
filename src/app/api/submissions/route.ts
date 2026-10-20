import { service } from "@/lib/supabase";
import { visitor, sameOrigin, verifyBot, limit } from "@/lib/visitor";
import { validateSubmission } from "@/lib/submission-validation";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req))
      return Response.json({ error: "Origem inválida." }, { status: 403 });
    const body = await req.json();
    if (
      typeof body.request_id !== "string" ||
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(body.request_id)
    )
      return Response.json({ error: "Envio inválido." }, { status: 400 });
    const event = validateSubmission(body.event);
    if (!(await verifyBot(body.token || "")))
      return Response.json(
        { error: "Complete a verificação de segurança." },
        { status: 403 },
      );
    const hash = await visitor(true);
    if (!(await limit("submissions:" + hash, 5, 3600)))
      return Response.json(
        { error: "Limite de envios atingido. Tente mais tarde." },
        { status: 429 },
      );
    const db = service();
    const { data: category } = await db
      .from("categories")
      .select("id")
      .eq("id", event.category_id)
      .eq("active", true)
      .maybeSingle();
    if (!category)
      return Response.json(
        { error: "Escolha uma categoria ativa." },
        { status: 400 },
      );
    const { error } = await db
      .from("event_submissions")
      .upsert(
        { id: body.request_id, visitor_hash: hash, event_data: event },
        { onConflict: "id", ignoreDuplicates: true },
      );
    if (error) throw error;
    const { data, error: readError } = await db
      .from("event_submissions")
      .select("id,submitted_at")
      .eq("id", body.request_id)
      .eq("visitor_hash", hash)
      .single();
    if (readError) throw readError;
    return Response.json(
      { id: data.id, saved_at: data.submitted_at },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Não foi possível confirmar o envio.",
      },
      { status: 400 },
    );
  }
}
