// S1.9 — tickets exist, but none of them needs the operator. First test on its own stack.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, run, H } from '../lib/report.mjs';
import { panel, cardTexts } from '../lib/dom.mjs';
import { REPO_A, S } from '../seed/dataset.mjs';

const now = Date.now();

test('S1.9 the Attention tab says nothing needs me instead of showing an empty list', async () => {
  await run({ project: REPO_A, ticket: '099', title: 'Finished long ago', agent: 'validator', startedAt: now - 2 * H, endedAt: now - 1.5 * H, statusBefore: S.implemented, statusAfter: S.validated, output: 'STATUS: validated\nSUMMARY: Every criterion met.', tokens: 5000 });
  const p = await page('/');
  const html = panel(p.html, 'attention');
  assert.equal(cardTexts(html, 'af-h-attn').length, 0, 'no ticket matches an attention rule');
  assert.match(p.text, /Nothing needs you\./);
  assert.match(p.text, /Running on their own · 1/, 'the calm tickets are still listed');
  assert.ok(!p.text.includes('Nothing here yet.'), 'this is not the empty installation');
});
