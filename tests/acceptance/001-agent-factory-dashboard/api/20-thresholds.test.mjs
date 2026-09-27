// S7.1, S7.2 (the operator's own thresholds) and S2 / R7 (agents online).
// Runs against its own stack, started with LOOP_THRESHOLD=2 and IDLE_HOURS=1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, run, runStart, runFinish, H } from '../lib/report.mjs';
import { panel, cardTexts, ticketNumbers } from '../lib/dom.mjs';
import { REPO_A, S } from '../seed/dataset.mjs';

const now = Date.now();
const t = (ticket, title, extra) => ({ project: REPO_A, ticket, title, ...extra });

test('seed: three tickets against a loop threshold of 2 and an idle threshold of 1 hour', async () => {
  // 100 — two loops, touched minutes ago
  for (const [i, agent] of ['groom', 'architect', 'architect', 'groom'].entries()) {
    await run(t('100', 'Two loops', { agent, startedAt: now - (40 - i * 8) * 60000, endedAt: now - (36 - i * 8) * 60000, statusBefore: S.groomed, statusAfter: S.designed, output: `STATUS: designed\nSUMMARY: Round ${i + 1}.`, tokens: 1000 }));
  }
  // 101 — untouched for two hours
  await run(t('101', 'Untouched', { agent: 'groom', startedAt: now - 3 * H, endedAt: now - 2 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: One story.', tokens: 900 }));
  // 102 — neither
  await run(t('102', 'Fine', { agent: 'architect', startedAt: now - 30 * 60000, endedAt: now - 10 * 60000, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Done.', tokens: 800 }));
  assert.ok(true);
});

test('S7.1 a ticket that reaches my loop threshold appears for that reason', async () => {
  const html = panel((await page('/')).html, 'attention');
  const card = cardTexts(html, 'af-h-attn').find((c) => c.includes('Two loops'));
  assert.ok(card, '100 is on the Attention tab');
  assert.match(card, /loop threshold/);
  assert.match(card, /2 re-runs on this ticket, over your threshold of 2/, 'the note names the threshold I set');
});

test('S7.2 a ticket untouched for longer than my idle threshold appears for that reason', async () => {
  const html = panel((await page('/')).html, 'attention');
  const card = cardTexts(html, 'af-h-attn').find((c) => c.includes('Untouched'));
  assert.ok(card, '101 is on the Attention tab');
  assert.match(card, /idle/);
  assert.match(card, /No agent has touched this for 2\.0h/);
});

test('S7 a ticket below both thresholds is left alone', async () => {
  const html = panel((await page('/')).html, 'attention');
  assert.ok(ticketNumbers(html, 'af-h-chip').includes('102'));
});

test('S2.1 / R7 the header says how many runs were in progress when the page loaded', async () => {
  assert.match((await page('/')).text, /no agents running/);
  const one = await runStart(t('103', 'Running now', { agent: 'implementer', startedAt: now - 0.2 * H, statusBefore: S.designed }));
  assert.match((await page('/')).text, /1 agent online/);
  const two = await runStart(t('104', 'Running too', { agent: 'validator', startedAt: now - 0.1 * H, statusBefore: S.implemented }));
  assert.match((await page('/')).text, /2 agents online/);
  await runFinish(t('103', 'Running now', { agent: 'implementer', endedAt: now, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Done.', tokens: 10 }), one);
  assert.match((await page('/')).text, /1 agent online/);
  await runFinish(t('104', 'Running too', { agent: 'validator', endedAt: now, statusAfter: S.validated, output: 'STATUS: validated\nSUMMARY: Done.', tokens: 10 }), two);
  assert.match((await page('/')).text, /no agents running/, 'S2.2');
});

