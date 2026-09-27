// R8 — nothing is ever removed. Runs after the stack has been restarted and recreated
// (docker compose restart, then down and up without -v).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { page, health } from '../lib/report.mjs';
import { REPO_A } from '../seed/dataset.mjs';

const WORK = process.env.WORK || '/work';

test('R8 the whole history survives a restart and a recreated container', async () => {
  const before = JSON.parse(readFileSync(`${WORK}/health-before-restart.json`, 'utf8'));
  const after = await health();
  assert.equal(after.tickets, before.tickets, 'no ticket is lost');
  const p = await page(`/ticket/${encodeURIComponent(REPO_A)}/001`);
  assert.equal(p.status, 200);
  assert.match(p.text, /runs 6/);
  assert.ok(p.text.includes('Golden-set accuracy 82 % against a 95 % target.'), 'the agent output survives too');
});
