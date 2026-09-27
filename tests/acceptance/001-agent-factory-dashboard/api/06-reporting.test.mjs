// S6 — the factory reports what it does — seen from outside: what a report does to the dashboard.
// The reporter itself (the shell script in the plugin) is checked in reporter/report-sh.test.sh.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, post, runStart, runFinish, run, intervention, H } from '../lib/report.mjs';
import { between } from '../lib/dom.mjs';
import { REPO_A, S } from '../seed/dataset.mjs';

const now = Date.now();
const t = (ticket, extra) => ({ project: REPO_A, ticket, title: 'Reporting check ' + ticket, ...extra });

test('S6.1 a run that has started is in progress on the dashboard, on its ticket, by its agent', async () => {
  const before = await page('/');
  assert.match(before.text, /no agents running/);

  const handle = await runStart(t('900', { agent: 'implementer', startedAt: now - 0.5 * H, statusBefore: S.designed }));
  const during = await page('/');
  assert.match(during.text, /1 agent online/, 'the header counts the run that is in progress');

  const detail = await page('/ticket/900');
  const log = detail.html.slice(detail.html.indexOf('Agent output log'));
  assert.match(log, />Implementer<\/span>/, 'the run is on the ticket, with its agent');
  assert.match(detail.text, /runs 1/);

  const second = await runStart(t('901', { agent: 'validator', startedAt: now - 0.2 * H, statusBefore: S.implemented }));
  assert.match((await page('/')).text, /2 agents online/);

  await runFinish(t('900', { agent: 'implementer', endedAt: now - 0.1 * H, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Done.', tokens: 1200 }), handle);
  await runFinish(t('901', { agent: 'validator', endedAt: now, statusAfter: S.validated, output: 'STATUS: validated\nSUMMARY: All criteria met.', tokens: 900 }), second);
  assert.match((await page('/')).text, /no agents running/, 'a finished run is no longer online');
});

test('S6.2 a finished run delivers its output, its result, its duration and its tokens', async () => {
  const p = await page('/ticket/900');
  const log = between(p.text, 'Agent output log', 'Tokens per agent');
  assert.ok(log.includes('ready-for-validation'), 'the result');
  assert.ok(log.includes('Done.'), 'the output');
  assert.match(log, /t\+\d+(\.\d)?[hdm] · \d+(\.\d)?[hdm] · 1\.2k tok/, 'when it started, how long it took, how many tokens');
});

test('S6.3 / R6 the output is what the agent produced, not a summary written for the dashboard', async () => {
  const output = [
    'STATUS: changes-requested',
    '  two leading spaces and a trailing pair  ',
    'a line with <b>markup</b>, an & ampersand and "quotes"',
    'Unicode: ✓ – ü · 日本語',
    '',
    'SUMMARY: Three findings, one of them blocking.',
  ].join('\n');
  await run(t('902', { agent: 'validator', startedAt: now - 2 * H, endedAt: now - 1.5 * H, statusBefore: S.implemented, statusAfter: S.changes, output, tokens: 4321 }));

  const p = await page('/ticket/902');
  const escaped = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;');
  for (const line of output.split('\n').filter((l) => l.trim())) {
    assert.ok(p.html.includes(escaped(line)), `the line is stored and shown exactly as the agent wrote it: ${JSON.stringify(line)}`);
  }
  const numbered = between(p.text, 'run #1 · 5 steps');
  assert.ok(numbered.includes('01 STATUS: changes-requested'), 'in order, numbered');
  assert.ok(numbered.includes('05 SUMMARY: Three findings, one of them blocking.'), 'and complete');
});

test('S6.5 / R4 an intervention is reported with what I did and when, and is never counted twice', async () => {
  await intervention(t('903', { ts: now - 3 * H, status: S.grooming, what: 'ja, mach weiter' }));
  let p = await page('/ticket/903');
  assert.match(between(p.text, 'Your involvement', 'Status trail'), /ja, mach weiter/);
  assert.match(p.text, /your calls 1/);

  // the same act delivered twice (hook and driver) stays one intervention
  await intervention(t('903', { ts: now - 3 * H + 1000, status: S.grooming, what: 'ja, mach weiter' }));
  await intervention(t('903', { ts: now - 3 * H + 2000, status: S.grooming, what: 'answered the open question', source: 'cli' }));
  p = await page('/ticket/903');
  assert.match(p.text, /your calls 1/, 'how often I intervened is not inflated by a doubled report');

  // a second, separate intervention is its own row
  await intervention(t('903', { ts: now - 1 * H, status: S.grooming, what: 'und jetzt bitte validieren' }));
  p = await page('/ticket/903');
  assert.match(p.text, /your calls 2/);
});

test('a duplicate delivery of the same run does not become a second run', async () => {
  const handle = await runStart(t('904', { agent: 'groom', startedAt: now - 5 * H, statusBefore: S.grooming }));
  await runStart({ ...t('904', { agent: 'groom', startedAt: now - 5 * H, statusBefore: S.grooming }), session: handle.session, toolUse: handle.toolUse });
  await runFinish(t('904', { agent: 'groom', endedAt: now - 4 * H, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: One story.', tokens: 100 }), handle);
  await runFinish(t('904', { agent: 'groom', endedAt: now - 4 * H, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: One story.', tokens: 100 }), handle);
  const p = await page('/ticket/904');
  assert.match(p.text, /runs 1/);
  assert.match(p.text, /loops 0/);
});

test('R9 a report the dashboard cannot use is refused, and nothing is stored', async () => {
  const res1 = await post('/api/hook/run-start', { v: 1, event: 'run-start', ts: Date.now(), project: REPO_A }); // no ticket
  assert.equal(res1.status, 400);
  const res3 = await post('/api/hook/run-start', { v: 1, event: 'run-start', ts: Date.now(), project: REPO_A, ticket: '905', agent: 'groom' }, 'x'.repeat(3 * 1024 * 1024));
  assert.equal(res3.status, 413);
  assert.equal((await page('/ticket/905')).status, 404, 'a refused report creates nothing');

  // a body the dashboard cannot read finishes nothing and breaks nothing
  const open = await runStart(t('907', { agent: 'groom', startedAt: now - 0.4 * H, statusBefore: S.grooming }));
  const garbage = await post(
    '/api/hook/run-finish',
    { v: 1, event: 'run-finish', ts: now, project: REPO_A, ticket: '907', agent: 'groom', source: 'subagent-hook', session_id: open.session, tool_use_id: open.toolUse },
    'this is not json',
  );
  assert.ok(garbage.status < 500, `the dashboard never answers a report with a server error (got ${garbage.status})`);
  const after = await page('/ticket/907');
  assert.match(after.text, /runs 1/, 'and it invents nothing out of a body it could not read');
  await runFinish(t('907', { agent: 'groom', endedAt: now, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: Done.', tokens: 10 }), open);
});

test('a finish without a start is dropped instead of inventing a run', async () => {
  await runFinish(t('906', { agent: 'architect', endedAt: now, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Nothing started this.', tokens: 10 }), { session: 'no-such-session', toolUse: 'no-such-tool' });
  assert.equal((await page('/ticket/906')).status, 404);
});

test('out of scope: the browser can take no action — there is no write route it could reach', async () => {
  const p = await page('/');
  assert.ok(!/<form/i.test(p.html), 'no form');
  assert.ok(!/<input/i.test(p.html), 'no input');
  assert.ok(!/<textarea/i.test(p.html), 'no text area');
  assert.ok(!p.html.includes('/api/'), 'the page does not even name the ingest API');
  for (const path of ['/api/hook/run-start', '/api/hook/run-finish', '/api/intervention']) {
    const get = await fetch((process.env.BASE || 'http://127.0.0.1:8787') + path);
    assert.equal(get.status, 404, `${path} answers nothing to a browser`);
  }
});
