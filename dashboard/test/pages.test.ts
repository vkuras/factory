import * as cheerio from 'cheerio';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DAY, H, REPO_A, REPO_B, T0, intervene, makeApp, output, reportRun, startRun, finishRun, type TestApp } from './helpers.js';
import { S, seedCalm, seedFactory, seedRunning } from './seed.js';

let t: TestApp;
beforeEach(() => {
  t = makeApp();
});
afterEach(() => t.close());

async function page(path: string, expectStatus = 200): Promise<cheerio.CheerioAPI> {
  const res = await request(t.app).get(path);
  expect(res.status, path).toBe(expectStatus);
  return cheerio.load(res.text);
}
const text = ($: cheerio.CheerioAPI, sel: string): string => $(sel).text().replace(/\s+/g, ' ').trim();
const ids = ($: cheerio.CheerioAPI, sel: string): string[] => $(sel).map((_, el) => $(el).find('.af-id').first().text()).get();

// ---------------------------------------------------------------------------- header, tabs, R11
describe('the overview page (S1, S2, R11)', () => {
  beforeEach(() => seedFactory(t));

  it('T-INT-A1: opens on the Attention tab, and falls back to it for anything unknown', async () => {
    for (const path of ['/', '/?tab=nonsense', '/?tab=']) {
      const $ = await page(path);
      expect($('section[data-panel=attention]').attr('hidden'), path).toBeUndefined();
      expect($('section[data-panel=pipeline]').attr('hidden'), path).toBeDefined();
      expect($('button[data-tab=attention]').attr('aria-selected')).toBe('true');
    }
    const pipeline = await page('/?tab=pipeline');
    expect(pipeline('section[data-panel=pipeline]').attr('hidden')).toBeUndefined();
    expect(pipeline('section[data-panel=attention]').attr('hidden')).toBeDefined();
  });

  it('renders all three tabs in one response, with a count badge each', async () => {
    const $ = await page('/');
    expect($('section[data-panel]')).toHaveLength(3);
    const badges = $('button[data-tab]').map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get();
    expect(badges).toEqual(['Attention 7', 'Pipeline 10', 'Analytics 10']);
  });

  it('T-INT-A7 / S2.2: says that no agents are running, with the static grey dot', async () => {
    const $ = await page('/');
    expect($('body').text()).toContain('no agents running');
    const dot = $('span[style*="width:7px"]').first().attr('style')!;
    expect(dot).toContain('background:#39414D');
    expect(dot).not.toContain('animation');
  });

  it('T-INT-A7 / S2.1: counts the runs in progress, one agent online, then several', async () => {
    await seedRunning(t, 1);
    let $ = await page('/');
    expect($('body').text()).toContain('1 agent online');
    expect($('span[style*="width:7px"]').first().attr('style')).toContain('animation:af-pulse 2s infinite');
    expect($('span[style*="width:7px"]').first().attr('style')).toContain('background:#9EE84B');
    await seedRunning(t, 3);
    $ = await page('/');
    expect($('body').text()).toContain('3 agents online');
  });

  it('a run older than RUN_STALE_HOURS is no longer online, even before the sweeper ran', async () => {
    await startRun(t, { ticket: '200', agent: 'groom', ts: T0 - 13 * H, session_id: 'old' });
    await startRun(t, { ticket: '201', agent: 'groom', ts: T0 - 11 * H, session_id: 'fresh' });
    const $ = await page('/');
    expect($('body').text()).toContain('1 agent online');
  });

  it('shows no "synced" text, no refresh and no timer (R12, D5), and never caches the page', async () => {
    const res = await request(t.app).get('/');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.text.toLowerCase()).not.toContain('synced');
    expect(res.text).not.toMatch(/http-equiv=["']refresh/i);
    expect(res.text).not.toMatch(/setInterval|setTimeout|WebSocket|EventSource/);
  });

  it('preloads the font weight only a hidden tab needs, so a tab switch causes no request (QE2)', async () => {
    const $ = await page('/');
    expect($('link[rel=preload][as=font]').map((_, el) => $(el).attr('href')).get()).toEqual(['/assets/fonts/ibm-plex-sans-latin-500-normal.woff2']);
    expect($('link[rel=icon]').attr('href')).toBe('data:,'); // the browser does not ask for /favicon.ico
  });

  it('sends the product CSP and nosniff', async () => {
    const res = await request(t.app).get('/');
    expect(res.headers['content-security-policy']).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'",
    );
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

// ---------------------------------------------------------------------------- Attention tab
describe('the Attention tab (T-INT-A2…A6)', () => {
  it('T-INT-A3: orders by severity, then the longest untouched, then the number (S1.3)', async () => {
    await seedFactory(t);
    const $ = await page('/');
    // blocking: 001 (40 h idle) before 002 (10 h); check: 003; review: 007 (30 h), 005 (7 h), 004 (6 h); answer: 006
    expect(ids($, 'section[data-panel=attention] a.af-h-attn')).toEqual(['001', '002', '003', '007', '005', '004', '006']);
  });

  it('T-INT-A2: a card has id, title, reason, the one-sentence explanation, severity and the meta row (S1.2, S1.4)', async () => {
    await seedFactory(t);
    const $ = await page('/');
    const card = $('section[data-panel=attention] a.af-h-attn').first();
    expect(card.find('.af-id').text()).toBe('001');
    expect(card.text().replace(/\s+/g, ' ')).toContain('Needs requirements ticket');
    expect(card.text()).toContain('needs requirements');
    expect(card.text()).toContain('Grooming needs a decision from you before anything moves.');
    expect(card.text()).toContain('blocking');
    expect(card.text()).toContain('open ticket →');
    const meta = card.find('div[style*="font-size:11px"]').text().replace(/\s+/g, ' ').trim();
    expect(meta).toContain('status · Blocked – waiting for requirements');
    expect(meta).toContain('owner · Groom');
    expect(meta).toContain('idle · 1.7d');
    expect(meta).toContain('loops · 0');
    expect(meta).toContain('you · 1x');
    expect(card.attr('style')).toContain('border-left:3px solid #FF6B6B');
    expect(card.attr('href')).toBe('/ticket/001?from=attention');
  });

  it('T-INT-A2: the loop card names the count and the threshold', async () => {
    await seedFactory(t);
    const $ = await page('/');
    const card = $('section[data-panel=attention] a.af-h-attn').filter((_, el) => $(el).find('.af-id').text() === '005');
    expect(card.text()).toContain('loop threshold');
    expect(card.text()).toContain('3 re-runs on this ticket, over your threshold of 3.');
    expect(card.attr('style')).toContain('border-left:3px solid #F5A524');
  });

  it('S7.1: a changed LOOP_THRESHOLD is visible in the note', async () => {
    const custom = makeApp({ LOOP_THRESHOLD: '2' });
    try {
      await seedFactory(custom);
      const $ = cheerio.load((await request(custom.app).get('/')).text);
      expect($('body').text()).toContain('3 re-runs on this ticket, over your threshold of 2.');
    } finally {
      custom.close();
    }
  });

  it('S7.2 / S7.3: IDLE_HOURS moves the idle rule', async () => {
    const custom = makeApp({ IDLE_HOURS: '5' });
    try {
      await seedFactory(custom);
      const $ = cheerio.load((await request(custom.app).get('/')).text);
      const idle = $('section[data-panel=attention] a.af-h-attn').filter((_, el) => $(el).text().includes('idle'));
      expect(idle.length).toBeGreaterThan(1);
    } finally {
      custom.close();
    }
  });

  it('T-INT-A4: the rest is listed compactly as "Running on their own" with a count (S1.5)', async () => {
    await seedFactory(t);
    const $ = await page('/');
    expect($('section[data-panel=attention]').text()).toContain('Running on their own · 3');
    expect(ids($, 'section[data-panel=attention] a.af-h-chip')).toEqual(['008', '009', '010']);
    const chip = $('a.af-h-chip').first();
    expect(chip.text().replace(/\s+/g, ' ')).toContain('Calm groomed ticket');
    expect(chip.attr('href')).toBe('/ticket/008?from=attention');
  });

  it('T-INT-A5: with nothing to do it says so instead of an empty list, and keeps the calm list (S1.9)', async () => {
    await seedCalm(t);
    const $ = await page('/');
    expect($('section[data-panel=attention] a.af-h-attn')).toHaveLength(0);
    expect(text($, 'section[data-panel=attention]')).toContain('Nothing needs you.');
    expect(text($, 'section[data-panel=attention]')).toContain('All 2 tickets are running on their own.');
    expect(text($, 'section[data-panel=attention]')).toContain('Running on their own · 2');
    expect($('a.af-h-chip')).toHaveLength(2);
  });

  it('T-INT-A6: with no ticket at all it says there is nothing yet, without tabs (S1.10)', async () => {
    const $ = await page('/');
    expect($('body').text()).toContain('Nothing here yet.');
    expect($('body').text()).toContain('The dashboard fills up as soon as the factory reports its first agent run.');
    expect($('button[data-tab]')).toHaveLength(0);
    expect($('section[data-panel]')).toHaveLength(0);
    expect($('body').text()).toContain('no agents running');
    expect($('body').text()).not.toContain('Running on their own');
  });

  it('a running agent is shown in the header even when there is no ticket-list content to show', async () => {
    await startRun(t, { ticket: '001', agent: 'groom', ts: T0 - 1000 });
    const $ = await page('/');
    expect($('body').text()).toContain('1 agent online');
  });
});

// ---------------------------------------------------------------------------- Pipeline tab
describe('the Pipeline tab (T-INT-P1…P3)', () => {
  beforeEach(() => seedFactory(t));

  const columns = ($: cheerio.CheerioAPI) => $('section[data-panel=pipeline] > div > div');

  it('T-INT-P1: four columns in order with their count and hint (S3.1)', async () => {
    const $ = await page('/?tab=pipeline');
    const cols = columns($);
    expect(cols).toHaveLength(4);
    const heads = cols.map((_, el) => $(el).children().first().text().replace(/\s+/g, ' ').trim()).get();
    expect(heads).toEqual([
      'Grooming 4 requirements & open questions',
      'Design 3 architecture decisions',
      'Implementation 2 code & fix rounds',
      'Verification 1 validated or in review',
    ]);
  });

  it('T-INT-P3: places tickets by the R2 mapping (S3.3)', async () => {
    const $ = await page('/?tab=pipeline');
    const ofColumn = (i: number): string[] => columns($).eq(i).find('a.af-h-pcard .af-id').map((_, el) => $(el).text()).get().sort();
    // 001 blocked-requirements, 006 in grooming, 007 + 008 groomed
    expect(ofColumn(0)).toEqual(['001', '006', '007', '008']);
    // 002 blocked-architecture, 005 + 009 designed
    expect(ofColumn(1)).toEqual(['002', '005', '009']);
    // 003 implemented, 004 changes requested
    expect(ofColumn(2)).toEqual(['003', '004']);
    expect(ofColumn(3)).toEqual(['010']);
  });

  it('T-INT-P2: a card has id, status dot, title, status, loops, lead time, tokens and calls (S3.2)', async () => {
    const $ = await page('/?tab=pipeline');
    const card = $('a.af-h-pcard').filter((_, el) => $(el).find('.af-id').text() === '001');
    expect(card.text().replace(/\s+/g, ' ')).toContain('Needs requirements ticket');
    expect(card.text()).toContain('Blocked – waiting for requirements');
    expect(card.find('span[style*="width:7px"]').attr('style')).toContain('background:#FF6B6B');
    const row = card.find('div[style*="font-size:10px"]').text().replace(/\s+/g, ' ').trim();
    expect(row).toBe('↻ 0 ◔ 1.9d ⌁ 3.0k ☺ 1');
    expect(card.find('span:contains("☺")').attr('style')).toContain('color:#FF7AB6');
    const quiet = $('a.af-h-pcard').filter((_, el) => $(el).find('.af-id').text() === '002');
    expect(quiet.find('span:contains("☺")').attr('style')).toContain('color:#5D6673');
  });

  it('orders the cards of a column by last activity, newest first', async () => {
    const $ = await page('/?tab=pipeline');
    // grooming: 008 (1 h) < 006 (3 h) < 007 (30 h) < 001 (40 h)
    expect(columns($).eq(0).find('a.af-h-pcard .af-id').map((_, el) => $(el).text()).get()).toEqual(['008', '006', '007', '001']);
  });

  it('a column without tickets shows its header and a zero', async () => {
    const lonely = makeApp();
    try {
      await reportRun(lonely, { ticket: '001', agent: 'groom', startedAt: T0 - 2 * H, endedAt: T0 - H, statusBefore: S.GROOMING, statusAfter: S.GROOMED });
      const $ = cheerio.load((await request(lonely.app).get('/?tab=pipeline')).text);
      const cols = $('section[data-panel=pipeline] > div > div');
      expect(cols.eq(3).text().replace(/\s+/g, ' ').trim()).toBe('Verification 0 validated or in review');
      expect(cols.eq(3).find('a')).toHaveLength(0);
    } finally {
      lonely.close();
    }
  });

  it('S3.3: an unknown status lands in the stage of the newest run, in grey, verbatim', async () => {
    await reportRun(t, { ticket: '050', title: 'Odd', agent: 'architect', startedAt: T0 - H, endedAt: T0 - 30 * 60_000, statusBefore: 'Waiting for the moon', statusAfter: 'Waiting for the moon' });
    const $ = await page('/?tab=pipeline');
    const card = $('a.af-h-pcard').filter((_, el) => $(el).find('.af-id').text() === '050');
    expect(card.text()).toContain('Waiting for the moon');
    expect(card.find('span[style*="width:7px"]').attr('style')).toContain('background:#6E7887');
    const designColumn = $('section[data-panel=pipeline] > div > div').eq(1);
    expect(designColumn.find('.af-id').map((_, el) => $(el).text()).get()).toContain('050');
  });
});

// ---------------------------------------------------------------------------- Detail page
describe('the ticket detail page (T-INT-D1…D6)', () => {
  beforeEach(() => seedFactory(t));

  it('T-INT-D1: shows id, title, status, agent status and the six metric tiles (S4.1)', async () => {
    const $ = await page('/ticket/001?from=pipeline');
    expect(text($, '.af-id')).toContain('001');
    expect($('body').text()).toContain('Needs requirements ticket');
    expect($('body').text()).toContain('Blocked – waiting for requirements');
    expect(text($, 'body')).toContain('agent status · needs-groomer');
    const tiles = $('div[style*="grid-template-columns:repeat(3"]').children().map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get();
    expect(tiles).toEqual(['lead time 1.9d', 'agent compute 2.0h', 'loops 0', 'your calls 1', 'tokens 3.0k', 'runs 2']);
  });

  it('colours the loops tile at the threshold and your-calls when there are calls', async () => {
    const $ = await page('/ticket/005');
    const tile = (label: string) => $('div[style*="grid-template-columns:repeat(3"] > div').filter((_, el) => $(el).text().includes(label));
    expect(tile('loops').find('div').last().attr('style')).toContain('color:#F5A524');
    expect(tile('your calls').find('div').last().attr('style')).toContain('color:#E6E9EE');
    const withCalls = await page('/ticket/001');
    expect(withCalls('div[style*="grid-template-columns:repeat(3"] > div').filter((_, el) => withCalls(el).text().includes('your calls')).find('div').last().attr('style')).toContain('color:#FF7AB6');
  });

  it('T-INT-A: "back to" follows ?from and defaults to attention', async () => {
    expect((await page('/ticket/001?from=analytics'))('a.af-h-back').attr('href')).toBe('/?tab=analytics');
    expect((await page('/ticket/001?from=analytics'))('a.af-h-back').text()).toContain('back to analytics');
    expect((await page('/ticket/001'))('a.af-h-back').attr('href')).toBe('/?tab=attention');
    expect((await page('/ticket/001?from=bogus'))('a.af-h-back').attr('href')).toBe('/?tab=attention');
  });

  it('T-INT-D2: five lanes; blocks are placed and sized from the run times; failures are marked (S4.2)', async () => {
    const $ = await page('/ticket/003');
    const lanes = $('div[style*="grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:center"]');
    expect(lanes.map((_, el) => $(el).children().first().text()).get()).toEqual(['Groom', 'Architect', 'Implementer', 'Validator', 'You']);
    const blocks = lanes.eq(2).find('div[title]');
    expect(blocks).toHaveLength(2);
    // t0 = first seen = 5 h before now; the ticket spans 3 h: first run 0..2 h, second 2.5..3 h
    const first = blocks.eq(0);
    expect(first.attr('title')).toBe('Implementer · failed · t+0m · 2.0h');
    expect(first.attr('style')).toContain('left:0%');
    expect(first.attr('style')).toMatch(/width:66\.6+\d*%/);
    expect(first.attr('style')).toContain('border:1px solid #FF6B6B');
    expect(first.find('span').attr('style')).toContain('color:#FF9B9B');
    expect(first.find('span').text()).toBe('failed');
    const second = blocks.eq(1);
    expect(second.attr('title')).toBe('Implementer · ready-for-validation · t+2.5h · 30m');
    expect(second.attr('style')).toContain('border:1px solid #F5A52477');
    expect(second.attr('style')).toMatch(/width:16\.6+\d*%/);
    expect(second.find('span').text()).toBe('ready-for-validation');
  });

  it('T-INT-D2: a block narrower than 11% prints no label, and the minimum width is 3.5%', async () => {
    const $ = await page('/ticket/001');
    const you = $('div[style*="grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:center"]').eq(4).find('div[title]');
    expect(you.attr('title')).toMatch(/^You · intervention · t\+/);
    expect(you.attr('style')).toContain('width:3.5%');
    expect(you.find('span').text()).toBe('');
  });

  it('T-INT-D2: six ticks, the span label and the legend of the five lane colours', async () => {
    const $ = await page('/ticket/003');
    expect(text($, 'body')).toContain('Route · swimlanes over time');
    expect(text($, 'body')).toContain('span 3.0h · 2 agent runs');
    const ticks = $('div[style*="justify-content:space-between;font-family:\'IBM Plex Mono\',monospace;font-size:9px"] span').map((_, el) => $(el).text()).get();
    expect(ticks).toEqual(['0m', '36m', '1.2h', '1.8h', '2.4h', '3.0h']);
    const legend = $('div[style*="padding-top:6px;border-top:1px solid #191E25"] > div').map((_, el) => $(el).text().trim()).get();
    expect(legend).toEqual(['Groom', 'Architect', 'Implementer', 'Validator', 'You']);
  });

  it('T-INT-D3: the run list is newest first with agent, result, when, how long, tokens and a one-line summary (S4.3)', async () => {
    const $ = await page('/ticket/003');
    const entries = $('details.af-log');
    expect(entries).toHaveLength(2);
    const newest = entries.eq(0);
    expect(newest.find('summary').text().replace(/\s+/g, ' ')).toContain('Implementer ready-for-validation');
    expect(newest.find('summary').text().replace(/\s+/g, ' ')).toContain('t+2.5h · 30m · 4.0k tok');
    expect(newest.find('summary').text()).toContain('Re-run complete');
    expect(newest.find('summary').text()).toContain('→ Implemented – ready for validation');
    const oldest = entries.eq(1);
    expect(oldest.find('summary').text().replace(/\s+/g, ' ')).toContain('Implementer failed');
    expect(oldest.find('summary').text()).toContain('t+0m · 2.0h · 3.0k tok');
    expect(oldest.find('summary').text()).toContain('Broker lost');
    expect(oldest.find('summary').text()).not.toContain('→'); // status did not move
    expect(newest.find('span[title]').attr('title')).toBe('2026-09-20 11:30'.replace('11:30', '11:30'));
  });

  it('T-INT-D3: the absolute start time is on the t+ element, in TZ', async () => {
    const $ = await page('/ticket/003');
    // started 2.5 h before 12:00 UTC = 09:30 UTC = 11:30 in Berlin (CEST)
    expect($('details.af-log').eq(0).find('span[title]').attr('title')).toBe('2026-09-20 11:30');
  });

  it('T-INT-D4: expanded, the output is a numbered list in order, then the final output and the verdict (S4.4, R6)', async () => {
    await reportRun(t, { ticket: '020', title: 'Numbered', agent: 'architect', startedAt: T0 - 3 * H, endedAt: T0 - 2 * H, statusBefore: S.GROOMED, statusAfter: S.DESIGNED, text: 'I read the requirements.\n\nThen I designed <b>it</b> & "more".\n  indented line\nSTATUS: designed\nSUMMARY: Designed it', tokens: 1234 });
    const $ = await page('/ticket/020');
    const body = $('details.af-log').eq(0).children('div');
    expect(body.text().replace(/\s+/g, ' ')).toContain('run #1 · 5 steps · 1.0h · 1.2k tokens');
    const steps = body.find('div[style*="grid-template-columns:22px"]').map((_, el) => [[$(el).children().eq(0).text(), $(el).children().eq(1).text()]]).get() as unknown as string[][];
    expect(steps).toEqual([
      ['01', 'I read the requirements.'],
      ['02', 'Then I designed <b>it</b> & "more".'],
      ['03', '  indented line'],
      ['04', 'STATUS: designed'],
      ['05', 'SUMMARY: Designed it'],
    ]);
    expect(body.html()).toContain('&lt;b&gt;it&lt;/b&gt;'); // escaped, never rendered
    expect(body.find('b')).toHaveLength(0);
    expect(body.text()).toContain('Final output');
    expect(body.text()).toContain('Designed it');
    expect(body.text()).toContain('Ticket moved to "Designed – ready for implementation"');
    // the design's step kinds are gone (D6)
    expect(body.text()).not.toMatch(/\b(read|think|tool|write|check)\b\s*\d/);
  });

  it('T-INT-D4: a run that did not move the ticket says "No status change"', async () => {
    const $ = await page('/ticket/003');
    expect($('details.af-log').eq(1).children('div').text()).toContain('No status change');
  });

  it('T-INT-D4: the k in "run #k" counts that agent\'s runs on the ticket', async () => {
    const $ = await page('/ticket/005');
    const metas = $('details.af-log').map((_, el) => $(el).children('div').children().first().text()).get();
    expect(metas.map((m) => m.match(/run #(\d)/)![1])).toEqual(['4', '3', '2', '1']);
  });

  it('T-INT-D5: interventions are listed with what the operator did and when, oldest first (S4.5)', async () => {
    await intervene(t, { ticket: '001', ts: T0 - 20 * H, what: 'A second, later note', source: 'session-hook' });
    const $ = await page('/ticket/001');
    const panel = $('div').filter((_, el) => $(el).children().first().text().trim() === 'Your involvement').first();
    const entries = panel.children('div').slice(1).map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get();
    expect(entries).toEqual(['Faxes are in scope, 90% is fine t+2.0h', 'A second, later note t+1.0d']);
  });

  it('T-INT-D5: an intervention is also a run in the log, labelled "Your note" (R4, assumption 15)', async () => {
    const $ = await page('/ticket/001');
    const entry = $('details.af-log').filter((_, el) => $(el).find('summary').text().includes('You')).first();
    expect(entry.find('summary').text().replace(/\s+/g, ' ')).toContain('You intervention');
    expect(entry.find('summary').text()).toContain('no tokens');
    expect(entry.children('div').text().replace(/\s+/g, ' ')).toContain('manual · 1 step · 0m · no tokens');
    expect(entry.children('div').text()).toContain('Your note');
    expect(entry.children('div').text()).toContain('Faxes are in scope, 90% is fine');
  });

  it('T-INT-D5: without interventions it says so', async () => {
    const $ = await page('/ticket/002');
    expect(text($, 'body')).toContain('No interventions yet.');
  });

  it('an intervention never adds tokens or working time (R4)', async () => {
    const $ = await page('/ticket/001');
    expect(text($, 'body')).toContain('tokens 3.0k');
    expect(text($, 'body')).toContain('agent compute 2.0h');
  });

  it('T-INT-D6: the status trail lists the statuses in order, each dotted in its colour (S4.6)', async () => {
    const $ = await page('/ticket/001');
    const trail = $('div').filter((_, el) => $(el).children().first().text().trim() === 'Status trail').first();
    const rows = trail.children('div').slice(1).map((_, el) => [[$(el).find('span').last().text(), $(el).find('span').first().attr('style')!]]).get() as unknown as string[][];
    expect(rows.map((r) => r[0])).toEqual([S.GROOMING, S.GROOMED, S.IMPLEMENTED, S.BLOCKED_REQ]);
    expect(rows[3]![1]).toContain('background:#FF6B6B');
    expect(rows[1]![1]).toContain('background:#5BC8F5');
  });

  it('shows the per-agent token bars', async () => {
    const $ = await page('/ticket/001');
    const panel = $('div').filter((_, el) => $(el).children().first().text().trim() === 'Tokens per agent').first();
    expect(panel.text().replace(/\s+/g, ' ')).toContain('Groom 1.0k');
    expect(panel.text().replace(/\s+/g, ' ')).toContain('Validator 2.0k');
    expect(panel.find('div[style*="width:100%"]').length + panel.find('div[style*="width:50%"]').length).toBeGreaterThan(0);
  });

  it('an unknown ticket renders the dark 404 page with a way back', async () => {
    const $ = await page('/ticket/999', 404);
    expect($('body').text()).toContain('That ticket is not here.');
    expect($('a[href="/"]').text()).toContain('back to the overview');
    await page('/ticket/nonsense/001', 404);
  });

  it('a running run is drawn up to now, with a dash for its duration', async () => {
    await startRun(t, { ticket: '030', title: 'Running one', agent: 'implementer', ts: T0 - 2 * H, session_id: 'r1' });
    const $ = await page('/ticket/030');
    const block = $('div[title^="Implementer"]');
    expect(block.attr('title')).toBe('Implementer · running · t+0m · 2.0h');
    expect(block.attr('style')).toContain('width:100%');
    expect($('details.af-log summary').text().replace(/\s+/g, ' ')).toContain('t+0m · — · —');
  });

  it('an abandoned run without an end is drawn at the minimum width and marked as failed', async () => {
    await startRun(t, { ticket: '031', title: 'Abandoned one', agent: 'implementer', ts: T0 - 20 * H, session_id: 'r1' });
    await reportRun(t, { ticket: '031', title: 'Abandoned one', agent: 'validator', startedAt: T0 - 5 * H, endedAt: T0 - 4 * H });
    const $ = await page('/ticket/031');
    const block = $('div[title^="Implementer"]');
    expect(block.attr('title')).toContain('abandoned');
    expect(block.attr('style')).toContain('width:3.5%');
    expect(block.attr('style')).toContain('border:1px solid #FF6B6B');
  });
});

// ---------------------------------------------------------------------------- Analytics tab
describe('the Analytics tab (T-INT-N1…N6)', () => {
  it('T-INT-N1: four trend cards, in order, each with a delta, the period and week bars (S5.1)', async () => {
    await seedFactory(t);
    // history in earlier weeks so that a comparison exists
    for (let w = 1; w <= 3; w += 1) {
      await reportRun(t, { ticket: `9${w}0`, title: `Earlier ${w}`, agent: 'groom', startedAt: T0 - w * 7 * DAY, endedAt: T0 - w * 7 * DAY + 2 * H, statusBefore: S.GROOMING, statusAfter: S.GROOMED });
    }
    const $ = await page('/?tab=analytics');
    const cards = $('section[data-panel=analytics] > div > div').first().children();
    expect(cards).toHaveLength(4);
    const labels = cards.map((_, el) => $(el).find('span').first().text()).get();
    expect(labels).toEqual(['Human calls / ticket', 'Loops / ticket', 'Lead time (h)', 'Compute (h)']);
    cards.each((_, el) => {
      expect($(el).text()).toContain('w35 – w38 · 4 weeks of data');
      expect($(el).find('div[title]')).toHaveLength(4);
    });
  });

  it('T-INT-N2 / N3: with a short history the period is named, and a single week says there is no comparison yet (S5.2, S5.3)', async () => {
    await seedFactory(t);
    const $ = await page('/?tab=analytics');
    const first = $('section[data-panel=analytics] > div > div').first().children().first();
    expect(first.text()).toContain('no comparison yet');
    expect(first.text()).toContain('w38 – w38 · 1 week of data');
  });

  it('T-INT-N2: delta text and the improvement word appear on the card', async () => {
    // week w37: 1 human call over 1 ticket; week w38: 0 human calls -> better (lower)
    await reportRun(t, { ticket: '001', agent: 'groom', startedAt: T0 - 7 * DAY, endedAt: T0 - 7 * DAY + H, statusBefore: S.GROOMING, statusAfter: S.GROOMED });
    await intervene(t, { ticket: '001', ts: T0 - 7 * DAY + 2 * H, what: 'call', source: 'session-hook' });
    await reportRun(t, { ticket: '001', agent: 'architect', startedAt: T0 - H, endedAt: T0 - 30 * 60_000, statusBefore: S.GROOMED, statusAfter: S.DESIGNED });
    const $ = await page('/?tab=analytics');
    const first = $('section[data-panel=analytics] > div > div').first().children().first();
    expect(first.text()).toContain('-100% vs w37 · better');
    expect(first.find('span[style*="color:#9EE84B"]').text()).toContain('better');
  });

  it('T-INT-N4: one row per ticket ordered by your calls, then loops, then number (S5.4)', async () => {
    await seedFactory(t);
    const $ = await page('/?tab=analytics');
    expect(ids($, 'section[data-panel=analytics] a.af-h-row')).toEqual(['001', '005', '003', '002', '004', '006', '007', '008', '009', '010']);
    const first = $('a.af-h-row').first();
    const cells = first.children().map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get();
    expect(cells).toEqual(['001', 'Needs requirements ticket', '1', '0', '1.9d', '2.0h', '3.0k']);
    expect(first.attr('href')).toBe('/ticket/001?from=analytics');
    // the four mini bars and their colours
    const bars = first.find('div[style*="height:6px"]').map((_, el) => $(el).attr('style')!).get();
    expect(bars.map((b) => b.match(/background:(#[0-9A-F]+)/)![1])).toEqual(['#FF7AB6', '#F5A524', '#5BC8F5', '#9EE84B']);
    expect(bars[0]).toContain('width:100%'); // the only ticket with a call
    expect(bars[1]).toContain('width:2%'); // 0 of max 3 loops -> the 2% floor
  });

  it('T-INT-N4: the table header has the design\'s seven columns', async () => {
    await seedFactory(t);
    const $ = await page('/?tab=analytics');
    const head = $('div[style*="letter-spacing:.1em"]').first().children().map((_, el) => $(el).text()).get();
    expect(head).toEqual(['ticket', 'title', 'your calls', 'loops', 'lead time', 'compute', 'tokens']);
  });

  it('T-INT-N5: token spend per agent, in the order groom..validator, with tokens and time (S5.5)', async () => {
    await seedFactory(t);
    const $ = await page('/?tab=analytics');
    const card = $('div').filter((_, el) => $(el).children().first().text().trim() === 'Token spend per agent').first();
    const rows = card.children('div').slice(1).map((_, el) => $(el).children().first().text().replace(/\s+/g, ' ').trim()).get();
    expect(rows).toEqual(['Groom 3.4k · 4.0h', 'Architect 1.6k · 1.0h', 'Implementer 12k · 9.5h', 'Validator 9.0k · 3.0h']);
  });

  it('T-INT-N6: five bounce rows with their counts (S5.6)', async () => {
    await seedFactory(t);
    const $ = await page('/?tab=analytics');
    const card = $('div').filter((_, el) => $(el).children().first().text().trim() === 'Where tickets bounce back').first();
    const rows = card.children('div').slice(1).map((_, el) => $(el).children().first().text().replace(/\s+/g, ' ').trim()).get();
    expect(rows).toEqual([
      'validator → implementer 1x',
      'validator → architect 0x',
      'validator → groom 1x',
      'implementer → architect 1x',
      'agent run failed 2x',
    ]);
  });

  it('shows the design\'s captions', async () => {
    await seedFactory(t);
    const $ = await page('/?tab=analytics');
    for (const caption of ['Per ticket · lifetime', 'Token spend per agent', 'Where tickets bounce back']) {
      expect($('body').text()).toContain(caption);
    }
  });
});

// ---------------------------------------------------------------------------- T-UI-1
describe('the design is kept (T-UI-1, ADR-0002)', () => {
  it('has the design\'s literal captions and palette, and none of what was removed or is out of scope', async () => {
    await seedFactory(t);
    const overview = (await request(t.app).get('/')).text;
    const detail = (await request(t.app).get('/ticket/001')).text;
    const all = overview + detail;
    for (const caption of ['Control room', 'Agent Factory', 'Running on their own', 'Route · swimlanes over time', 'Agent output log', 'Tokens per agent', 'Your involvement', 'Status trail', 'Per ticket · lifetime', 'Token spend per agent', 'Where tickets bounce back']) {
      expect(all, caption).toContain(caption);
    }
    for (const colour of ['#0A0C0F', '#12151A', '#9EE84B', '#FF7AB6', '#5BC8F5', '#A78BFA', '#F5A524', '#FF6B6B']) {
      expect(all, colour).toContain(colour);
    }
    expect(all.toLowerCase()).not.toContain('synced'); // D5
    expect(all).not.toContain('prefers-color-scheme'); // QE4
    expect(all).not.toMatch(/@media/); // QE3: no breakpoint at all
    expect(all).not.toMatch(/\b(read|think|tool|write|check)<\/span>/); // D6: no step kind label
    expect(all).not.toMatch(/<form|<input|<textarea|<select|method=["']?post/i); // D1, OS1
    expect(all).not.toMatch(/€|\$\d|EUR|USD/); // no currency
  });

  it('ships one stylesheet without media queries or colour-scheme rules, and the fonts self-hosted', async () => {
    const css = (await request(t.app).get('/assets/app.css')).text;
    expect(css).not.toMatch(/@media|prefers-color-scheme/);
    expect(css).toContain('@keyframes af-pulse');
    expect(css).not.toContain('googleapis');
    const fonts = [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]!);
    expect(fonts.length).toBe(7);
    for (const f of fonts) {
      const res = await request(t.app).get(f);
      // the fonts are copied by the build; from the source tree only the stylesheet and the script exist
      expect([200, 404]).toContain(res.status);
    }
  });

  it('serves the assets with a week of caching, and no outbound host anywhere in a page', async () => {
    const res = await request(t.app).get('/assets/app.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=604800');
    await seedCalm(t);
    const page = (await request(t.app).get('/')).text;
    expect(page).not.toMatch(/https?:\/\//);
  });

  it('T-DATA-1-adjacent: the client script is small, has no timer and no fetch (R12)', async () => {
    const js = (await request(t.app).get('/assets/app.js')).text;
    expect(js.split('\n').length).toBeLessThan(60);
    expect(js).not.toMatch(/setInterval|setTimeout|fetch\(|XMLHttpRequest|WebSocket|localStorage/);
  });

  it('escapes everything an agent reported (untrusted content)', async () => {
    await reportRun(t, { ticket: '040', title: '<script>alert(1)</script>', agent: 'groom', startedAt: T0 - 2 * H, endedAt: T0 - H, statusBefore: S.GROOMING, statusAfter: S.GROOMED, text: '<img src=x onerror=alert(1)>\nSTATUS: groomed\nSUMMARY: <b>bold</b>' });
    for (const path of ['/', '/?tab=pipeline', '/?tab=analytics', '/ticket/040']) {
      const html = (await request(t.app).get(path)).text;
      expect(html, path).not.toContain('<script>alert');
      expect(html, path).not.toContain('<img src=x');
      expect(html, path).not.toContain('<b>bold</b>');
    }
  });

  it('renders the dark error page with a request id for a server error (500)', async () => {
    t.db.exec('ALTER TABLE ticket RENAME TO ticket_gone');
    const res = await request(t.app).get('/');
    expect(res.status).toBe(500);
    expect(res.text).toContain('Something went wrong.');
    expect(res.text).toMatch(/request [0-9a-f-]{8}/);
    expect(res.text).not.toContain('SqliteError');
  });
});

// ---------------------------------------------------------------------------- repository display (R3)
describe('the repository label (R3, D14, D16, D17)', () => {
  const PLACES = async (): Promise<Record<string, string>> => {
    const get = async (p: string) => (await request(t.app).get(p)).text;
    return {
      attention: await get('/'),
      pipeline: await get('/?tab=pipeline'),
      analytics: await get('/?tab=analytics'),
    };
  };

  it('T-REPO-2: with one repository its key and label appear nowhere: no text, attribute, URL or comment (S1.7)', async () => {
    await seedFactory(t);
    await intervene(t, { ticket: '001', ts: T0 - H, what: 'x', source: 'session-hook' });
    const pages: Record<string, string> = { ...(await PLACES()), detail: (await request(t.app).get('/ticket/001')).text };
    for (const [name, html] of Object.entries(pages)) {
      expect(html, name).not.toContain('vkuras');
      expect(html, name).not.toContain('github.com');
      expect(html, name).not.toContain('factory/');
      expect(html, name).not.toContain('af-repo');
      expect(html, name).not.toContain('%2F');
      expect(html, name).not.toMatch(/\/ticket\/[^"?/]+\/[^"?]/); // every link is the short form
    }
    expect(pages['attention']).toContain('href="/ticket/001?from=attention"');
  });

  it('T-REPO-6: the short link renders the detail page while one repository has reported', async () => {
    await seedFactory(t);
    const res = await request(t.app).get('/ticket/001');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Needs requirements ticket');
  });

  it('T-REPO-3: the second repository\'s first report shows the label on every ticket, old ones included (S1.8, D16)', async () => {
    await seedFactory(t);
    await reportRun(t, { project: REPO_B, ticket: '001', title: 'Shop ticket', agent: 'groom', startedAt: T0 - H, endedAt: T0 - 30 * 60_000, statusBefore: S.GROOMING, statusAfter: S.BLOCKED_REQ });

    const attention = cheerio.load((await request(t.app).get('/')).text);
    const cards = attention('section[data-panel=attention] a.af-h-attn');
    const label = (el: unknown): string => attention(el as never).find('.af-repo').text().replace(/\s+/g, ' ').trim();
    const of001 = cards.filter((_, el) => attention(el).find('.af-id').text() === '001');
    expect(of001.map((_, el) => label(el)).get().sort()).toEqual(['· factory', '· shop']);
    // every attention card, every calm chip
    expect(attention('section[data-panel=attention] a.af-h-attn .af-id').length).toBe(attention('section[data-panel=attention] a.af-h-attn .af-repo').length);
    expect(attention('a.af-h-chip .af-id').length).toBe(attention('a.af-h-chip .af-repo').length);
    expect(attention('a.af-h-chip .af-repo').length).toBeGreaterThan(0);

    const pipeline = cheerio.load((await request(t.app).get('/?tab=pipeline')).text);
    expect(pipeline('a.af-h-pcard .af-id').length).toBe(pipeline('a.af-h-pcard .af-repo').length);
    expect(pipeline('a.af-h-pcard .af-repo').length).toBe(11);

    const analytics = cheerio.load((await request(t.app).get('/?tab=analytics')).text);
    expect(analytics('a.af-h-row .af-id').length).toBe(analytics('a.af-h-row .af-repo').length);
    expect(analytics('a.af-h-row .af-repo').length).toBe(11);

    for (const [project, expected] of [[REPO_A, '· factory'], [REPO_B, '· shop']] as const) {
      const detail = cheerio.load((await request(t.app).get(`/ticket/${encodeURIComponent(project)}/001`)).text);
      expect(detail('.af-repo').text().replace(/\s+/g, ' ').trim()).toBe(expected);
      expect(detail('.af-repo').attr('title')).toBe(project);
    }
  });

  it('S1.6 / S3.4: two tickets 001 are two cards, each with its own repository, and each link is canonical', async () => {
    await reportRun(t, { project: REPO_A, ticket: '001', title: 'Factory ticket', agent: 'groom', startedAt: T0 - 5 * H, endedAt: T0 - 4 * H, statusBefore: S.GROOMING, statusAfter: S.BLOCKED_REQ });
    await reportRun(t, { project: REPO_B, ticket: '001', title: 'Shop ticket', agent: 'groom', startedAt: T0 - 3 * H, endedAt: T0 - 2 * H, statusBefore: S.GROOMING, statusAfter: S.BLOCKED_REQ });
    const $ = await page('/');
    const cards = $('section[data-panel=attention] a.af-h-attn');
    expect(cards).toHaveLength(2);
    const summary = cards.map((_, el) => `${$(el).find('.af-id').text()}${$(el).find('.af-repo').text()}|${$(el).attr('href')}|${$(el).text().includes('Factory ticket') ? 'F' : 'S'}`).get().sort();
    expect(summary).toEqual([
      `001 · factory|/ticket/${encodeURIComponent(REPO_A)}/001?from=attention|F`,
      `001 · shop|/ticket/${encodeURIComponent(REPO_B)}/001?from=attention|S`,
    ]);
    const pipeline = await page('/?tab=pipeline');
    expect(pipeline('a.af-h-pcard')).toHaveLength(2);
  });

  it('T-REPO-6: with two repositories the short link answers 302 to the canonical URL of the most recently active ticket', async () => {
    await reportRun(t, { project: REPO_A, ticket: '001', agent: 'groom', startedAt: T0 - 5 * H, endedAt: T0 - 4 * H, statusBefore: S.GROOMING, statusAfter: S.GROOMED });
    await reportRun(t, { project: REPO_B, ticket: '001', agent: 'groom', startedAt: T0 - 3 * H, endedAt: T0 - 2 * H, statusBefore: S.GROOMING, statusAfter: S.GROOMED });
    const res = await request(t.app).get('/ticket/001?from=pipeline').redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers['location']).toBe(`/ticket/${encodeURIComponent(REPO_B)}/001?from=pipeline`);
    const followed = await request(t.app).get(res.headers['location']!);
    expect(followed.status).toBe(200);
  });

  it('T-REPO-6: the short link of a ticket that exists once still renders after the label appeared', async () => {
    await seedFactory(t);
    await reportRun(t, { project: REPO_B, ticket: '500', title: 'Shop only', agent: 'groom', startedAt: T0 - H, endedAt: T0 - 30 * 60_000, statusBefore: S.GROOMING, statusAfter: S.GROOMED });
    expect((await request(t.app).get('/ticket/002').redirects(0)).status).toBe(200);
    // ...and every rendered link is now the canonical form
    const html = (await request(t.app).get('/')).text;
    expect(html).not.toMatch(/href="\/ticket\/\d+\?/);
    expect(html).toMatch(/href="\/ticket\/github\.com%2Fvkuras%2Ffactory\/002\?from=attention"/);
  });

  it('T-REPO-4: the switch changes no stored data; the second repository adds only its own rows (S1.8)', async () => {
    await seedFactory(t);
    const dump = (): Record<string, unknown[]> => ({
      ticket: t.db.prepare('SELECT * FROM ticket ORDER BY project_key, number').all(),
      run: t.db.prepare('SELECT * FROM run ORDER BY id').all(),
      events: t.db.prepare('SELECT * FROM ticket_status_event ORDER BY id').all(),
    });
    const before = dump();
    await reportRun(t, { project: REPO_B, ticket: '001', title: 'Shop', agent: 'groom', startedAt: T0 - H, endedAt: T0 - 30 * 60_000, statusBefore: S.GROOMING, statusAfter: S.GROOMED });
    const after = dump();
    for (const table of ['ticket', 'run', 'events'] as const) {
      const previous = new Set(before[table]!.map((r) => JSON.stringify(r)));
      const kept = after[table]!.filter((r) => previous.has(JSON.stringify(r)));
      expect(kept.length, table).toBe(before[table]!.length);
    }
    expect(after['ticket']!.length).toBe(before['ticket']!.length + 1);
    expect(after['run']!.length).toBe(before['run']!.length + 1);
  });

  it('T-REPO-5: once two repositories have reported the label stays when only the first reports again, and after a restart', async () => {
    await seedFactory(t);
    await reportRun(t, { project: REPO_B, ticket: '500', title: 'Shop only', agent: 'groom', startedAt: T0 - 2 * H, endedAt: T0 - H, statusBefore: S.GROOMING, statusAfter: S.GROOMED });
    await reportRun(t, { project: REPO_A, ticket: '008', agent: 'architect', startedAt: T0 - 50 * 60_000, endedAt: T0 - 40 * 60_000, statusBefore: S.GROOMED, statusAfter: S.DESIGNED });
    expect((await request(t.app).get('/')).text).toContain('af-repo');
    // a restart: a new app over the same database file
    const { createApp } = await import('../src/app.js');
    const restarted = createApp({ config: t.config, db: t.db, now: () => t.clock.now });
    expect((await request(restarted).get('/')).text).toContain('af-repo');
  });

  it('keeps the label to 14 characters with an ellipsis and never wraps it', async () => {
    const css = (await request(t.app).get('/assets/app.css')).text;
    expect(css).toMatch(/\.af-repo\s*\{[^}]*max-width:\s*14ch/);
    expect(css).toMatch(/\.af-repo\s*\{[^}]*text-overflow:\s*ellipsis/);
    expect(css).toMatch(/\.af-repo\s*\{[^}]*white-space:\s*nowrap/);
    // an inline-block collapses the leading space of " · factory", so the gap after the id is a margin
    expect(css).toMatch(/\.af-repo\s*\{[^}]*margin-left:\s*4px/);
    expect(css).toMatch(/\.af-repo\s*\{[^}]*font-size:\s*11px[^}]*color:\s*#6E7887|\.af-repo\s*\{[^}]*color:\s*#6E7887[^}]*font-size:\s*11px/);
  });

  it('T-DATA-1: nothing deletes, and there is no retention, purge, TTL or backup path', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const root = new URL('..', import.meta.url).pathname;
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist' || name === 'test') continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else files.push(p);
      }
    };
    walk(join(root, 'src'));
    walk(join(root, 'migrations'));
    for (const f of files.filter((p) => /\.(ts|sql|ejs|js)$/.test(p))) {
      const body = readFileSync(f, 'utf8');
      expect(body, f).not.toMatch(/DELETE\s+FROM/i);
      expect(body, f).not.toMatch(/\b(retention|purge|ttl)\b/i);
      expect(body, f).not.toMatch(/BACKUP_/);
    }
    // ON DELETE CASCADE is a schema constraint the design names; it is never triggered
    expect(readFileSync(join(root, 'migrations/001_init.sql'), 'utf8')).not.toMatch(/DELETE\s+FROM/i);
  });
});
