// D4 / R8: the trends cover the last six months in weekly steps — no more, no less.
// Runs after a ticket with 40 weeks of history has been reported.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from '../lib/report.mjs';
import { panel } from '../lib/dom.mjs';
import { TREND_LABELS as LABELS, trendCard, readTrend, complaintsAbout } from '../lib/trends.mjs';

test('D4 with more than six months of history every trend shows 26 weekly buckets', async () => {
  const html = panel((await page('/?tab=analytics')).html, 'analytics');
  for (const label of LABELS) {
    const card = trendCard(html, label);
    const bars = [...card.matchAll(/title="(w\d+) · [^"]*"/g)];
    assert.equal(bars.length, 26, `${label}: six months in weekly steps`);
    assert.match(card, /w\d+ – w\d+ · 26 weeks of data/, `${label}: the period is named`);
  }
});

test('S5.2 over the full six-month window every trend still states the change and whether it is an improvement', async () => {
  const html = panel((await page('/?tab=analytics')).html, 'analytics');
  const complaints = LABELS.flatMap((label) => complaintsAbout(readTrend(html, label)));
  assert.deepEqual(complaints, [], 'every trend drawn over the full six-month window states its change and whether it is an improvement');
});

test('R8 nothing is removed: the 40-week-old ticket is still there with its whole history', async () => {
  const p = await page('/ticket/011');
  assert.equal(p.status, 200);
  assert.match(p.text, /runs 4/);
  assert.ok(p.text.includes('Paper invoices are scanned in batches of 50.'));
});
