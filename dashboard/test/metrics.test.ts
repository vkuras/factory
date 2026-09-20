import { describe, expect, it } from 'vitest';
import { computeMetrics } from '../src/domain/metrics.js';
import type { Actor, RunLite, TicketRecord } from '../src/domain/types.js';

const H = 3_600_000;

const ticket = (over: Partial<TicketRecord> = {}): TicketRecord => ({
  projectKey: 'github.com/vkuras/factory',
  number: '001',
  title: 'Dashboard',
  slug: null,
  requirementsStatus: null,
  agentStatus: null,
  firstSeenAt: 0,
  lastActivityAt: 0,
  validatedAt: null,
  ...over,
});

let n = 0;
const run = (actor: Actor, startH: number, durH: number | null, tokens: number | null, result: string | null = null): RunLite => ({
  id: `r${n++}`,
  projectKey: 'github.com/vkuras/factory',
  number: '001',
  actor,
  startedAt: startH * H,
  endedAt: durH === null ? null : (startH + durH) * H,
  result,
  agentStatus: null,
  tokens,
});

// T-UNIT-MET-1
describe('ticket metrics', () => {
  it('counts loops as every run of an agent beyond its first, humans excluded (D13)', () => {
    const runs = [
      run('groom', 0, 1, 10),
      run('architect', 2, 1, 10),
      run('implementer', 4, 1, 10),
      run('validator', 6, 1, 10),
      run('implementer', 8, 1, 10),
      run('validator', 10, 1, 10),
      run('implementer', 12, 1, 10),
      run('human', 5, 0, 0, 'intervention'),
      run('human', 7, 0, 0, 'intervention'),
    ];
    const m = computeMetrics(ticket(), runs, 20 * H);
    expect(m.loops).toBe(3); // implementer x3 -> 2, validator x2 -> 1
    expect(m.runs).toBe(7);
    expect(m.interventions).toBe(2);
  });

  it('skips NULL token counts instead of counting them as zero, and ignores human runs', () => {
    const runs = [run('groom', 0, 1, 1000), run('architect', 1, 1, null), run('human', 2, 0, 0)];
    const m = computeMetrics(ticket(), runs, 10 * H);
    expect(m.tokens).toBe(1000);
    expect(m.byAgent.architect).toEqual({ tokens: 0, timeHours: 1 });
  });

  it('reports unknown tokens when no run knows its count', () => {
    expect(computeMetrics(ticket(), [run('groom', 0, 1, null)], 5 * H).tokens).toBeNull();
    expect(computeMetrics(ticket(), [], 5 * H).tokens).toBeNull();
  });

  it('sums working time over finished agent runs only', () => {
    const runs = [run('groom', 0, 1.5, 1), run('implementer', 2, null, 1), run('human', 3, 0, 0)];
    expect(computeMetrics(ticket(), runs, 10 * H).workingTimeHours).toBe(1.5);
  });

  it('measures lead time to now, and freezes it at validated_at (assumption 12)', () => {
    const open = computeMetrics(ticket({ firstSeenAt: 2 * H }), [], 10 * H);
    expect(open.leadTimeHours).toBe(8);
    const validated = computeMetrics(ticket({ firstSeenAt: 2 * H, validatedAt: 6 * H }), [], 100 * H);
    expect(validated.leadTimeHours).toBe(4);
  });

  it('measures idle time from the last activity', () => {
    expect(computeMetrics(ticket({ lastActivityAt: 7 * H }), [], 10 * H).idleHours).toBe(3);
  });

  it('splits tokens and time per agent for the spend bars', () => {
    const runs = [run('groom', 0, 1, 100), run('groom', 2, 2, 50), run('validator', 5, 1, 10)];
    const m = computeMetrics(ticket(), runs, 10 * H);
    expect(m.byAgent.groom).toEqual({ tokens: 150, timeHours: 3 });
    expect(m.byAgent.validator).toEqual({ tokens: 10, timeHours: 1 });
    expect(m.byAgent.implementer).toBeUndefined();
  });
});
