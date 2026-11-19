import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { artistEvents, artistName, artistSchema } from '../src/lib/artists';
import type { Event } from '../src/lib/types';

const brenda = 'c1c5e00a-a620-4ad0-a655-38d56f0fc689';
const other = '00000000-0000-4000-8000-000000000002';

test('Agenda do artista usa vínculos confirmados, respeita publicação e aceita eventos legados', () => {
  const base = { starts_at: '2030-11-20T20:00:00-03:00', ends_at: null, status: 'published', artist_ids: [brenda] } as Event;
  const events = [
    { ...base, id: 'show' }, { ...base, id: 'cancelled', status: 'cancelled' }, { ...base, id: 'draft', status: 'draft' },
    { ...base, id: 'trash', deleted_at: '2030-11-01' }, { ...base, id: 'old', starts_at: '2020-11-01T20:00:00-03:00' },
    { ...base, id: 'scheduled', status: 'scheduled', publish_at: '2030-11-21T12:00:00Z' },
    { ...base, id: 'legacy', title: 'Brenda Brandão', artist_ids: undefined },
  ] as Event[];
  assert.deepEqual(artistEvents(events, brenda, new Date('2030-11-19T12:00:00Z')).map(event => event.id), ['show']);
  assert.equal(artistName(' BRENDA   BRANDÃO '), 'brenda brandao');
  assert.equal(artistSchema.safeParse({ id: brenda, name: 'Brenda', kind: 'cantor', genre: '', bio: '', instagram_url: '', photo_url: '', active: true }).success, true);
});

test('Artistas e eventos são gravados atomicamente, com recorrência, RLS e restauração de versões', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema public,auth to anon,authenticated,service_role;`);
    for (const file of ['001_initial.sql','003_admin_totals.sql','004_event_instagram.sql','005_submissions_save_confirmation.sql','006_private_save_permissions.sql','007_event_management.sql','011_venues.sql','017_nightlife_filter.sql','020_artists.sql','021_bot_artist_links.sql']) {
      await db.exec(readFileSync('supabase/migrations/' + file, 'utf8'));
    }
    const category = (await db.query<{ id: string }>('select id from categories limit 1')).rows[0].id;
    await db.exec(`insert into auth.users values('00000000-0000-4000-8000-000000000001'); insert into admin_profiles(user_id,active) values('00000000-0000-4000-8000-000000000001',true); set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false)`);
    await db.query('insert into artists(id,slug,name,kind) values($1,$2,$3,$4)', [other, 'banda-teste', 'Banda de teste', 'banda']);
    const event = { title: 'Show de teste', description: 'Descrição do show', category_id: category, starts_at: '2030-11-20T23:00:00Z', venue_name: 'Local de teste', address: 'Rua Um, 123', status: 'published', artist_ids: [brenda, other, brenda] };
    const key = '00000000-0000-4000-8000-000000000005';
    const create = () => db.query<{ result: { ids: string[] } }>('select create_event_series($1,$2,$3,$4) result', [key, JSON.stringify(event), 'weekly', 2]);
    const ids = (await create()).rows[0].result.ids;
    await create();
    assert.equal((await db.query<{ n: number }>('select count(*)::int n from event_artists')).rows[0].n, 4);
    const publicRows = (await db.query<{ artist_ids: string[]; artists: { name: string }[] }>('select artist_ids,artists from public_events')).rows;
    assert.equal(publicRows.length, 2);
    assert.equal(publicRows[0].artist_ids.length, 2);
    assert.equal(publicRows[0].artists.length, 2);
    const originalVersion = (await db.query<{ id: string }>('select id from event_versions where event_id=$1 order by created_at limit 1', [ids[0]])).rows[0].id;
    await db.query('update events set artist_ids=$1 where id=$2', [[brenda], ids[0]]);
    assert.equal((await db.query<{ n: number }>('select count(*)::int n from event_artists where event_id=$1', [ids[0]])).rows[0].n, 1);
    await db.query('select restore_event_version($1)', [originalVersion]);
    assert.equal((await db.query<{ n: number }>('select count(*)::int n from event_artists where event_id=$1', [ids[0]])).rows[0].n, 2);
    await assert.rejects(() => db.query('update events set title=$1,artist_ids=$2 where id=$3', ['Não pode salvar', ['00000000-0000-4000-8000-000000000099'], ids[0]]));
    assert.equal((await db.query<{ title: string }>('select title from events where id=$1', [ids[0]])).rows[0].title, 'Show de teste');
    await db.query("update events set title='Show atualizado' where id=$1", [ids[0]]);
    assert.equal((await db.query<{ artist_ids: string[] }>('select artist_ids from events where id=$1', [ids[0]])).rows[0].artist_ids.length, 2);
    await db.query('update artists set active=false where id=$1', [other]);
    await db.exec("reset role; select set_config('request.jwt.claim.sub','',false); set role anon");
    assert.equal((await db.query<{ artists: unknown[] }>('select artists from public_events limit 1')).rows[0].artists.length, 1);
    await assert.rejects(() => db.query('update artists set name=$1 where id=$2', ['Nome falso', brenda]));
    await db.exec('reset role');
    await db.query("update events set status='draft' where id=$1", [ids[0]]);
    await db.exec('set role anon');
    assert.equal((await db.query<{ n: number }>('select count(*)::int n from event_artists where event_id=$1', [ids[0]])).rows[0].n, 0);
    assert.equal((await db.query('select * from public_events')).rows.length, 1);
    await db.exec('reset role');
    const third='00000000-0000-4000-8000-000000000003';
    await db.query("insert into artists(id,slug,name,kind) values($1,'terceiro-artista','Terceiro artista','cantor')",[third]);
    await db.exec('set role authenticated');
    await assert.rejects(()=>db.query('select attach_draft_artists($1,$2)',[ids[0],[third]]));
    await db.exec('reset role; set role service_role');
    const attach=()=>db.query<{result:{artist_ids:string[];cover_attached:boolean}}>('select attach_draft_artists($1,$2,$3) result',[ids[0],[brenda,third],'https://example.com/poster.jpg']);
    const attached=(await attach()).rows[0].result;
    assert.equal(attached.artist_ids.length,3);
    assert.equal(attached.cover_attached,true);
    assert.equal((await attach()).rows[0].result.cover_attached,false);
    assert.equal((await db.query<{n:number}>('select count(*)::int n from event_artists where event_id=$1',[ids[0]])).rows[0].n,3);
    assert.equal((await db.query<{result:unknown}>('select attach_draft_artists($1,$2) result',[ids[1],[third]])).rows[0].result,null);
    await db.exec('reset role');
    await db.query("update events set cover_url='' where id=$1",[ids[0]]);
    await db.exec('set role service_role');
    await assert.rejects(()=>db.query('select attach_draft_artists($1,$2,$3)',[ids[0],['00000000-0000-4000-8000-000000000099'],'https://example.com/invalid.jpg']));
    assert.equal((await db.query<{cover_url:string}>('select cover_url from events where id=$1',[ids[0]])).rows[0].cover_url,'');

  } finally { await db.close(); }
});
