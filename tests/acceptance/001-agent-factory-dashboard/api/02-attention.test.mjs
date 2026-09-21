// S1 (what needs me), R1 (attention rules), R11, S7.3 (the default thresholds), S1.7 (no
// repository while only one has reported). Runs against the seeded single-repository dataset.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from '../lib/report.mjs';
import { panel, ticketNumbers, cardTexts, cards } from '../lib/dom.mjs';
import { EXPECTED_ATTENTION, EXPECTED_CALM, TITLES, REPO_A, REPO_A_LABEL } from '../seed/dataset.mjs';

const overview = async () => page('/');

test('S1.1 / R11 the dashboard opens on the Attention tab', async () => {
  const p = await overview();
  const bar = p.html.slice(p.html.indexOf('role="tablist"'), p.html.indexOf('<section'));
  const selected = [...bar.matchAll(/data-tab="(\w+)" aria-selected="(\w+)"/g)].filter((m) => m[2] === 'true');
  assert.deepEqual(selected.map((m) => m[1]), ['attention']);
  assert.deepEqual([...bar.matchAll(/data-tab="(\w+)"/g)].map((m) => m[1]), ['attention', 'pipeline', 'analytics']);
});

test('S1.2 every attention card carries id, title, reason, its one-sentence explanation and the severity', async () => {
  const p = panel((await overview()).html, 'attention');
  const texts = cardTexts(p, 'af-h-attn');
  assert.equal(texts.length, EXPECTED_ATTENTION.length);
  for (const [i, exp] of EXPECTED_ATTENTION.entries()) {
    const t = texts[i];
    assert.ok(t.includes(exp.ticket), `card ${i} shows the id ${exp.ticket}`);
    assert.ok(t.includes(TITLES[exp.ticket]), `card ${i} shows the title`);
    assert.ok(t.includes(exp.reason), `card ${i} shows the reason "${exp.reason}"`);
    assert.ok(t.includes(exp.severity), `card ${i} shows the severity "${exp.severity}"`);
    const note = t.slice(t.indexOf(TITLES[exp.ticket]) + TITLES[exp.ticket].length, t.indexOf('status ·')).replace(exp.reason, '').trim();
    assert.ok(note.length > 20 && /\.$/.test(note), `card ${i} explains the reason in a sentence: "${note}"`);
  }
});

test('S1.3 / R1 the list is ordered by severity, and inside a severity the longest untouched first', async () => {
  const p = panel((await overview()).html, 'attention');
  assert.deepEqual(ticketNumbers(p, 'af-h-attn'), EXPECTED_ATTENTION.map((e) => e.ticket));
});

test('S1.4 every attention card also shows status, owner, idle, loops and interventions', async () => {
  const p = panel((await overview()).html, 'attention');
  const texts = cardTexts(p, 'af-h-attn');
  const byTicket = Object.fromEntries(EXPECTED_ATTENTION.map((e, i) => [e.ticket, texts[i]]));
  assert.match(byTicket['001'], /status · Blocked – waiting for requirements/);
  assert.match(byTicket['001'], /owner · Groom/);
  assert.match(byTicket['001'], /idle · 19h/);
  assert.match(byTicket['001'], /loops · 2/);
  assert.match(byTicket['001'], /you · 1x/);
  assert.match(byTicket['003'], /owner · Architect/);
  assert.match(byTicket['003'], /idle · 2\.\dd/);
  assert.match(byTicket['004'], /status · Implemented – ready for validation/);
  assert.match(byTicket['004'], /owner · Implementer/);
  for (const t of Object.values(byTicket)) {
    assert.match(t, /status · .+owner · .+idle · .+loops · \d+.+you · \d+x/);
  }
});

test('R1 rules 1 to 7: every rule raises its own reason and severity, and the first match decides', async () => {
  const p = panel((await overview()).html, 'attention');
  const texts = Object.fromEntries(EXPECTED_ATTENTION.map((e, i) => [e.ticket, cardTexts(p, 'af-h-attn')[i]]));
  // rule 1 wins although 001 also has loops and idle beyond the thresholds
  assert.match(texts['001'], /needs requirements blocking|needs requirements/);
  assert.ok(!texts['001'].includes('loop threshold'));
  // rule 2 wins although 003 is idle 50 h
  assert.ok(!texts['003'].includes('idle') || texts['003'].includes('design gap'));
  assert.match(texts['003'], /design gap/);
  // rule 3: a failed run on a ticket that is not validated
  assert.match(texts['004'], /agent run failed/);
  // rule 6 beats rule 7: 005 is idle 30 h but grooming holds questions
  assert.match(texts['005'], /open questions/);
  assert.match(texts['005'], /answer/);
});

test('R1 rules 3 and 7 do not fire on a validated ticket', async () => {
  const p = panel((await overview()).html, 'attention');
  const attention = ticketNumbers(p, 'af-h-attn');
  assert.ok(!attention.includes('007'), '007 is validated although a run of it failed and it is idle 400 h');
  assert.ok(!attention.includes('010'), '010 is validated');
});

test('S7.3 the defaults are three loops and 24 hours', async () => {
  const p = panel((await overview()).html, 'attention');
  const texts = Object.fromEntries(EXPECTED_ATTENTION.map((e, i) => [e.ticket, cardTexts(p, 'af-h-attn')[i]]));
  assert.match(texts['006'], /3 re-runs on this ticket, over your threshold of 3/);
  assert.match(texts['008'], /No agent has touched this for 1\.0d/, '008 was touched 25 hours ago, one hour over the default threshold');
  assert.match(texts['008'], /idle · 1\.0d/);
  const calm = ticketNumbers(p, 'af-h-chip');
  assert.ok(calm.includes('009'), '009 is idle 2 h and has no loops, so 24 h and 3 loops leave it alone');
});

test('S1.5 tickets that meet no rule are listed separately and compactly, with their count', async () => {
  const p = panel((await overview()).html, 'attention');
  assert.match(p, /Running on their own · 3/);
  const chips = ticketNumbers(p, 'af-h-chip');
  assert.deepEqual(chips.sort(), [...EXPECTED_CALM].sort());
  for (const chip of cardTexts(p, 'af-h-chip')) {
    assert.ok(chip.length < 120, 'a chip is compact: ' + chip);
  }
});

test('S1.7 while only one repository has ever reported, no repository is shown anywhere', async () => {
  for (const path of ['/', '/?tab=pipeline', '/?tab=analytics', '/ticket/001', '/ticket/007']) {
    const p = await page(path);
    for (const needle of [REPO_A, REPO_A_LABEL, 'vkuras', 'github.com']) {
      assert.ok(!p.html.includes(needle), `${path} must not carry "${needle}" — not as text, not as an attribute, not in a URL`);
    }
  }
});

test('the tab badges count what the tabs show', async () => {
  const p = await overview();
  const badges = [...p.html.matchAll(/<span>(Attention|Pipeline|Analytics)<\/span>\s*<span class="af-badge"[^>]*>(\d+)<\/span>/g)];
  assert.deepEqual(badges.map((m) => [m[1], m[2]]), [['Attention', '7'], ['Pipeline', '10'], ['Analytics', '10']]);
});
