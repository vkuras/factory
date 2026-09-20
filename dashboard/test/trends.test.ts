import { describe, expect, it } from 'vitest';
import { computeSeries, computeTrendCards, deltaOf, periodLine, weekBuckets } from '../src/domain/trends.js';
import type { Actor, RunLite, TicketRecord } from '../src/domain/types.js';

const H = 3_600_000;
const DAY = 24 * H;
const TZ = 'Europe/Berlin';
// Sunday 2026-09-20 noon UTC: ISO week 38, whose Monday is 2026-09-14.
const NOW = Date.UTC(2026, 8, 20, 12, 0, 0);
const MONDAY_W38 = Date.UTC(2026, 8, 14, 10, 0, 0);
const weekStart = (weeksAgo: number): number => MONDAY_W38 - weeksAgo * 7 * DAY;

let n = 0;
const run = (
  number: string,
  actor: Actor,
  startedAt: number,
  durationH = 1,
  over: Partial<RunLite> = {},
): RunLite => ({
  id: `r${n++}`,
  projectKey: 'p',
  number,
  actor,
  startedAt,
  endedAt: actor === 'human' ? startedAt : startedAt + durationH * H,
  result: null,
  agentStatus: null,
  tokens: 1,
  ...over,
});

const ticket = (number: string, firstSeenAt: number, validatedAt: number | null = null): TicketRecord => ({
  projectKey: 'p',
  number,
  title: `t${number}`,
  slug: null,
  requirementsStatus: null,
  agentStatus: null,
  firstSeenAt,
  lastActivityAt: firstSeenAt,
  validatedAt,
});

// T-UNIT-TRD-1: bucketing.
describe('weekly buckets (R8, D4)', () => {
  it('covers 26 weeks when history is older than the window', () => {
    const weeks = weekBuckets([run('001', 'groom', weekStart(40))], NOW, TZ);
    expect(weeks).toHaveLength(26);
    expect(weeks[0]!.label).toBe('w13');
    expect(weeks[25]!.label).toBe('w38');
  });

  it('starts at the first week that has data', () => {
    const weeks = weekBuckets([run('001', 'groom', weekStart(2))], NOW, TZ);
    expect(weeks.map((w) => w.label)).toEqual(['w36', 'w37', 'w38']);
  });

  it('is one bucket for history in the current week, and for no history at all', () => {
    expect(weekBuckets([run('001', 'groom', weekStart(0))], NOW, TZ)).toHaveLength(1);
    expect(weekBuckets([], NOW, TZ)).toHaveLength(1);
  });

  it('puts a run into the bucket of its start in the display zone', () => {
    // Sunday 23:30 UTC is already Monday in Berlin: it belongs to the week that starts on that Monday.
    const sundayLate = Date.UTC(2026, 8, 13, 23, 30);
    const weeks = weekBuckets([run('001', 'groom', sundayLate)], NOW, TZ);
    expect(weeks.map((w) => w.label)).toEqual(['w38']);
    const utcWeeks = weekBuckets([run('001', 'groom', sundayLate)], NOW, 'UTC');
    expect(utcWeeks.map((w) => w.label)).toEqual(['w37', 'w38']);
  });
});

// T-UNIT-TRD-2: the four series.
describe('the four series', () => {
  // Two weeks: w37 and w38.
  const runs: RunLite[] = [
    // ticket 001, w37: groom, architect, then a second groom run (a loop) and a human call
    run('001', 'groom', weekStart(1), 2),
    run('001', 'architect', weekStart(1) + H, 1),
    run('001', 'groom', weekStart(1) + 3 * H, 1),
    run('001', 'human', weekStart(1) + 4 * H),
    // ticket 002, w37: groom only
    run('002', 'groom', weekStart(1) + DAY, 1),
    // ticket 001, w38: architect again (loop), implementer, plus two human calls
    run('001', 'architect', weekStart(0), 2),
    run('001', 'implementer', weekStart(0) + 3 * H, 3),
    run('001', 'human', weekStart(0) + 5 * H),
    run('001', 'human', weekStart(0) + 6 * H),
  ];
  const tickets = [ticket('001', weekStart(1), weekStart(0) + 2 * DAY), ticket('002', weekStart(1) + DAY)];
  const weeks = weekBuckets(runs, NOW, TZ);
  const series = Object.fromEntries(computeSeries(runs, tickets, weeks, TZ).map((s) => [s.key, s.values]));

  it('has the two rendered weeks', () => {
    expect(weeks.map((w) => w.label)).toEqual(['w37', 'w38']);
  });

  it('human calls per active ticket', () => {
    expect(series['interventions']).toEqual([1 / 2, 2 / 1]);
  });

  it('loops per active ticket: a loop run is not the first of its actor over the ticket life', () => {
    // w37: 001 groom #2 is a loop -> 1 loop over 2 active tickets; w38: 001 architect #2 -> 1 over 1
    expect(series['loops']).toEqual([1 / 2, 1]);
  });

  it('lead time: mean over the tickets validated in the week, null otherwise', () => {
    expect(series['lead']![0]).toBeNull();
    expect(series['lead']![1]).toBeCloseTo((DAY * 2 + 0 * H + 7 * DAY) / H, 5); // validated 2 days into w38, first seen 7 days earlier
  });

  it('compute hours per active ticket, humans excluded, unfinished runs skipped', () => {
    // w37: (2 + 1 + 1 + 1) h over 2 tickets; w38: (2 + 3) h over 1 ticket
    expect(series['compute']).toEqual([5 / 2, 5]);
  });

  it('is 0, not NaN, for a week nobody worked in', () => {
    const gap = [run('001', 'groom', weekStart(2)), run('001', 'architect', weekStart(0))];
    const w = weekBuckets(gap, NOW, TZ);
    const s = Object.fromEntries(computeSeries(gap, [ticket('001', weekStart(2))], w, TZ).map((x) => [x.key, x.values]));
    expect(s['interventions']![1]).toBe(0);
    expect(s['compute']![1]).toBe(0);
  });
});

// T-UNIT-TRD-3: delta and the three improvement words.
describe('delta and improvement (S5.2)', () => {
  const labels = ['w36', 'w37', 'w38'];
  it('lower is better', () => {
    expect(deltaOf([2, 1.5, 1], labels)).toEqual({ text: '-50% vs w36 · better', color: '#9EE84B', improvement: 'better' });
  });
  it('higher is worse', () => {
    expect(deltaOf([1, 1.5, 2], labels)).toEqual({ text: '+100% vs w36 · worse', color: '#FF6B6B', improvement: 'worse' });
  });
  it('the same is unchanged', () => {
    expect(deltaOf([2, 5, 2], labels)).toEqual({ text: '0% vs w36 · unchanged', color: '#6E7887', improvement: 'unchanged' });
  });
  it('compares the first and the last week that have a value', () => {
    expect(deltaOf([null, 4, null], labels).text).toBe('no comparison yet');
    expect(deltaOf([null, 4, 2], labels).text).toBe('-50% vs w37 · better');
  });
  it('has no comparison for a single bucket, an empty series or a zero start', () => {
    expect(deltaOf([3], ['w38'])).toMatchObject({ text: 'no comparison yet', color: '#6E7887', improvement: null });
    expect(deltaOf([null, null], ['w37', 'w38']).text).toBe('no comparison yet');
    expect(deltaOf([0, 2], ['w37', 'w38']).text).toBe('no comparison yet');
  });
  it('never prints a negative zero', () => {
    expect(deltaOf([1000, 999], ['w37', 'w38']).text).toBe('0% vs w37 · better');
  });
});

// T-UNIT-TRD-4: the period line.
describe('naming the period (S5.3)', () => {
  const buckets = (weeksAgo: number) =>
    weekBuckets([run('001', 'groom', weekStart(weeksAgo))], NOW, TZ);
  it('names 26 weeks', () => {
    expect(periodLine(buckets(40))).toBe('w13 – w38 · 26 weeks of data');
  });
  it('names 3 weeks', () => {
    expect(periodLine(buckets(2))).toBe('w36 – w38 · 3 weeks of data');
  });
  it('names 1 week', () => {
    expect(periodLine(buckets(0))).toBe('w38 – w38 · 1 week of data');
  });
});

describe('the cards', () => {
  const runs = [
    run('001', 'groom', weekStart(2), 4),
    run('001', 'human', weekStart(2) + H),
    run('001', 'groom', weekStart(0), 1),
  ];
  const cards = computeTrendCards(runs, [ticket('001', weekStart(2))], NOW, TZ);

  it('has the four design labels in order', () => {
    expect(cards.map((c) => c.label)).toEqual(['Human calls / ticket', 'Loops / ticket', 'Lead time (h)', 'Compute (h)']);
  });

  it('draws the last bar in the full colour and the others at 33% alpha', () => {
    const bars = cards[0]!.bars;
    expect(bars[bars.length - 1]!.fill).toBe('#FF7AB6');
    expect(bars[0]!.fill).toBe('#FF7AB655');
  });

  it('sizes bars as max(6, round(v / max * 68)) px and draws no bar for null', () => {
    const compute = cards[3]!.bars;
    expect(compute[0]!.heightPx).toBe(68); // 4 h is the maximum
    expect(compute[2]!.heightPx).toBe(17); // 1 h -> round(1/4*68)
    const lead = cards[2]!.bars;
    expect(lead.every((b) => b.heightPx === null)).toBe(true);
    expect(lead[0]!.text).toBe('no data');
  });

  it('prints the value on the last bar and week labels on first, middle and last only', () => {
    const bars = cards[0]!.bars;
    expect(bars.map((b) => b.showValue)).toEqual([false, false, true]);
    expect(bars.map((b) => b.showLabel)).toEqual([true, true, true]);
    const long = computeTrendCards([run('001', 'groom', weekStart(40))], [ticket('001', weekStart(40))], NOW, TZ);
    const shown = long[0]!.bars.filter((b) => b.showLabel).map((b) => b.label);
    expect(shown).toEqual(['w13', 'w25', 'w38']);
  });

  it('formats values: one decimal for calls, loops and compute, none for lead time', () => {
    expect(cards[0]!.bars[0]!.text).toBe('1.0');
    expect(cards[3]!.bars[0]!.text).toBe('4.0');
  });

  it('titles every bar with its week and value', () => {
    expect(cards[0]!.bars[0]!.title).toBe('w36 · 1.0');
  });
});
