import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicKey=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
  let privileged=publicKey.startsWith('sb_secret_');
  try {privileged ||= JSON.parse(Buffer.from(publicKey.split('.')[1]||'','base64url').toString()).role==='service_role'}catch{}
  if(privileged)throw new Error('A variável pública contém uma chave secreta. Use apenas Publishable key ou anon.');
  return {
    root: "pages-app",
    base: process.env.PAGES_BASE || "/ta-rolando/",
    plugins: [react()],
    publicDir: false,
    resolve: {
      alias: {
        "@": path.resolve("src"),
        "next/link": path.resolve("pages-app/shims/link.tsx"),
        "next/image": path.resolve("pages-app/shims/image.tsx"),
        "next/navigation": path.resolve("pages-app/shims/navigation.ts"),
        "next/script": path.resolve("pages-app/shims/script.tsx"),
      },
    },
    define: {
      "process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY": JSON.stringify(
        env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
      ),
      __SUPABASE_URL__: JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || ""),
      __SUPABASE_PUBLIC_KEY__: JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
      ),
    },
    build: { outDir: path.resolve("dist-pages"), emptyOutDir: true },
    server: { host: "127.0.0.1" },
  };
});
