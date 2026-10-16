import { service } from "@/lib/supabase";
export async function GET(req: Request) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return new Response(null, { status: 401 });
  const { error } = await service().rpc("cleanup_private_data");
  return Response.json({ ok: !error }, { status: error ? 500 : 200 });
}
