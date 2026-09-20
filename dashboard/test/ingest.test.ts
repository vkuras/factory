import { readFileSync } from 'node:fs';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DAY,
  H,
  REPO_A,
  REPO_B,
  T0,
  finishRun,
  intervene,
  makeApp,
  metaHeader,
  output,
  post,
  reportRun,
  rows,
  startRun,
  type TestApp,
} from './helpers.js';

let t: TestApp;
beforeEach(() => {
  t = makeApp();
});
afterEach(() => t.close());

const fixture = (name: string): string => readFileSync(new URL(`./fixtures/hooks/${name}`, import.meta.url), 'utf8').trim();

interface RunRow {
  id: string;
  actor: string;
  started_at: number;
  ended_at: number | null;
  result: string | null;
  agent_status: string | null;
  tokens: number | null;
  output: string | null;
  summary: string | null;
  status_before: string | null;
  status_after: string | null;
  source: string;
  tool_use_id: string | null;
  session_id: string | null;
}
const runs = (): RunRow[] => rows<RunRow>(t, 'SELECT * FROM run ORDER BY started_at, created_at, rowid');

const base = { ticket: '001', title: 'Agent Factory Dashboard', slug: 'agent-factory-dashboard', session_id: 'S1' };

// T-INT-1
describe('run-start', () => {
  it('creates the repository, the ticket and the run', async () => {
    const res = await startRun(t, { ...base, agent: 'architect', ts: T0, req_status: 'Groomed – ready for architecture', tool_use_id: 'tu1', repo_path: '/home/pi/factory' });
    expect(res.status).toBe(204);
    expect(rows(t, 'SELECT project_key, repo_path FROM repository')).toEqual([{ project_key: REPO_A, repo_path: '/home/pi/factory' }]);
    expect(rows(t, 'SELECT number, title, slug, requirements_status, first_seen_at, last_activity_at FROM ticket')).toEqual([
      { number: '001', title: 'Agent Factory Dashboard', slug: 'agent-factory-dashboard', requirements_status: 'Groomed – ready for architecture', first_seen_at: T0, last_activity_at: T0 },
    ]);
    expect(runs()).toMatchObject([{ actor: 'architect', started_at: T0, ended_at: null, result: null, status_before: 'Groomed – ready for architecture', source: 'subagent-hook', tool_use_id: 'tu1', session_id: 'S1' }]);
    expect(rows(t, 'SELECT status FROM ticket_status_event')).toEqual([{ status: 'Groomed – ready for architecture' }]);
  });

  it('falls back to the ticket number as the title when the reporter had none', async () => {
    await startRun(t, { ticket: '007', agent: 'groom', ts: T0, session_id: 'S' });
    expect(rows(t, 'SELECT title FROM ticket')).toEqual([{ title: '007' }]);
  });

  it('a duplicate start (same tool_use_id) changes nothing', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0, tool_use_id: 'tu1' });
    await startRun(t, { ...base, agent: 'architect', ts: T0 + 5000, tool_use_id: 'tu1' });
    expect(runs()).toHaveLength(1);
  });

  it('a second start while one is open for the same actor and session changes nothing', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0 });
    await startRun(t, { ...base, agent: 'architect', ts: T0 + 5000 });
    expect(runs()).toHaveLength(1);
    await startRun(t, { ...base, agent: 'implementer', ts: T0 + 6000 });
    expect(runs()).toHaveLength(2);
  });

  it('updates title, slug and status from the newest report and keeps first_seen_at', async () => {
    await startRun(t, { ...base, agent: 'groom', ts: T0, title: 'Old', req_status: 'In grooming' });
    await startRun(t, { ...base, agent: 'architect', ts: T0 + H, session_id: 'S2', title: 'New', req_status: 'Groomed – ready for architecture' });
    expect(rows(t, 'SELECT title, first_seen_at, last_activity_at, requirements_status FROM ticket')).toEqual([
      { title: 'New', first_seen_at: T0, last_activity_at: T0 + H, requirements_status: 'Groomed – ready for architecture' },
    ]);
    expect(rows(t, 'SELECT status FROM ticket_status_event ORDER BY id')).toEqual([{ status: 'In grooming' }, { status: 'Groomed – ready for architecture' }]);
  });

  it('appends a status event only when the status differs from the newest one', async () => {
    await startRun(t, { ...base, agent: 'groom', ts: T0, req_status: 'In grooming' });
    await startRun(t, { ...base, agent: 'architect', session_id: 'S2', ts: T0 + 1, req_status: 'In grooming' });
    expect(rows(t, 'SELECT count(*) AS n FROM ticket_status_event')).toEqual([{ n: 1 }]);
  });

  it('sets validated_at once, when the status first becomes Validated', async () => {
    await startRun(t, { ...base, agent: 'validator', ts: T0, req_status: 'Validated' });
    await startRun(t, { ...base, agent: 'validator', session_id: 'S2', ts: T0 + H, req_status: 'Validated' });
    expect(rows(t, 'SELECT validated_at FROM ticket')).toEqual([{ validated_at: T0 }]);
  });
});

// T-INT-2
describe('run-finish', () => {
  it('fills the run: output, result, agent status, summary, duration and status after', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0, req_status: 'Groomed – ready for architecture', tool_use_id: 'tu1' });
    const text = 'Design done.\nSTATUS: designed\nSUMMARY: Node + SQLite + hooks';
    const res = await finishRun(t, { ...base, ts: T0 + 2 * H, req_status: 'Designed – ready for implementation', tool_use_id: 'tu1' }, output(text));
    expect(res.status).toBe(204);
    expect(runs()).toMatchObject([
      { ended_at: T0 + 2 * H, result: 'designed', agent_status: 'designed', output: text, summary: 'Node + SQLite + hooks', status_before: 'Groomed – ready for architecture', status_after: 'Designed – ready for implementation' },
    ]);
    expect(rows(t, 'SELECT agent_status, requirements_status FROM ticket')).toEqual([{ agent_status: 'designed', requirements_status: 'Designed – ready for implementation' }]);
  });

  it('matches a finish without tool_use_id to the newest open run of the session (SubagentStop)', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0 });
    await finishRun(t, { ...base, ts: T0 + H }, { last_assistant_message: 'STATUS: designed' });
    expect(runs()).toMatchObject([{ result: 'designed', ended_at: T0 + H }]);
  });

  it('falls back to the newest open run of the ticket when the session is unknown', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0 });
    await finishRun(t, { ticket: '001', ts: T0 + H, session_id: 'other' }, { last_assistant_message: 'STATUS: designed' });
    expect(runs()).toMatchObject([{ result: 'designed' }]);
  });

  it('a finish before any start is dropped and logged, and never becomes a run', async () => {
    const res = await finishRun(t, { ...base, ts: T0 }, output('STATUS: designed'));
    expect(res.status).toBe(204);
    expect(runs()).toHaveLength(0);
    expect(rows(t, 'SELECT count(*) AS n FROM ticket')).toEqual([{ n: 0 }]);
    expect(t.logs.find((l) => l['event'] === 'report_drop')).toMatchObject({ reason: 'finish without a start' });
    // ...but the dashboard has heard from the repository
    expect(rows(t, 'SELECT count(*) AS n FROM repository')).toEqual([{ n: 1 }]);
  });

  it('a duplicate finish changes nothing; ended_at and result are never overwritten', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0, tool_use_id: 'tu1' });
    await finishRun(t, { ...base, ts: T0 + H, tool_use_id: 'tu1' }, output('STATUS: designed\nSUMMARY: first'));
    await finishRun(t, { ...base, ts: T0 + 9 * H, tool_use_id: 'tu1' }, output('STATUS: failed\nSUMMARY: second'));
    expect(runs()).toMatchObject([{ ended_at: T0 + H, result: 'designed', summary: 'first', output: 'STATUS: designed\nSUMMARY: first' }]);
  });

  it('SubagentStop and PostToolUse both deliver, in either order: one run, first facts kept, NULLs filled', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0, tool_use_id: 'tu1' });
    // SubagentStop first: no tool_use_id, no tokens
    await finishRun(t, { ...base, ts: T0 + H }, { last_assistant_message: 'STATUS: designed\nSUMMARY: s' });
    // PostToolUse second: carries the tool_use_id and a token total
    await finishRun(t, { ...base, ts: T0 + H + 500, tool_use_id: 'tu1' }, { tool_response: { content: [{ type: 'text', text: 'STATUS: designed\nSUMMARY: s' }], totalTokens: 1234 } });
    expect(runs()).toMatchObject([{ ended_at: T0 + H, result: 'designed', tokens: 1234 }]);
    expect(runs()).toHaveLength(1);
  });

  it('a background acknowledgement is ignored and the real finish still closes the run', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0, tool_use_id: 'tu1' });
    const ack = JSON.parse(fixture('post-tool-use-background-ack.json')) as unknown;
    const res = await finishRun(t, { ...base, ts: T0 + 100, tool_use_id: 'tu1' }, ack);
    expect(res.status).toBe(204);
    expect(runs()).toMatchObject([{ ended_at: null, result: null }]);
    expect(t.logs.find((l) => l['event'] === 'report_ignored')).toMatchObject({ reason: 'background launch acknowledgement' });
    await finishRun(t, { ...base, ts: T0 + H }, JSON.parse(fixture('subagent-stop-background.json')) as unknown);
    expect(runs()).toMatchObject([{ result: 'nothing-to-do', ended_at: T0 + H }]);
  });

  it('a payload without output or error is ignored (204), the run stays open', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0 });
    const res = await finishRun(t, { ...base, ts: T0 + H }, { tool_response: {} });
    expect(res.status).toBe(204);
    expect(runs()).toMatchObject([{ ended_at: null }]);
  });

  it('an error flag closes the run as failed, even without output', async () => {
    await startRun(t, { ...base, agent: 'implementer', ts: T0 });
    await finishRun(t, { ...base, ts: T0 + H }, { tool_response: { is_error: true } });
    expect(runs()).toMatchObject([{ result: 'failed', output: null, agent_status: null }]);
  });

  it('a run with output but no STATUS line is "unreported"', async () => {
    await startRun(t, { ...base, agent: 'groom', ts: T0 });
    await finishRun(t, { ...base, ts: T0 + H }, output('just some prose'));
    expect(runs()).toMatchObject([{ result: 'unreported', agent_status: null, summary: 'just some prose' }]);
  });

  it('a STATUS: failed line is the failed result', async () => {
    await startRun(t, { ...base, agent: 'implementer', ts: T0 });
    await finishRun(t, { ...base, ts: T0 + H }, output('STATUS: failed\nSUMMARY: a check still fails'));
    expect(runs()).toMatchObject([{ result: 'failed', agent_status: 'failed' }]);
  });

  it('stores the output verbatim and caps it at 64 KiB', async () => {
    await startRun(t, { ...base, agent: 'groom', ts: T0 });
    const exact = '  first\n\n\tsecond  \n<b>not html</b>\nSTATUS: groomed\n';
    await finishRun(t, { ...base, ts: T0 + H }, output(exact));
    expect(runs()[0]!.output).toBe(exact);

    await startRun(t, { ...base, session_id: 'S2', agent: 'architect', ts: T0 + 2 * H });
    await finishRun(t, { ...base, session_id: 'S2', ts: T0 + 3 * H }, output('x'.repeat(70 * 1024)));
    const long = rows<{ output: string; output_truncated: number }>(t, `SELECT output, output_truncated FROM run WHERE actor = 'architect'`)[0]!;
    expect(long.output).toHaveLength(64 * 1024);
    expect(long.output_truncated).toBe(1);
  });

  it('the ticket agent status is the STATUS of the newest finished run', async () => {
    await reportRun(t, { ticket: '001', agent: 'groom', startedAt: T0, endedAt: T0 + H, text: 'STATUS: in-grooming' });
    expect(rows(t, 'SELECT agent_status FROM ticket')).toEqual([{ agent_status: 'in-grooming' }]);
    await reportRun(t, { ticket: '001', agent: 'groom', startedAt: T0 + 2 * H, endedAt: T0 + 3 * H, text: 'STATUS: groomed' });
    expect(rows(t, 'SELECT agent_status FROM ticket')).toEqual([{ agent_status: 'groomed' }]);
  });

  it('a cli finish stores the body verbatim as output, and honours the stated result', async () => {
    await post(t, { path: '/api/hook/run-start', meta: { event: 'run-start', ticket: '002', ts: T0, agent: 'validator', source: 'cli' } });
    const text = 'Line one\nSTATUS: validated\nSUMMARY: ok';
    const res = await post(t, { path: '/api/hook/run-finish', meta: { event: 'run-finish', ticket: '002', ts: T0 + H, source: 'cli', result: 'validated' }, body: text });
    expect(res.status).toBe(204);
    expect(runs()).toMatchObject([{ actor: 'validator', result: 'validated', output: text, source: 'cli', ended_at: T0 + H }]);
  });

  it('a cli finish with a result but no output still closes the run', async () => {
    await post(t, { path: '/api/hook/run-start', meta: { event: 'run-start', ticket: '002', ts: T0, agent: 'validator', source: 'cli' } });
    await post(t, { path: '/api/hook/run-finish', meta: { event: 'run-finish', ticket: '002', ts: T0 + H, source: 'cli', result: 'blocked-environment' } });
    expect(runs()).toMatchObject([{ result: 'blocked-environment', output: null }]);
  });

  it('result is only honoured from cli: a hook report ignores meta.result', async () => {
    await startRun(t, { ...base, agent: 'groom', ts: T0 });
    await finishRun(t, { ...base, ts: T0 + H, result: 'validated' }, output('STATUS: groomed'));
    expect(runs()).toMatchObject([{ result: 'groomed' }]);
  });
});

// T-HOOK-3
describe('the token delta (T-HOOK-3, ADR-0004)', () => {
  it('two consecutive runs in one shared transcript are charged their own share', async () => {
    const shared = { session_id: 'S1', transcript_path: '/tmp/shared.jsonl' };
    await startRun(t, { ...base, ...shared, agent: 'groom', ts: T0 });
    await finishRun(t, { ...base, ...shared, ts: T0 + H, cum_tokens: 1000 }, output('STATUS: groomed'));
    await startRun(t, { ...base, ...shared, agent: 'architect', ts: T0 + 2 * H });
    await finishRun(t, { ...base, ...shared, ts: T0 + 3 * H, cum_tokens: 2500 }, output('STATUS: designed'));
    expect(runs().map((r) => r.tokens)).toEqual([1000, 1500]);
  });

  it('a per-subagent transcript charges the full sum', async () => {
    await startRun(t, { ...base, agent: 'groom', ts: T0 });
    await finishRun(t, { ...base, ts: T0 + H, transcript_path: '/tmp/agent-a.jsonl', cum_tokens: 4200 }, output('STATUS: groomed'));
    await startRun(t, { ...base, agent: 'architect', ts: T0 + 2 * H });
    await finishRun(t, { ...base, ts: T0 + 3 * H, transcript_path: '/tmp/agent-b.jsonl', cum_tokens: 800 }, output('STATUS: designed'));
    expect(runs().map((r) => r.tokens)).toEqual([4200, 800]);
  });

  it('clamps the delta at zero and stores NULL when no counter arrives', async () => {
    const shared = { session_id: 'S1', transcript_path: '/tmp/shared.jsonl' };
    await startRun(t, { ...base, ...shared, agent: 'groom', ts: T0 });
    await finishRun(t, { ...base, ...shared, ts: T0 + H, cum_tokens: 1000 }, output('STATUS: groomed'));
    await startRun(t, { ...base, ...shared, agent: 'architect', ts: T0 + 2 * H });
    await finishRun(t, { ...base, ...shared, ts: T0 + 3 * H, cum_tokens: 900 }, output('STATUS: designed'));
    await startRun(t, { ...base, ...shared, agent: 'implementer', ts: T0 + 4 * H });
    await finishRun(t, { ...base, ...shared, ts: T0 + 5 * H }, output('STATUS: ready-for-validation'));
    expect(runs().map((r) => r.tokens)).toEqual([1000, 0, null]);
  });

  it('the tool payload\'s own usage wins over the delta', async () => {
    await startRun(t, { ...base, agent: 'groom', ts: T0 });
    await finishRun(t, { ...base, ts: T0 + H, cum_tokens: 9999 }, { tool_response: { content: [{ type: 'text', text: 'STATUS: groomed' }], usage: { input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 3, cache_read_input_tokens: 4 } } });
    expect(runs()[0]!.tokens).toBe(10);
  });
});

// T-INT-7, T-INT-8, T-INT-9
describe('validation, authorization, limits and verbs', () => {
  it('answers 400 to a missing or broken meta and stores nothing', async () => {
    for (const rawMeta of ['', 'not base64 json', Buffer.from('[1]').toString('base64'), Buffer.from('{"v":2}').toString('base64')]) {
      const res = await request(t.app).post('/api/hook/run-start').set('Content-Type', 'text/plain').set('X-Factory-Meta', rawMeta).send('{}');
      expect(res.status).toBe(400);
    }
    expect(rows(t, 'SELECT count(*) AS n FROM repository')).toEqual([{ n: 0 }]);
  });

  it.each([
    ['event', { event: undefined }],
    ['ts', { ts: 'yesterday' }],
    ['project', { project: '' }],
    ['ticket', { ticket: '' }],
  ])('answers 400 when the mandatory %s is missing', async (_name, override) => {
    const meta = { v: 1, event: 'run-start', ts: T0, project: REPO_A, ticket: '001', agent: 'groom', ...override };
    const res = await post(t, { path: '/api/hook/run-start', meta: {} as never, rawMeta: Buffer.from(JSON.stringify(meta)).toString('base64') });
    expect(res.status).toBe(400);
  });

  it('answers 400 for run-start without an agent, for an unknown agent, and for an intervention without text', async () => {
    expect((await post(t, { path: '/api/hook/run-start', meta: { event: 'run-start', ticket: '001', ts: T0 } })).status).toBe(400);
    expect((await post(t, { path: '/api/hook/run-start', meta: { event: 'run-start', ticket: '001', ts: T0, agent: 'wizard' } })).status).toBe(400);
    expect((await post(t, { path: '/api/intervention', meta: { event: 'intervention', ticket: '001', ts: T0 } })).status).toBe(400);
  });

  it('answers 400 when the body of a hook report is not a JSON payload', async () => {
    const res = await post(t, { path: '/api/hook/run-finish', meta: { event: 'run-finish', ticket: '001', ts: T0 }, body: 'not json' });
    expect(res.status).toBe(400);
  });

  it('answers 400 when the meta event does not belong to the endpoint', async () => {
    const res = await post(t, { path: '/api/hook/run-start', meta: { event: 'intervention', ticket: '001', ts: T0, what: 'x' } });
    expect(res.status).toBe(400);
  });

  it('answers 401 without or with a wrong token when one is set, and stores nothing', async () => {
    const secured = makeApp({ FACTORY_INGEST_TOKEN: 'sesame' });
    try {
      const meta = { event: 'run-start', ticket: '001', ts: T0, agent: 'groom' };
      expect((await post(secured, { path: '/api/hook/run-start', meta })).status).toBe(401);
      expect((await post(secured, { path: '/api/hook/run-start', meta, token: 'nope' })).status).toBe(401);
      expect(secured.db.prepare('SELECT count(*) AS n FROM repository').get()).toEqual({ n: 0 });
      expect((await post(secured, { path: '/api/hook/run-start', meta, token: 'sesame' })).status).toBe(204);
      expect(secured.db.prepare('SELECT count(*) AS n FROM run').get()).toEqual({ n: 1 });
      expect((await request(secured.app).get('/healthz')).status).toBe(200); // healthz never needs a token
    } finally {
      secured.close();
    }
  });

  it('ignores the Authorization header when no token is configured', async () => {
    const res = await post(t, { path: '/api/hook/run-start', meta: { event: 'run-start', ticket: '001', ts: T0, agent: 'groom' }, token: 'whatever' });
    expect(res.status).toBe(204);
  });

  it('answers 413 to a body over 2 MiB and drops it', async () => {
    const res = await post(t, { path: '/api/hook/run-finish', meta: { event: 'run-finish', ticket: '001', ts: T0 }, body: 'x'.repeat(2 * 1024 * 1024 + 10) });
    expect(res.status).toBe(413);
    expect(rows(t, 'SELECT count(*) AS n FROM run')).toEqual([{ n: 0 }]);
    expect(t.logs.find((l) => l['event'] === 'report_drop')).toMatchObject({ status: 413 });
  });

  it('T-INT-9: the browser can only GET; every write route answers 404 to anything else', async () => {
    for (const path of ['/', '/ticket/001', '/ticket/p/001', '/healthz', '/assets/app.css', '/api/intervention']) {
      for (const verb of ['put', 'delete', 'patch'] as const) {
        expect((await request(t.app)[verb](path)).status, `${verb} ${path}`).toBe(404);
      }
    }
    for (const path of ['/', '/ticket/001', '/ticket/p/001', '/healthz']) {
      expect((await request(t.app).post(path)).status, `post ${path}`).toBe(404);
    }
  });

  it('does not accept a GET on the ingest endpoints', async () => {
    expect((await request(t.app).get('/api/hook/run-start')).status).toBe(404);
    expect((await request(t.app).get('/api/intervention')).status).toBe(404);
  });
});

// T-INT-4 (also the repository half of R3)
describe('the repository table (R3, ADR-0007)', () => {
  it('every ingest call upserts the repository first, even a dropped one, and logs the first sight', async () => {
    await finishRun(t, { ...base, ts: T0 }, output('STATUS: x')); // dropped
    expect(rows(t, 'SELECT project_key, first_seen_at, last_seen_at FROM repository')).toEqual([{ project_key: REPO_A, first_seen_at: T0, last_seen_at: T0 }]);
    await intervene(t, { ...base, ts: T0 + H, what: 'hello', project: REPO_B });
    expect(rows(t, 'SELECT count(*) AS n FROM repository')).toEqual([{ n: 2 }]);
    const seen = t.logs.filter((l) => l['event'] === 'repository_first_seen');
    expect(seen).toMatchObject([{ project: REPO_A, repositories: 1 }, { project: REPO_B, repositories: 2 }]);
  });

  it('keeps first_seen_at as the minimum and last_seen_at as the maximum', async () => {
    await startRun(t, { ...base, agent: 'groom', ts: T0 + DAY });
    await startRun(t, { ...base, session_id: 'S2', agent: 'groom', ts: T0 });
    await startRun(t, { ...base, session_id: 'S3', agent: 'groom', ts: T0 + 2 * DAY });
    expect(rows(t, 'SELECT first_seen_at, last_seen_at FROM repository')).toEqual([{ first_seen_at: T0, last_seen_at: T0 + 2 * DAY }]);
  });

  it('a report rejected for a bad token or meta does not count as having heard from the repository', async () => {
    const secured = makeApp({ FACTORY_INGEST_TOKEN: 'x' });
    try {
      await post(secured, { path: '/api/hook/run-start', meta: { event: 'run-start', ticket: '001', ts: T0, agent: 'groom' } });
      await request(secured.app).post('/api/hook/run-start').set('Authorization', 'Bearer x').set('X-Factory-Meta', 'bad').send('{}');
      expect(secured.db.prepare('SELECT count(*) AS n FROM repository').get()).toEqual({ n: 0 });
    } finally {
      secured.close();
    }
  });
});

// T-CFG-2
describe('two repositories, one ticket number (R3, S1.6)', () => {
  it('two project keys reporting a 001 make two tickets with two separate histories', async () => {
    await reportRun(t, { ticket: '001', agent: 'groom', startedAt: T0, endedAt: T0 + H, project: REPO_A, title: 'Factory ticket' });
    await reportRun(t, { ticket: '001', agent: 'groom', startedAt: T0 + 2 * H, endedAt: T0 + 3 * H, project: REPO_B, title: 'Shop ticket' });
    expect(rows(t, 'SELECT project_key, number, title FROM ticket ORDER BY project_key')).toEqual([
      { project_key: REPO_A, number: '001', title: 'Factory ticket' },
      { project_key: REPO_B, number: '001', title: 'Shop ticket' },
    ]);
    expect(rows(t, 'SELECT project_key, count(*) AS n FROM run GROUP BY project_key ORDER BY project_key')).toEqual([
      { project_key: REPO_A, n: 1 },
      { project_key: REPO_B, n: 1 },
    ]);
  });

  it('a finish is matched only within its own repository', async () => {
    await startRun(t, { ...base, project: REPO_A, agent: 'groom', ts: T0, session_id: 'A' });
    const res = await finishRun(t, { ...base, project: REPO_B, ts: T0 + H, session_id: 'A' }, output('STATUS: groomed'));
    expect(res.status).toBe(204);
    expect(runs()).toMatchObject([{ ended_at: null }]);
  });
});

// T-DRV-1 (dashboard half), T-DRV-3, T-DRV-4, T-DRV-5
describe('a driver that is not the coordinator (R13)', () => {
  it('T-DRV-1: a main-session start and Stop finish produce one run with agent, output, tokens and result', async () => {
    const meta = { ...base, session_id: 'S-main', source: 'session-hook', origin: 'main' };
    await post(t, { path: '/api/hook/run-start', meta: { ...meta, event: 'run-start', agent: 'architect', ts: T0, driver: 'capture' }, body: fixture('user-prompt-submit-driver.json') });
    const stop = fixture('stop-main.json');
    const tail = readFileSync(new URL('./fixtures/hooks/main-session.transcript.jsonl', import.meta.url), 'utf8');
    const res = await post(t, { path: '/api/hook/run-finish', meta: { ...meta, event: 'run-finish', ts: T0 + 90_000, cum_tokens: 5000, transcript_path: '/tmp/main.jsonl' }, body: `${stop}\n---8<---\n${tail}` });
    expect(res.status).toBe(204);
    expect(runs()).toMatchObject([
      { actor: 'architect', source: 'session-hook', result: 'designed', agent_status: 'designed', output: 'STATUS: designed\nSUMMARY: capture main session', summary: 'capture main session', tokens: 5000, ended_at: T0 + 90_000 },
    ]);
  });

  it('T-DRV-1: a main-session finish reads the last non-sidechain message from the transcript when the payload has none', async () => {
    const meta = { ...base, session_id: 'S-main', source: 'session-hook', origin: 'main' };
    await post(t, { path: '/api/hook/run-start', meta: { ...meta, event: 'run-start', agent: 'architect', ts: T0 }, body: '{}' });
    const stop = JSON.parse(fixture('stop-main.json')) as Record<string, unknown>;
    delete stop['last_assistant_message'];
    const tail = readFileSync(new URL('./fixtures/hooks/main-session.transcript.jsonl', import.meta.url), 'utf8');
    await post(t, { path: '/api/hook/run-finish', meta: { ...meta, event: 'run-finish', ts: T0 + H }, body: `${JSON.stringify(stop)}\n---8<---\n${tail}` });
    expect(runs()).toMatchObject([{ result: 'designed', output: 'STATUS: designed\nSUMMARY: capture main session' }]);
  });

  it('T-DRV-3: run-start, run-finish and intervention from a plain shell make a complete ticket history', async () => {
    const cli = { ticket: '003', title: 'Driven by a script', source: 'cli' };
    expect((await post(t, { path: '/api/hook/run-start', meta: { ...cli, event: 'run-start', agent: 'groom', ts: T0, req_status: 'In grooming' } })).status).toBe(204);
    expect((await post(t, { path: '/api/hook/run-finish', meta: { ...cli, event: 'run-finish', ts: T0 + H, result: 'groomed', req_status: 'Groomed – ready for architecture' }, body: 'STATUS: groomed\nSUMMARY: done' })).status).toBe(204);
    expect((await intervene(t, { ...cli, ts: T0 + 2 * H, what: 'answered the open question on R3' })).status).toBe(204);
    expect(runs()).toMatchObject([
      { actor: 'groom', result: 'groomed', output: 'STATUS: groomed\nSUMMARY: done', source: 'cli' },
      { actor: 'human', result: 'intervention', output: 'answered the open question on R3', tokens: 0, started_at: T0 + 2 * H, ended_at: T0 + 2 * H },
    ]);
    expect(rows(t, 'SELECT status FROM ticket_status_event ORDER BY id')).toEqual([{ status: 'In grooming' }, { status: 'Groomed – ready for architecture' }]);
  });

  it('T-DRV-3: a cli finish without a session matches the newest open run of that agent', async () => {
    const cli = { ticket: '003', source: 'cli' };
    await post(t, { path: '/api/hook/run-start', meta: { ...cli, event: 'run-start', agent: 'architect', ts: T0 } });
    await post(t, { path: '/api/hook/run-start', meta: { ...cli, event: 'run-start', agent: 'implementer', ts: T0 + 1 } });
    await post(t, { path: '/api/hook/run-finish', meta: { ...cli, event: 'run-finish', agent: 'architect', ts: T0 + H, result: 'designed' }, body: 'x' });
    expect(runs().map((r) => [r.actor, r.result])).toEqual([['architect', 'designed'], ['implementer', null]]);
  });

  it('T-DRV-4: a prompt intervention keeps the prompt text verbatim', async () => {
    const what = 'Yes, go with option B.\n  Keep "quotes" and <tags> & unicode ✓ intact.';
    await intervene(t, { ...base, ts: T0, what, source: 'session-hook' });
    expect(runs()).toMatchObject([{ actor: 'human', output: what, summary: 'Yes, go with option B.', source: 'session-hook' }]);
  });

  it('T-DRV-4: an explicit cli intervention 30 s later keeps one row and its text (the cli text wins)', async () => {
    await intervene(t, { ...base, ts: T0, what: 'yes carry on', source: 'session-hook' });
    await intervene(t, { ...base, ts: T0 + 30_000, what: 'answered the open question on R3', source: 'cli' });
    expect(runs()).toMatchObject([{ actor: 'human', output: 'answered the open question on R3', source: 'cli', started_at: T0 }]);
    expect(t.logs.find((l) => l['event'] === 'intervention_merged')).toBeTruthy();
  });

  it('T-DRV-4: the raw prompt never replaces a driver\'s description, whichever arrives first', async () => {
    await intervene(t, { ...base, ts: T0, what: 'answered the open question on R3', source: 'cli' });
    await intervene(t, { ...base, ts: T0 + 30_000, what: 'yes carry on', source: 'session-hook' });
    expect(runs()).toMatchObject([{ output: 'answered the open question on R3', source: 'cli' }]);
  });

  it('T-DRV-4: the same delivery twice keeps one row', async () => {
    await intervene(t, { ...base, ts: T0, what: 'same', source: 'session-hook' });
    await intervene(t, { ...base, ts: T0 + 500, what: 'same', source: 'session-hook' });
    expect(runs()).toHaveLength(1);
  });

  it('T-DRV-4: interventions further apart than 120 s are separate acts', async () => {
    await intervene(t, { ...base, ts: T0, what: 'first', source: 'session-hook' });
    await intervene(t, { ...base, ts: T0 + 120_001, what: 'second', source: 'session-hook' });
    expect(runs()).toHaveLength(2);
  });

  it('T-DRV-4: an intervention creates the ticket and the repository when needed and counts as activity', async () => {
    await intervene(t, { ticket: '009', ts: T0, what: 'hi', project: REPO_B });
    expect(rows(t, 'SELECT project_key, number, title, last_activity_at FROM ticket')).toEqual([{ project_key: REPO_B, number: '009', title: '009', last_activity_at: T0 }]);
  });

  it('T-DRV-5: SessionEnd closes an open driven run as interrupted, and it leaves "agents online"', async () => {
    const meta = { ...base, session_id: 'S-main', source: 'session-hook', origin: 'main' };
    await post(t, { path: '/api/hook/run-start', meta: { ...meta, event: 'run-start', agent: 'architect', ts: T0 }, body: '{}' });
    expect(t.db.prepare(`SELECT count(*) AS n FROM run WHERE ended_at IS NULL AND result IS NULL`).get()).toEqual({ n: 1 });
    const res = await post(t, { path: '/api/hook/run-finish', meta: { ...meta, event: 'session-end', ts: T0 + H }, body: fixture('session-end.json') });
    expect(res.status).toBe(204);
    expect(runs()).toMatchObject([{ result: 'interrupted', ended_at: T0 + H, output: null }]);
    expect(t.db.prepare(`SELECT count(*) AS n FROM run WHERE ended_at IS NULL AND result IS NULL`).get()).toEqual({ n: 0 });
  });

  it('T-DRV-5: a SessionEnd after a normal Stop changes nothing', async () => {
    const meta = { ...base, session_id: 'S-main', source: 'session-hook', origin: 'main' };
    await post(t, { path: '/api/hook/run-start', meta: { ...meta, event: 'run-start', agent: 'architect', ts: T0 }, body: '{}' });
    await post(t, { path: '/api/hook/run-finish', meta: { ...meta, event: 'run-finish', ts: T0 + H }, body: fixture('stop-main.json') });
    const before = runs();
    const res = await post(t, { path: '/api/hook/run-finish', meta: { ...meta, event: 'session-end', ts: T0 + 2 * H }, body: fixture('session-end.json') });
    expect(res.status).toBe(204);
    expect(runs()).toEqual(before);
  });

  it('a late finish for a run the sweeper had abandoned closes it for real', async () => {
    await startRun(t, { ...base, agent: 'architect', ts: T0 });
    t.db.prepare(`UPDATE run SET result = 'abandoned'`).run();
    await finishRun(t, { ...base, ts: T0 + 20 * H }, output('STATUS: designed'));
    expect(runs()).toMatchObject([{ result: 'designed', ended_at: T0 + 20 * H }]);
  });
});

describe('the X-Factory-Meta header format', () => {
  it('accepts exactly what the design shows', async () => {
    const meta = {
      v: 1, event: 'run-start', ts: 1758367200000, project: 'github.com/vkuras/factory', repo_path: '/home/pi/IdeaProjects/factory',
      ticket: '001', title: 'Agent Factory Dashboard', slug: 'agent-factory-dashboard', req_status: 'Groomed – ready for architecture',
      agent: 'architect', source: 'subagent-hook', origin: 'subagent', driver: 'coordinate', session_id: '1c0f', tool_use_id: 'toolu_01',
      transcript_path: '/home/pi/.claude/projects/x/1c0f.jsonl', cum_tokens: 4821334, result: null, what: '…',
    };
    const res = await request(t.app).post('/api/hook/run-start').set('X-Factory-Meta', metaHeader(meta as never)).send('{}');
    expect(res.status).toBe(204);
  });

  it('logs the driver of a dropped report so a broken wiring can be traced', async () => {
    await finishRun(t, { ...base, ts: T0, driver: 'coordinate' }, output('STATUS: x'));
    expect(t.logs.find((l) => l['event'] === 'report_drop')).toMatchObject({ driver: 'coordinate', source: 'subagent-hook' });
  });
});
