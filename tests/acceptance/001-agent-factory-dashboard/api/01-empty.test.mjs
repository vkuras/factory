// A dashboard that has never received a report (S1.10, S2.2, R11, R12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, health } from '../lib/report.mjs';

test('the stack under test is empty', async () => {
  const h = await health();
  assert.equal(h.tickets, 0, 'this phase must run against a fresh stack');
});

test('S1.10 no ticket at all: the page says there is nothing yet instead of empty lists and charts', async () => {
  const p = await page('/');
  assert.equal(p.status, 200);
  assert.match(p.text, /Nothing here yet\./);
  assert.match(p.text, /The dashboard fills up as soon as the factory reports its first agent run\./);
  for (const empty of ['Running on their own', 'Per ticket', 'Token spend per agent', 'Where tickets bounce back', 'Human calls / ticket']) {
    assert.ok(!p.text.includes(empty), `an empty installation must not show "${empty}"`);
  }
  assert.ok(!p.html.includes('data-panel="pipeline"'), 'no empty tab panels');
});

test('S2.2 no agent run in progress: the header says so', async () => {
  const p = await page('/');
  assert.match(p.text, /no agents running/);
});

test('R11 the dashboard opens on Attention even when it is empty', async () => {
  const p = await page('/?tab=analytics');
  assert.match(p.text, /Nothing here yet\./);
});

test('R12 the page is a snapshot: no self-refresh, no data age, no caching', async () => {
  const p = await page('/');
  assert.equal(p.headers.get('cache-control'), 'no-store');
  assert.ok(!/synced/i.test(p.html), 'D5: no "synced X ago"');
  assert.ok(!/http-equiv=["']?refresh/i.test(p.html), 'no meta refresh');
});

test('an unknown ticket answers 404 with a way back', async () => {
  const p = await page('/ticket/999');
  assert.equal(p.status, 404);
  assert.match(p.text, /not here/i);
});
