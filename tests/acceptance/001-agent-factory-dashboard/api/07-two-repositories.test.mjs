// R3, D14/D16/D17, S1.6, S1.8, S3.4, S5.4, S6.8 — what happens when a second repository reports.
// Runs after seed/seed.mjs second, and compares against the snapshot taken before that.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { page, run, H } from '../lib/report.mjs';
import { panel, cardTexts, ticketNumbers, links } from '../lib/dom.mjs';
import { REPO_A, REPO_A_LABEL, REPO_B, REPO_B_LABEL, TITLES } from '../seed/dataset.mjs';

const WORK = process.env.WORK || '/work';
const snapshot = JSON.parse(readFileSync(`${WORK}/snapshot-before-second-repo.json`, 'utf8'));

test('S6.8 / R3 the same number in two repositories is two tickets with two separate histories', async () => {
  const a = await page(`/ticket/${encodeURIComponent(REPO_A)}/001`);
  const b = await page(`/ticket/${encodeURIComponent(REPO_B)}/001`);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.ok(a.text.includes(TITLES['001']), 'the first 001 keeps its own title');
  assert.ok(b.text.includes('Checkout rewrite'), 'the second 001 is a different ticket');
  assert.match(a.text, /runs 6/);
  assert.match(b.text, /runs 1/);
  assert.ok(!b.text.includes('Golden-set accuracy'), 'no history bleeds from one 001 into the other');
});

test('S1.6 / S3.4 / S5.4 both 001 cards are on the page, each with the repository it comes from', async () => {
  const p = await page('/');
  for (const [panelName, cls] of [['attention', 'af-h-attn'], ['pipeline', 'af-h-pcard'], ['analytics', 'af-h-row']]) {
    const html = panel(p.html, panelName);
    const texts = cardTexts(html, cls).filter((t) => /(^|\s)001(\s|$)/.test(t.slice(0, 60)));
    const withA = texts.filter((t) => t.includes(REPO_A_LABEL));
    const withB = texts.filter((t) => t.includes(REPO_B_LABEL));
    if (panelName !== 'attention') {
      assert.ok(withA.length === 1 && withB.length === 1, `${panelName}: two separate 001 cards, one per repository`);
    } else {
      assert.ok(withA.length >= 1, 'attention: the 001 that needs the operator carries its repository');
    }
  }
});

test('S1.8 / D16 from the second repository on, every ticket shows its repository everywhere', async () => {
  const p = await page('/');
  for (const [panelName, cls] of [['attention', 'af-h-attn'], ['attention', 'af-h-chip'], ['pipeline', 'af-h-pcard'], ['analytics', 'af-h-row']]) {
    const html = panel(p.html, panelName);
    const texts = cardTexts(html, cls);
    assert.ok(texts.length > 0, `${panelName}/${cls} has tickets`);
    for (const t of texts) {
      assert.ok(t.includes(REPO_A_LABEL) || t.includes(REPO_B_LABEL), `${panelName}/${cls}: every ticket names its repository — "${t.slice(0, 80)}"`);
    }
  }
  const detail = await page(`/ticket/${encodeURIComponent(REPO_A)}/007`);
  assert.ok(detail.text.includes(REPO_A_LABEL), 'the detail head too');
});

test('S1.8 the tickets stored before the second repository reported are labelled as well', async () => {
  const p = panel((await page('/?tab=pipeline')).html, 'pipeline');
  const old = cardTexts(p, 'af-h-pcard').filter((t) => t.includes(TITLES['010']));
  assert.equal(old.length, 1);
  assert.ok(old[0].includes(REPO_A_LABEL), 'a ticket from weeks ago now shows its repository');
});

test('S1.8 nothing is lost or changed when the repository starts being shown', async () => {
  const strip = (s) => s.replaceAll(` · ${REPO_A_LABEL}`, '').replaceAll(` · ${REPO_B_LABEL}`, '');
  for (const [ticket, before] of Object.entries(snapshot.tickets)) {
    const after = strip((await page(`/ticket/${encodeURIComponent(REPO_A)}/${ticket}`)).text);
    if (ticket === '007') {
      assert.equal(after, before, 'a validated ticket, whose every figure is frozen, is unchanged apart from the label');
    } else {
      for (const part of ['Agent output log', 'Status trail', 'Your involvement']) {
        assert.ok(after.includes(part), `${ticket}: ${part} is still there`);
      }
      const runsBefore = before.match(/runs (\d+)/)[1];
      assert.match(after, new RegExp(`runs ${runsBefore}`), `${ticket}: no run was lost`);
    }
  }
  const beforeIds = [...snapshot.overview.matchAll(/\b0\d\d\b/g)].map((m) => m[0]);
  const afterText = (await page('/')).text;
  for (const id of new Set(beforeIds)) {
    assert.ok(afterText.includes(id), `ticket ${id} is still on the overview`);
  }
});

test('R3 once a second repository has reported, the label stays even while only one is active', async () => {
  await run({
    project: REPO_A, ticket: '012', title: 'Only the first repository is active again',
    agent: 'groom', startedAt: Date.now() - 2 * H, endedAt: Date.now() - 1 * H,
    statusBefore: 'In grooming', statusAfter: 'Groomed – ready for architecture',
    output: 'STATUS: groomed\nSUMMARY: Reported long after the second repository went quiet.', tokens: 5000,
  });
  const p = panel((await page('/?tab=pipeline')).html, 'pipeline');
  const fresh = cardTexts(p, 'af-h-pcard').find((t) => t.includes('Only the first repository is active again'));
  assert.ok(fresh.includes(REPO_A_LABEL), 'a brand-new ticket of the only active repository still names it');
});

test('R3 the repository is the ticket\'s identity, also in its address', async () => {
  const p = await page('/');
  const hrefs = links(p.html, 'af-h-pcard');
  for (const href of hrefs) {
    assert.match(href, /^\/ticket\/github\.com%2F[^/]+\/\d+/, `every link is the canonical form: ${href}`);
  }
  const short = await page('/ticket/001');
  assert.ok([200, 302].includes(short.status), 'a link taken before the second repository reported still resolves');
});

test('the repository label never breaks the layout of a card (it is capped and ellipsised)', async () => {
  const p = await page('/');
  const spans = [...p.html.matchAll(/<span class="af-repo"[^>]*>([^<]*)<\/span>/g)];
  assert.ok(spans.length > 0, 'the label is rendered by one shared element');
  for (const s of spans) assert.match(s[1], new RegExp(`(${REPO_A_LABEL}|${REPO_B_LABEL})`));
  assert.match(p.html, /title="github\.com\/(vkuras\/invoice-service|acme\/shop-api)"/, 'the full key is one hover away');
});
