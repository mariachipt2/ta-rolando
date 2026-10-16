import { z } from "zod";
export const safeUrl = z
  .string()
  .max(2048)
  .refine(
    (v) =>
      !v ||
      (() => {
        try {
          return new URL(v).protocol === "https:";
        } catch {
          return false;
        }
      })(),
    "Use um endereço HTTPS válido.",
  );
export const eventSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(20000),
    category_id: z.string().uuid(),
    starts_at: z.string().datetime({ offset: true }),
    ends_at: z.string().datetime({ offset: true }).nullable(),
    venue_name: z.string().trim().min(2).max(160),
    address: z.string().trim().min(3).max(300),
    neighborhood: z.string().max(100),
    city: z.string().min(2).max(100),
    state: z.string().length(2),
    organizer: z.string().max(160),
    is_free: z.boolean(),
    price: z.string().max(100),
    ticket_url: safeUrl,
    age_rating: z.string().max(40),
    cover_url: safeUrl,
    gallery: z.array(safeUrl).max(10),
    additional_info: z.string().max(5000),
    status: z.enum(["draft", "published", "scheduled", "cancelled"]),
    publish_at: z.string().datetime({ offset: true }).nullable(),
    featured: z.boolean(),
  })
  .refine((v) => !v.ends_at || new Date(v.ends_at) > new Date(v.starts_at), {
    message: "O encerramento deve ser após o início.",
    path: ["ends_at"],
  })
  .refine((v) => v.status !== "scheduled" || !!v.publish_at, {
    message: "Informe a data de publicação.",
    path: ["publish_at"],
  });
export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
