import type { MetadataRoute } from "next";
import { publicData } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { events } = await publicData();
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...events.map((e) => ({
      url: base + "/evento/" + e.slug,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
