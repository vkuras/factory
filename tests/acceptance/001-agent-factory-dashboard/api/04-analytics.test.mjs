// S5 (is the factory getting better), R8 (history and trends), D4 (weeks over six months).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from '../lib/report.mjs';
import { panel, ticketNumbers, between } from '../lib/dom.mjs';
import { EXPECTED_TABLE_ORDER } from '../seed/dataset.mjs';

const LABELS = ['Human calls / ticket', 'Loops / ticket', 'Lead time (h)', 'Compute (h)'];

async function analytics() {
  return panel((await page('/?tab=analytics')).html, 'analytics');
}

/** tags become separators, so "<span>Groom</span> <span>143k · 18h</span>" reads as one line. */
const flat = (html) => html.replace(/<[^>]+>/g, '|').replace(/\s+/g, ' ').replace(/\|[\s|]*/g, '|');

function trendCard(html, label) {
  const start = html.indexOf(`>${label}<`);
  assert.ok(start > -1, `the trend "${label}" is on the page`);
  const next = LABELS.map((l) => html.indexOf(`>${l}<`)).filter((i) => i > start).sort((a, b) => a - b)[0];
  return html.slice(start, next ?? html.indexOf('Per ticket'));
}

test('S5.1 four trends in weekly steps: interventions, loops, lead time and agent working time', async () => {
  const html = await analytics();
  for (const label of LABELS) {
    const card = trendCard(html, label);
    const bars = [...card.matchAll(/title="(w\d+) · ([^"]*)"/g)];
    assert.ok(bars.length >= 2, `${label} is drawn in weekly steps (${bars.length} weeks)`);
    assert.ok(bars.every((b) => /^w\d+$/.test(b[1])), `${label} buckets are weeks`);
  }
});

test('S5.3 with less than six months of history a trend covers only the period that has data and names it', async () => {
  const html = await analytics();
  for (const label of LABELS) {
    const card = trendCard(html, label);
    const period = card.match(/w(\d+) – w(\d+) · (\d+) weeks? of data/);
    assert.ok(period, `${label} names the period it covers`);
    assert.equal(period[3], '7', `${label}: the seeded history is seven weeks`);
    const bars = [...card.matchAll(/title="w\d+ · [^"]*"/g)];
    assert.equal(bars.length, 7, `${label}: only the weeks that have data are drawn`);
  }
});

test('S5.2 each trend states the change between the first and the last week, and whether it is an improvement', async () => {
  const html = await analytics();
  const silent = [];
  for (const label of LABELS) {
    const card = trendCard(html, label);
    const delta = card.match(/>([+-]?\d+% vs w\d+ · (?:better|worse|unchanged)|no comparison yet)</);
    assert.ok(delta, `${label} says nothing at all about the change`);
    const bars = [...card.matchAll(/title="(w\d+) · ([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
    if (delta[1] === 'no comparison yet') silent.push(`${label}: ${bars.join(' ')}`);
  }
  assert.deepEqual(silent, [], 'a trend that is drawn over seven weeks must state the change and whether it is an improvement');
});

test('S5.4 one row per ticket over its lifetime, the tickets that cost me most first', async () => {
  const html = await analytics();
  const header = between(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), 'Per ticket · lifetime', '001');
  for (const column of ['ticket', 'title', 'your calls', 'loops', 'lead time', 'compute', 'tokens']) {
    assert.ok(header.includes(column), `the table has the column "${column}"`);
  }
  assert.deepEqual(ticketNumbers(html, 'af-h-row'), EXPECTED_TABLE_ORDER);
});

test('S5.5 how many tokens and how much time each of the four agents has consumed', async () => {
  const html = await analytics();
  const spend = between(flat(html), 'Token spend per agent', 'Where tickets bounce back');
  for (const agent of ['Groom', 'Architect', 'Implementer', 'Validator']) {
    const row = spend.match(new RegExp(`${agent}\\|([\\d.]+[kM]?) · ([\\d.]+[hdm])`));
    assert.ok(row, `${agent} has a token and a time total: ${spend}`);
  }
});

test('S5.6 how often tickets were handed back at each junction, and how often a run failed', async () => {
  const html = await analytics();
  const bounce = between(flat(html), 'Where tickets bounce back');
  const counts = Object.fromEntries([...bounce.matchAll(/([a-z]+ → [a-z]+|agent run failed)\|(\d+)x/g)].map((m) => [m[1], Number(m[2])]));
  assert.deepEqual(counts, {
    'validator → implementer': 4,
    'validator → architect': 0,
    'validator → groom': 1,
    'implementer → architect': 1,
    'agent run failed': 2,
  });
});
