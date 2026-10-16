import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { service } from "./supabase";
function secret() {
  const s = process.env.VISITOR_SECRET;
  if (!s || s.length < 32)
    throw new Error("Configure VISITOR_SECRET com pelo menos 32 caracteres.");
  return s;
}
const sign = (s: string) =>
  createHmac("sha256", secret()).update(s).digest("hex");
export async function visitor(create = false) {
  const jar = await cookies();
  let value = jar.get("tr_visitor")?.value;
  let valid = false;
  if (value) {
    const [id, sig] = value.split(".");
    if (/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(value) && id && sig) {
      const expected = sign(id);
      valid = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    }
  }
  if (!valid) {
    if (!create) return null;
    const id = randomBytes(32).toString("hex");
    value = id + "." + sign(id);
    jar.set("tr_visitor", value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15552000,
    });
  }
  return sign("db:" + value!.split(".")[0]);
}
export async function limit(key: string, max = 20, seconds = 60) {
  const { data, error } = await service().rpc("consume_limit", {
    p_key: key,
    p_max: max,
    p_seconds: seconds,
  });
  if (error) throw error;
  return data === true;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return (
    !!origin &&
    origin === new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin
  );
}
export async function verifyBot(token: string) {
  if (!process.env.TURNSTILE_SECRET_KEY)
    return process.env.NODE_ENV !== "production";
  const r = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  const result = await r.json();
  const host = new URL(process.env.NEXT_PUBLIC_SITE_URL!).hostname;
  return result.success === true && result.hostname === host;
}
