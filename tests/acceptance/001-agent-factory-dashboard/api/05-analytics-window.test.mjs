// D4 / R8: the trends cover the last six months in weekly steps — no more, no less.
// Runs after a ticket with 40 weeks of history has been reported.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from '../lib/report.mjs';
import { panel } from '../lib/dom.mjs';

const LABELS = ['Human calls / ticket', 'Loops / ticket', 'Lead time (h)', 'Compute (h)'];

test('D4 with more than six months of history every trend shows 26 weekly buckets', async () => {
  const html = panel((await page('/?tab=analytics')).html, 'analytics');
  for (const label of LABELS) {
    const start = html.indexOf(`>${label}<`);
    const next = LABELS.map((l) => html.indexOf(`>${l}<`)).filter((i) => i > start).sort((a, b) => a - b)[0] ?? html.indexOf('Per ticket');
    const card = html.slice(start, next);
    const bars = [...card.matchAll(/title="(w\d+) · [^"]*"/g)];
    assert.equal(bars.length, 26, `${label}: six months in weekly steps`);
    assert.match(card, /w\d+ – w\d+ · 26 weeks of data/, `${label}: the period is named`);
  }
});

test('S5.2 over the full six-month window every trend still states the change and whether it is an improvement', async () => {
  const html = panel((await page('/?tab=analytics')).html, 'analytics');
  const silent = [];
  for (const label of LABELS) {
    const start = html.indexOf(`>${label}<`);
    const next = LABELS.map((l) => html.indexOf(`>${l}<`)).filter((i) => i > start).sort((a, b) => a - b)[0] ?? html.indexOf('Per ticket');
    const card = html.slice(start, next);
    const delta = card.match(/>([+-]?\d+% vs w\d+ · (?:better|worse|unchanged)|no comparison yet)</);
    assert.ok(delta, `${label} says nothing at all about the change`);
    const bars = [...card.matchAll(/title="(w\d+) · ([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
    if (delta[1] === 'no comparison yet') silent.push(`${label}: first=${bars[0]} last=${bars[bars.length - 1]}`);
  }
  assert.deepEqual(silent, [], 'these trends are drawn over 26 weeks with data in them, but state no change and no improvement');
});

test('R8 nothing is removed: the 40-week-old ticket is still there with its whole history', async () => {
  const p = await page('/ticket/011');
  assert.equal(p.status, 200);
  assert.match(p.text, /runs 4/);
  assert.ok(p.text.includes('Paper invoices are scanned in batches of 50.'));
});
