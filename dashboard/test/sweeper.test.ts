import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createQueries } from '../src/db/queries.js';
import { sweepOnce } from '../src/jobs/sweeper.js';
import { H, T0, makeApp, startRun, reportRun, type TestApp } from './helpers.js';

let t: TestApp;
beforeEach(() => {
  t = makeApp();
});
afterEach(() => t.close());

const results = (): (string | null)[] =>
  t.db.prepare<{ result: string | null }>('SELECT result FROM run ORDER BY started_at').all().map((r) => r.result);

describe('the abandoned-run sweeper (design, Jobs)', () => {
  it('marks open runs older than RUN_STALE_HOURS as abandoned and leaves ended_at NULL', async () => {
    await startRun(t, { ticket: '001', agent: 'groom', ts: T0 - 13 * H, session_id: 'old' });
    await startRun(t, { ticket: '002', agent: 'groom', ts: T0 - 11 * H, session_id: 'fresh' });
    await reportRun(t, { ticket: '003', agent: 'groom', startedAt: T0 - 40 * H, endedAt: T0 - 39 * H, text: 'STATUS: groomed' });
    const q = createQueries(t.db);
    expect(sweepOnce(q, T0, 12, () => {})).toBe(1);
    expect(results()).toEqual(['groomed', 'abandoned', null]);
    expect(t.db.prepare('SELECT ended_at FROM run WHERE result = ?').get('abandoned')).toEqual({ ended_at: null });
  });

  it('is idempotent: running it twice changes nothing', async () => {
    await startRun(t, { ticket: '001', agent: 'groom', ts: T0 - 20 * H, session_id: 'old' });
    const q = createQueries(t.db);
    expect(sweepOnce(q, T0, 12, () => {})).toBe(1);
    expect(sweepOnce(q, T0, 12, () => {})).toBe(0);
    expect(results()).toEqual(['abandoned']);
  });

  it('a missed run costs nothing: the next sweep catches every stale run', async () => {
    await startRun(t, { ticket: '001', agent: 'groom', ts: T0 - 5 * H, session_id: 'a' });
    await startRun(t, { ticket: '002', agent: 'groom', ts: T0 - 6 * H, session_id: 'b' });
    const q = createQueries(t.db);
    expect(sweepOnce(q, T0, 12, () => {})).toBe(0);
    expect(sweepOnce(q, T0 + 24 * H, 12, () => {})).toBe(2);
  });

  it('an abandoned run no longer counts as an agent online, and reports its sweep', async () => {
    await startRun(t, { ticket: '001', agent: 'groom', ts: T0 - 20 * H, session_id: 'old' });
    const logged: unknown[] = [];
    sweepOnce(createQueries(t.db), T0, 12, (_l, event, f) => logged.push([event, f]));
    expect(logged).toEqual([['sweep_done', { abandoned: 1 }]]);
    expect(createQueries(t.db).countOnline(T0 - 12 * H)).toBe(0);
  });
});
