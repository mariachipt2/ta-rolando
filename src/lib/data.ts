import "server-only";
import { createClient } from "@supabase/supabase-js";
import { configured } from "./supabase";
import type { Event, Category } from "./types";
import { readAll } from "./pagination";
export async function publicData() {
  if (!configured())
    return {
      events: [] as Event[],
      categories: [] as Category[],
      error: false,
    };
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  try {
    const [events, categories] = await Promise.all([
      readAll<Event>((from, to) =>
        db
          .from("public_events")
          .select("*")
          .order("starts_at")
          .order("id")
          .range(from, to),
      ),
      readAll<Category>((from, to) =>
        db
          .from("categories")
          .select("*")
          .eq("active", true)
          .order("name")
          .range(from, to),
      ),
    ]);
    return { events, categories, error: false };
  } catch {
    return { events: [] as Event[], categories: [] as Category[], error: true };
  }
}
