import { admin, configured } from "@/lib/supabase";
import { readAll } from "@/lib/pagination";
import type { Event, Category, EventSubmission, SaveState } from "@/lib/types";
import { AdminLogin } from "@/components/admin-login";
import { AdminPanel } from "@/components/admin-panel";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const db = await admin();
  if (!db)
    return (
      <div className="shell page">
        <AdminLogin configured={configured()} />
      </div>
    );
  const [events, categories, metrics, submissions, state] = await Promise.all([
    readAll<Event>((from, to) =>
      db
        .from("admin_events")
        .select("*")
        .order("starts_at")
        .order("id")
        .range(from, to),
    ),
    readAll<Category>((from, to) =>
      db.from("categories").select("*").order("name").range(from, to),
    ),
    readAll<{
      event_id: string;
      day: string;
      views: number;
      ticket_clicks: number;
      interests_added: number;
      interests_removed: number;
    }>((from, to) =>
      db
        .from("event_metrics")
        .select("*")
        .order("day")
        .order("event_id")
        .range(from, to),
    ),
    readAll<EventSubmission>((from, to) =>
      db
        .from("event_submissions")
        .select(
          "id,event_data,status,submitted_at,updated_at,reviewed_at,approved_event_id",
        )
        .order("submitted_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
    db
      .from("admin_save_state")
      .select("saved_at,entity,record_id,operation")
      .eq("singleton", true)
      .single(),
  ]);
  if (state.error) throw state.error;
  return (
    <div className="shell page">
      <AdminPanel
        events={events}
        categories={categories}
        metrics={metrics}
        submissions={submissions}
        saveState={state.data as SaveState}
      />
    </div>
  );
}
