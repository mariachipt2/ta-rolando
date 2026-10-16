import { publicData } from "@/lib/data";
import { calendar } from "@/lib/calendar";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { events } = await publicData();
  const e = events.find((e) => e.id === id);
  if (!e) return new Response(null, { status: 404 });
  return new Response(calendar(e), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
