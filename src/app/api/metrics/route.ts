import { NextResponse } from "next/server";
import { z } from "zod";
import { visitor, limit, sameOrigin } from "@/lib/visitor";
import { service, configured } from "@/lib/supabase";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req) || !configured())
      return new NextResponse(null, { status: 403 });
    const p = z
      .object({ event_id: z.string().uuid(), kind: z.enum(["view", "ticket"]) })
      .safeParse(await req.json());
    if (!p.success) return new NextResponse(null, { status: 400 });
    const hash = await visitor(true);
    if (
      await limit(`metric:${hash}:${p.data.event_id}:${p.data.kind}`, 1, 3600)
    )
      await service().rpc("record_metric", {
        p_event: p.data.event_id,
        p_kind: p.data.kind,
      });
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
