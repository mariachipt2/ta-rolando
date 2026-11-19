import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import type { Event } from '../src/lib/types';
import { agendaSpecialSchema, initialAgendaSpecial, specialVisible, specialEvents, specialDates, specialFromParams, specialGroupDay, specialUrl } from '../src/lib/agenda-special';

const settings = initialAgendaSpecial;
const event = (id: string, extra: Partial<Event> = {}) => ({
  id, starts_at: '2026-11-19T23:00:00-03:00', ends_at: null, status: 'published', ...extra,
} as Event);

test('Faixa começa e termina à meia-noite de Brasília e pode ser desativada', () => {
  assert.equal(specialVisible(settings, new Date('2026-11-18T02:59:59Z')), false);
  assert.equal(specialVisible(settings, new Date('2026-11-18T03:00:00Z')), true);
  assert.equal(specialVisible(settings, new Date('2026-11-23T02:59:59Z')), true);
  assert.equal(specialVisible(settings, new Date('2026-11-23T03:00:00Z')), false);
  assert.equal(specialVisible({ ...settings, enabled: false }, new Date('2026-11-20T15:00:00Z')), false);
  assert.deepEqual(specialDates(settings), ['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
});

test('Seleção inclui os quatro dias, horários da madrugada e eventos em andamento, sem registros privados', () => {
  const now = new Date('2026-11-20T12:00:00-03:00');
  const events = [event('ended'), event('live', { ends_at: '2026-11-20T15:00:00-03:00' }),
    event('last', { starts_at: '2026-11-22T23:00:00-03:00' }), event('next', { starts_at: '2026-11-23T00:00:00-03:00' }),
    event('before', { starts_at: '2026-11-18T23:00:00-03:00' }),
    event('draft', { status: 'draft' }), event('cancelled', { status: 'cancelled' }), event('trash', { deleted_at: '2026-11-18' }),
    event('future-publication', { status: 'scheduled', publish_at: '2026-11-21T10:00:00-03:00' }),
    event('published-schedule', { starts_at: '2026-11-21T23:00:00-03:00', status: 'scheduled', publish_at: '2026-11-20T10:00:00-03:00' })];
  assert.deepEqual(specialEvents(events, settings, now).map(item => item.id), ['live', 'published-schedule', 'last']);
  assert.deepEqual(specialEvents(events, settings, now, true).map(item => item.id), ['ended']);
  assert.equal(specialGroupDay(events[1], settings, now), '2026-11-20');
  assert.equal(specialGroupDay(events[0], settings, now, true), '2026-11-19');
  assert.equal(specialEvents([event('overlap', { starts_at: '2026-11-18T23:00:00-03:00', ends_at: '2026-11-19T01:00:00-03:00' })], settings, new Date('2026-11-18T15:00:00-03:00')).length, 1);
});

test('Links preservam período e título no Pages e no domínio, com datas inválidas recusadas', () => {
  const url = new URL(specialUrl('https://tarolandoipatinga.com.br/#/', settings));
  const parsed = specialFromParams(Object.fromEntries(new URLSearchParams(url.hash.split('?')[1])));
  assert.equal(parsed.success, true);
  assert.equal(new URL(specialUrl('https://tarolandoipatinga.com.br/', settings)).pathname, '/especial');
  for (const extra of [{ end_date: '2026-11-18' }, { end_date: '2026-12-20' }, { visible_from: '2026-11-23' }, { start_date: '2026-02-30' }]) {
    assert.equal(agendaSpecialSchema.safeParse({ ...settings, ...extra }).success, false);
  }
});

test('Supabase permite leitura pública, restringe escrita à administradora e confirma salvamento', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema public,auth to anon,authenticated,service_role;`);
    for (const name of ['001_initial.sql', '003_admin_totals.sql', '004_event_instagram.sql', '005_submissions_save_confirmation.sql', '006_private_save_permissions.sql', '019_agenda_special.sql']) {
      await db.exec(readFileSync('supabase/migrations/' + name, 'utf8'));
    }
    const save = (value: unknown) => db.query<{ result: { settings: { enabled: boolean; title: string }; saved_at: string } }>('select save_agenda_special($1) result', [JSON.stringify(value)]);
    await db.exec('set role anon');
    assert.equal((await db.query('select * from site_agenda_special')).rows.length, 1);
    await assert.rejects(() => save(settings));
    await assert.rejects(() => db.exec("update site_agenda_special set title='Teste'"));
    await db.exec('reset role; set role authenticated');
    await assert.rejects(() => save(settings));
    await db.exec("reset role; insert into auth.users values('00000000-0000-4000-8000-000000000001'); insert into admin_profiles(user_id,active) values('00000000-0000-4000-8000-000000000001',true); set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false)");
    const receipt = (await save({ ...settings, title: 'Especial de teste' })).rows[0].result;
    assert.ok(receipt.saved_at);
    assert.equal(receipt.settings.title, 'Especial de teste');
    await assert.rejects(() => save({ ...settings, end_date: '2026-11-18' }));
    assert.equal((await save({ ...settings, enabled: false })).rows[0].result.settings.enabled, false);
    assert.equal((await db.query<{ entity: string }>('select entity from admin_save_state')).rows[0].entity, 'site_agenda_special');
  } finally { await db.close(); }
});
