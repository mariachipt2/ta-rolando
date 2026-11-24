import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  searchResult,
  publicSearchJob,
} from "../supabase/functions/_shared/openbot-search";
const valid = {
  source_url: "https://socialyte.com.br/eventos/show/",
  title: "Show confirmado",
  starts_at: "2030-12-18T20:00:00-03:00",
  venue_name: "Teatro",
  city: "Ipatinga",
  image_url: "https://example.com/cartaz.jpg",
};
test("Resultados do OpenBot exigem cidade, fonte e data confirmadas e sinalizam campos ausentes", () => {
  const now = new Date("2030-11-24T12:00:00Z");
  const r = searchResult(
    { items: [valid, valid], warnings: ["<b>Conferir preco</b>"] },
    "socialyte",
    now,
  );
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].is_free, null);
  assert.equal(r.items[0].ticket_url, "");
  assert.ok(r.items[0].missing.includes("Pago ou gratuito"));
  assert.deepEqual(r.warnings, ["Conferir preco"]);
  for (const extra of [
    { city: "Timoteo" },
    { starts_at: "2030-12-18" },
    { source_url: "https://evil.test/eventos/show/" },
  ])
    assert.throws(() =>
      searchResult({ items: [{ ...valid, ...extra }] }, "socialyte", now),
    );
  assert.throws(() =>
    searchResult({ items: Array(101).fill(valid) }, "socialyte", now),
  );
  assert.equal(
    searchResult(
      { items: [{ ...valid, starts_at: "2020-01-01T12:00:00Z" }] },
      "socialyte",
      now,
    ).items.length,
    0,
  );
  const shown = publicSearchJob({
    id: "x",
    status: "running",
    requested_by: "private",
    lease_token: "secret",
    result: null,
  });
  assert.ok(shown && !("lease_token" in shown) && !("requested_by" in shown));
});
test("Fila privada impede escrita publica, duplica ativa, entrega uma vez e expira coleta abandonada", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('00000000-0000-4000-8000-000000000001');`,
    );
    await db.exec(
      readFileSync("supabase/migrations/028_openbot_search.sql", "utf8"),
    );
    await db.exec(
      `insert into openbot_search_jobs(source,requested_by) values('socialyte','00000000-0000-4000-8000-000000000001')`,
    );
    await assert.rejects(() =>
      db.exec(
        `insert into openbot_search_jobs(source,requested_by) values('socialyte','00000000-0000-4000-8000-000000000001')`,
      ),
    );
    let claimed = await db.query<{ id: string; lease_token: string }>(
      "select * from claim_openbot_search()",
    );
    assert.equal(claimed.rows.length, 1);
    assert.ok(claimed.rows[0].lease_token);
    assert.equal(
      (await db.query("select * from claim_openbot_search()")).rows.length,
      0,
    );
    await db.exec(
      "update openbot_search_jobs set heartbeat_at=now()-interval '4 minutes'",
    );
    await db.query("select * from claim_openbot_search()");
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from openbot_search_jobs",
        )
      ).rows[0].status,
      "failed",
    );
    await db.exec("set role anon");
    await assert.rejects(() => db.query("select * from openbot_search_jobs"));
    await assert.rejects(() =>
      db.query("select * from claim_openbot_search()"),
    );
    await db.exec("reset role;set role authenticated");
    await assert.rejects(() => db.query("select * from openbot_search_jobs"));
    await assert.rejects(() =>
      db.exec(
        `insert into openbot_search_jobs(source,requested_by) values('lhever','00000000-0000-4000-8000-000000000001')`,
      ),
    );
  } finally {
    await db.close();
  }
});
