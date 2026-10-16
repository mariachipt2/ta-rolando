import { admin } from "@/lib/supabase";
import { sameOrigin } from "@/lib/visitor";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return new Response(null, { status: 403 });
    const db = await admin();
    if (!db) return new Response(null, { status: 401 });
    if (Number(req.headers.get("content-length") || 0) > 6 * 1024 * 1024)
      return Response.json({ error: "Limite de 5 MB." }, { status: 413 });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
      return Response.json(
        { error: "Selecione uma imagem de até 5 MB." },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    let ext = "";
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
      ext = "jpg";
    if (
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      ext = "png";
    if (
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    )
      ext = "webp";
    if (!ext)
      return Response.json({ error: "Use JPG, PNG ou WebP." }, { status: 400 });
    const path = crypto.randomUUID() + "." + ext;
    const { error } = await db.storage
      .from("event-images")
      .upload(path, bytes, {
        contentType: ext === "jpg" ? "image/jpeg" : "image/" + ext,
        upsert: false,
      });
    if (error) throw error;
    return Response.json({
      url: db.storage.from("event-images").getPublicUrl(path).data.publicUrl,
    });
  } catch {
    return Response.json(
      { error: "Falha no envio. Verifique o bucket event-images." },
      { status: 500 },
    );
  }
}
