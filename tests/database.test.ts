import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("PostgreSQL: RLS, visibilidade, unicidade, métricas e remoção idempotente", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`,
    );
    await db.exec(readFileSync("supabase/migrations/001_initial.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/003_admin_totals.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/004_event_instagram.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/004_event_instagram.sql", "utf8"));
    await db.exec(`create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;`);
    await db.exec(readFileSync("supabase/migrations/002_storage.sql", "utf8"));
    const result = await db.query<{ id: string }>(
      `insert into events(slug,title,description,category_id,starts_at,venue_name,address,status) select 'teste','Evento de teste','Descrição longa',id,now()+interval '2 days','Local','Rua','published' from categories limit 1 returning id`,
    );
    const id = result.rows[0].id;
    await db.query('update events set instagram_url=$1 where id=$2',['https://www.instagram.com/organizador/',id]);
    assert.equal((await db.query<{instagram_url:string}>('select instagram_url from public_events where id=$1',[id])).rows[0].instagram_url,'https://www.instagram.com/organizador/');
    await assert.rejects(()=>db.query('update events set instagram_url=$1 where id=$2',['https://evil.test/perfil/',id]));
    await db.exec(
      `insert into events(slug,title,description,category_id,starts_at,venue_name,address,status) select 'privado','Rascunho','Descrição',id,now()+interval '2 days','Local','Rua','draft' from categories limit 1;`,
    );
    await db.exec("set role anon");
    assert.equal(
      (await db.query("select * from public_events")).rows.length,
      1,
    );
    await assert.rejects(() => db.query("select * from event_attendance"));
    await assert.rejects(() => db.query("select * from admin_events"));
    await assert.rejects(() => db.query("insert into storage.objects(bucket_id,name) values('event-images','invasao.png')"));
    await assert.rejects(() =>
      db.query("insert into categories(name) values('Invasão')"),
    );
    await assert.rejects(() =>
      db.query(`select set_attendance('${id}','evil',true)`),
    );
    await db.exec("reset role");
    await db.exec("set role service_role");
    for (let i = 0; i < 3; i++)
      await db.query("select set_attendance($1,$2,true)", [id, "visitor-one"]);
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from event_attendance",
        )
      ).rows[0].n,
      1,
    );
    await db.query("select set_attendance($1,$2,true)", [id, "visitor-two"]);
    assert.equal(
      (
        await db.query<{ interest_count: number }>(
          "select interest_count::int from public_events",
        )
      ).rows[0].interest_count,
      2,
    );
    await db.query("select set_attendance($1,$2,false)", [id, "visitor-one"]);
    await db.query("select set_attendance($1,$2,false)", [id, "visitor-one"]);
    const m = await db.query<{
      interests_added: number;
      interests_removed: number;
    }>("select interests_added::int,interests_removed::int from event_metrics");
    assert.deepEqual(m.rows[0], { interests_added: 2, interests_removed: 1 });
    for (let i = 0; i < 3; i++) {
      const r = await db.query<{ ok: boolean }>(
        "select consume_limit('test',2,60) ok",
      );
      assert.equal(r.rows[0].ok, i < 2);
    }
    await db.exec("reset role");
    await db.exec("set role authenticated");
    assert.equal((await db.query("select * from events")).rows.length, 0);
    assert.equal((await db.query("select * from admin_events")).rows.length, 0);
    await assert.rejects(() =>
      db.query("insert into categories(name) values('Invasão')"),
    );
    await db.exec("reset role");
    const uid = "00000000-0000-4000-8000-000000000001";
    await db.exec(
      `insert into auth.users values('${uid}');insert into admin_profiles values('${uid}',true);select set_config('request.jwt.claim.sub','${uid}',false);set role authenticated;`,
    );
    assert.equal((await db.query("select * from events")).rows.length, 2);
    assert.equal((await db.query("select * from admin_events")).rows.length, 2);
    await db.exec("insert into storage.objects(bucket_id,name) values('event-images','permitido.png')");
    await db.exec("insert into categories(name) values('Admin permitido')");
    await db.exec("reset role");
    await db.exec(
      `update events set status='scheduled',publish_at=now()+interval '1 hour' where id='${id}'`,
    );
    assert.equal(
      (await db.query("select * from public_events")).rows.length,
      0,
    );
    await db.exec(
      `update events set publish_at=now()-interval '1 hour' where id='${id}'`,
    );
    assert.equal(
      (await db.query("select * from public_events")).rows.length,
      1,
    );
    await db.exec(`update events set status='cancelled' where id='${id}'`);
    await assert.rejects(() =>
      db.query("select set_attendance($1,$2,true)", [id, "visitor-three"]),
    );
    await db.query("select set_attendance($1,$2,false)", [id, "visitor-two"]);
    await db.exec(`update events set status='published',starts_at=now()-interval '200 days' where id='${id}';insert into event_attendance(event_id,visitor_hash) values('${id}','old-visitor');select cleanup_private_data();`);
    assert.equal((await db.query('select * from event_attendance')).rows.length,0);
    assert.equal((await db.query('select * from event_metrics')).rows.length,1);
    await db.exec(`update admin_profiles set active=false where user_id='${uid}';set role authenticated;`);
    assert.equal((await db.query('select * from admin_events')).rows.length,0);
    await assert.rejects(()=>db.query("insert into storage.objects(bucket_id,name) values('event-images','revogado.png')"));
  } finally {
    await db.close();
  }
});
