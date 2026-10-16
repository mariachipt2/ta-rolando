import { test } from "node:test";
import assert from "node:assert/strict";
import { inPeriod, day, toISO, upcoming } from "../src/lib/dates";
import { safeUrl, slugify } from "../src/lib/validation";
import { calendar } from "../src/lib/calendar";
import type { Event } from "../src/lib/types";
test("Brasília, amanhã e fim de semana respeitam virada de dia e domingo", () => {
  const now = new Date("2026-10-17T01:00:00Z");
  assert.equal(day(now), "2026-10-16");
  assert.equal(toISO("2026-10-16T22:00"), "2026-10-17T01:00:00.000Z");
  assert.equal(
    inPeriod("2026-10-18T22:00:00-03:00", null, "weekend", now),
    true,
  );
  assert.equal(
    inPeriod(
      "2026-10-19T12:00:00-03:00",
      null,
      "weekend",
      new Date("2026-10-18T12:00:00-03:00"),
    ),
    false,
  );
  assert.equal(
    inPeriod("2026-10-17T01:00:00-03:00", null, "tomorrow", now),
    true,
  );
  assert.equal(
    inPeriod(
      "2026-10-15T23:00:00-03:00",
      "2026-10-16T03:00:00-03:00",
      "today",
      now,
    ),
    true,
  );
});
test("Eventos encerrados não são futuros", () => {
  assert.equal(
    upcoming(
      { starts_at: "2026-10-15T10:00:00Z", ends_at: null },
      new Date("2026-10-16T10:00:00Z"),
    ),
    false,
  );
});
test("Links de script e protocolos inseguros são rejeitados", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "http://example.com",
  ])
    assert.equal(safeUrl.safeParse(value).success, false);
  assert.equal(
    safeUrl.safeParse("https://example.com/ingressos").success,
    true,
  );
  assert.equal(slugify("Festa São João!"), "festa-sao-joao");
});
test("Calendário escapa conteúdo e preserva UTC", () => {
  const e = {
    id: "test",
    title: "Festa, show; legal",
    description: "Linha 1\nLinha 2",
    venue_name: "Praça",
    address: "Rua 1",
    starts_at: "2026-10-17T20:00:00-03:00",
    ends_at: null,
    status: "published",
  } as Event;
  const result = calendar(e);
  assert.match(result, /DTSTART:20261017T230000Z/);
  assert.match(result, /SUMMARY:Festa\\, show\\; legal/);
  assert.match(result, /Linha 1\\nLinha 2/);
});
