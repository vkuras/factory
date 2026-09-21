// S3 (the whole pipeline), S4 (one ticket's life), R2 (stage of a ticket), R4, R6.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from '../lib/report.mjs';
import { panel, ticketNumbers, cardTexts, between } from '../lib/dom.mjs';
import { EXPECTED_STAGES, EXPECTED_METRICS, TITLES, OUTPUT_001_VALIDATOR } from '../seed/dataset.mjs';

const pipeline = async () => panel((await page('/?tab=pipeline')).html, 'pipeline');

test('S3.1 four columns — Grooming, Design, Implementation, Verification — each with its count', async () => {
  const html = await pipeline();
  const columns = [...html.matchAll(/>(Grooming|Design|Implementation|Verification)<\/span>\s*<span[^>]*>(\d+)<\/span>/g)];
  assert.deepEqual(
    columns.map((m) => [m[1], Number(m[2])]),
    [['Grooming', 3], ['Design', 3], ['Implementation', 2], ['Verification', 2]],
  );
});

test('S3.3 / R2 every requirements status puts its ticket in the stage the rule names', async () => {
  const html = await pipeline();
  // one chunk per column, in the order of the four columns
  const chunks = html.split(/(?=<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:\.14em)/).slice(1);
  assert.equal(chunks.length, 4);
  const stages = ['Grooming', 'Design', 'Implementation', 'Verification'];
  for (const [i, stage] of stages.entries()) {
    assert.ok(chunks[i].includes(`>${stage}<`), `column ${i} is ${stage}`);
    assert.deepEqual(ticketNumbers(chunks[i], 'af-h-pcard').sort(), EXPECTED_STAGES[stage], `column ${stage}`);
  }
});

test('S3.2 a pipeline card shows id, title, status, loops, age, tokens and interventions', async () => {
  const html = await pipeline();
  const texts = cardTexts(html, 'af-h-pcard');
  const card = texts.find((t) => t.includes(TITLES['001']));
  assert.ok(card, 'the card of 001 is on the Pipeline tab');
  assert.ok(card.includes('001'));
  assert.ok(card.includes('Blocked – waiting for requirements'), 'the current status');
  assert.match(card, /↻ 2/, 'loops');
  assert.match(card, /◔ \d+(\.\d)?[hd]/, 'how long the ticket has been alive');
  assert.match(card, /⌁ \d+(\.\d+)?[kM]?/, 'tokens');
  assert.match(card, /☺ 1/, 'interventions');
});

test('S4.1 the detail view shows id, title, status, agent status and the six figures', async () => {
  const p = await page('/ticket/001');
  assert.equal(p.status, 200);
  assert.ok(p.text.includes('001'));
  assert.ok(p.text.includes(TITLES['001']));
  assert.ok(p.text.includes('Blocked – waiting for requirements'));
  assert.match(p.text, /agent status · needs-groomer/);
  const [loops, interventions, runs] = EXPECTED_METRICS['001'];
  const head = between(p.text, 'lead time', 'Route ·');
  assert.match(head, /lead time \d+(\.\d)?[hd]/);
  assert.match(head, /agent compute \d+(\.\d)?[hdm]/);
  assert.match(head, new RegExp(`loops ${loops}`));
  assert.match(head, new RegExp(`your calls ${interventions}`));
  assert.match(head, /tokens \d+(\.\d+)?[kM]?/);
  assert.match(head, new RegExp(`runs ${runs}`));
});

test('S4.1 the six figures are right for every seeded ticket', async () => {
  for (const [ticket, [loops, interventions, runs]] of Object.entries(EXPECTED_METRICS)) {
    const p = await page(`/ticket/${ticket}`);
    const head = between(p.text, 'lead time', 'Route ·');
    assert.match(head, new RegExp(`loops ${loops}\\b`), `${ticket}: loops`);
    assert.match(head, new RegExp(`your calls ${interventions}\\b`), `${ticket}: interventions`);
    assert.match(head, new RegExp(`runs ${runs}\\b`), `${ticket}: runs`);
  }
});

test('S4.2 a time axis with one lane per agent and one for me, and failures marked as such', async () => {
  const p = await page('/ticket/004');
  const route = p.html.slice(p.html.indexOf('Route ·'), p.html.indexOf('Agent output log'));
  const lanes = [...route.matchAll(/text-align:right">(Groom|Architect|Implementer|Validator|You)</g)].map((m) => m[1]);
  assert.deepEqual(lanes, ['Groom', 'Architect', 'Implementer', 'Validator', 'You']);
  const blocks = [...route.matchAll(/title="([^"]+)" style="position:absolute;[^"]*?left:([\d.]+)%;width:([\d.]+)%;[^"]*?background:(#[0-9A-Fa-f]+);border:1px solid (#[0-9A-Fa-f]+)/g)];
  assert.equal(blocks.length, 4, 'four runs, four blocks');
  for (const b of blocks) {
    assert.ok(Number(b[2]) >= 0 && Number(b[2]) <= 100, 'the block sits inside the axis');
    assert.ok(Number(b[3]) > 0, 'the block has a length');
  }
  const failed = blocks.find((b) => b[1].includes('failed'));
  assert.ok(failed, 'the failed run has a block');
  assert.equal(failed[5], '#FF6B6B', 'a failed run is marked as such, not drawn like the others');
  const ok = blocks.find((b) => b[1].includes('groomed'));
  assert.notEqual(ok[5], '#FF6B6B');
});

test('S4.3 every run is listed newest first with agent, result, start, duration, tokens and a one-line summary', async () => {
  const p = await page('/ticket/001');
  const log = p.html.slice(p.html.indexOf('Agent output log'), p.html.indexOf('Tokens per agent'));
  const entries = [...log.matchAll(/letter-spacing:\.06em">(Groom|Architect|Implementer|Validator|You)<\/span>\s*<span[^>]*>([a-z-]+)<\/span>/g)];
  assert.deepEqual(
    entries.map((m) => `${m[1]}:${m[2]}`),
    ['Validator:needs-groomer', 'You:intervention', 'Implementer:ready-for-validation', 'Validator:changes-requested', 'Implementer:ready-for-validation', 'Architect:designed', 'Groom:groomed'],
    'newest first, with agent and result',
  );
  const meta = [...log.matchAll(/t\+(\d+(?:\.\d)?[hdm]|0m) · (\d+(?:\.\d)?[hdm]) · ([^<]+)</g)];
  assert.ok(meta.length >= 7, 'each entry shows when it started, how long it took and its tokens');
  assert.ok(p.text.includes('Golden-set accuracy 82 % against a 95 % target.'), 'the one-line summary is the agent\'s own SUMMARY line');
  assert.match(log, /title="20\d\d-\d\d-\d\d \d\d:\d\d"/, 'the start time is available as an absolute time too');
});

test('S4.4 / R6 an expanded run shows the agent\'s own output as a numbered list and what the ticket moved to', async () => {
  const p = await page('/ticket/001');
  const expanded = between(p.text, 'run #2 · 5 steps');
  const lines = OUTPUT_001_VALIDATOR.split('\n');
  for (const [i, line] of lines.entries()) {
    const n = String(i + 1).padStart(2, '0');
    assert.ok(expanded.includes(`${n} ${line.trim()}`), `line ${n} is the agent's own line: ${line}`);
  }
  assert.ok(p.text.includes('Ticket moved to "Blocked – waiting for requirements"'), 'the status the run moved the ticket to');
  const noMove = await page('/ticket/006');
  assert.ok(noMove.text.includes('No status change'), 'a run that moved nothing says so');
});

test('R6 the numbered list carries no step kinds (D6)', async () => {
  const p = await page('/ticket/001');
  const log = p.html.slice(p.html.indexOf('Agent output log'), p.html.indexOf('Tokens per agent'));
  for (const kind of ['read', 'think', 'tool', 'write', 'check']) {
    const badge = new RegExp(`border-radius:4px;background:#[0-9A-Fa-f]{6}1A[^>]*>\\s*${kind}\\s*<`);
    assert.ok(!badge.test(log), `no "${kind}" step-kind badge`);
  }
  // every numbered row has exactly two cells: the number and the agent's line
  const rows = [...log.matchAll(/grid-template-columns:22px minmax\(0,1fr\)/g)];
  assert.ok(rows.length > 0, 'the numbered rows are two columns, not three');
});

test('S4.5 / R4 my interventions are listed separately with what I did and when', async () => {
  const p = await page('/ticket/001');
  const panelText = between(p.text, 'Your involvement', 'Status trail');
  assert.ok(panelText.includes('faxes are in scope, but 90 % accuracy is fine for them'), 'what I did, verbatim');
  assert.match(panelText, /t\+\d+(\.\d)?[hdm]/, 'when I did it');
  const none = await page('/ticket/008');
  assert.ok(between(none.text, 'Your involvement', 'Status trail').includes('No interventions yet.'));
});

test('R4 an intervention is a run in its own right: own lane, run list, count, no tokens', async () => {
  const p = await page('/ticket/001');
  const route = p.html.slice(p.html.indexOf('Route ·'), p.html.indexOf('Agent output log'));
  const youLane = route.slice(route.indexOf('text-align:right">You</div>'));
  assert.match(youLane, /title="You · intervention/, 'the intervention has a block in the You lane');
  const log = p.html.slice(p.html.indexOf('Agent output log'), p.html.indexOf('Tokens per agent'));
  assert.match(log, />You<\/span>\s*<span[^>]*>intervention<\/span>/, 'it is in the run list');
  assert.ok(p.text.includes('manual · 1 step · 0m · no tokens'), 'it consumes no tokens');
  assert.ok(!between(p.text, 'Tokens per agent', 'Your involvement').includes('You'), 'and does not appear as an agent that spends tokens');
});

test('S4.6 the sequence of statuses the ticket passed through', async () => {
  const p = await page('/ticket/001');
  const trail = between(p.text, 'Status trail');
  const order = ['Groomed – ready for architecture', 'Designed – ready for implementation', 'Implemented – ready for validation', 'Changes requested – back to implementation', 'Implemented – ready for validation', 'Blocked – waiting for requirements'];
  let at = 0;
  for (const status of order) {
    const i = trail.indexOf(status, at);
    assert.ok(i > -1, `the trail contains ${status} in order`);
    at = i + status.length;
  }
});

test('every ticket is reachable from every tab, and the detail view opens', async () => {
  const p = await page('/');
  const hrefs = [...p.html.matchAll(/href="(\/ticket\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(hrefs.length >= 20, 'tickets link to their detail view on all three tabs');
  for (const href of [...new Set(hrefs)]) {
    const d = await page(href.replace(/&amp;/g, '&'));
    assert.equal(d.status, 200, href);
  }
});
