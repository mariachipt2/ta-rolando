import fs from "node:fs";
import { randomBytes } from "node:crypto";
if (!fs.existsSync(".env.local")) {
  let content = fs
    .readFileSync(".env.local.example", "utf8")
    .replace(
      "NEXT_PUBLIC_SITE_URL=http://localhost:3000",
      "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000",
    );
  content = content
    .replace(
      "VISITOR_SECRET=\n",
      `VISITOR_SECRET=${randomBytes(32).toString("hex")}\n`,
    )
    .replace(
      "CRON_SECRET=\n",
      `CRON_SECRET=${randomBytes(32).toString("hex")}\n`,
    );
  fs.writeFileSync(".env.local", content, { mode: 0o600 });
  console.log(
    ".env.local preparado. Preencha somente as credenciais do seu projeto Supabase.",
  );
} else console.log(".env.local já existe; conteúdo preservado.");
