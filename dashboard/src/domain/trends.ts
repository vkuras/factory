// R8: weekly buckets, the four trends, delta and improvement, naming the period.
// Pure: runs and tickets in, `now` and the zone as arguments.

import {
  MS_PER_HOUR,
  localDayNumber,
  mondayOf,
  weekLabel,
} from './format.js';
import { inOrder } from './metrics.js';
import { ticketKey, type RunLite, type TicketRecord } from './types.js';

export const WINDOW_WEEKS = 26;

export interface Bar {
  label: string;
  value: number | null;
  /** Formatted value, or "no data". */
  text: string;
  heightPx: number | null;
  fill: string;
  /** Only the last bar prints its value above the bar. */
  showValue: boolean;
  /** Only the first, the middle and the last bucket print their week label. */
  showLabel: boolean;
  title: string;
}

export interface TrendCard {
  label: string;
  color: string;
  deltaText: string;
  deltaColor: string;
  improvement: 'better' | 'worse' | 'unchanged' | null;
  period: string;
  weeks: number;
  bars: Bar[];
}

export interface Week {
  monday: number;
  label: string;
}

/** The rendered buckets: from `max(windowStart, dataStart)` to the current week, 1 to 26 of them. */
export function weekBuckets(runs: readonly RunLite[], now: number, tz: string): Week[] {
  const current = mondayOf(localDayNumber(now, tz));
  const windowStart = current - 7 * (WINDOW_WEEKS - 1);
  let dataStart = current;
  for (const r of runs) {
    const monday = mondayOf(localDayNumber(r.startedAt, tz));
    if (monday < dataStart) dataStart = monday;
  }
  const first = Math.max(windowStart, dataStart);
  const weeks: Week[] = [];
  for (let m = first; m <= current; m += 7) weeks.push({ monday: m, label: weekLabel(m) });
  return weeks;
}

export interface Series {
  key: 'interventions' | 'loops' | 'lead' | 'compute';
  values: (number | null)[];
}

/** The four series over the given buckets (design, R8 table). */
export function computeSeries(
  runs: readonly RunLite[],
  tickets: readonly TicketRecord[],
  weeks: readonly Week[],
  tz: string,
): Series[] {
  const n = weeks.length;
  const first = weeks[0]!.monday;
  const indexOf = (ts: number): number => {
    const monday = mondayOf(localDayNumber(ts, tz));
    return Math.round((monday - first) / 7);
  };

  const active: Set<string>[] = weeks.map(() => new Set());
  const humanCalls = new Array<number>(n).fill(0);
  const loopRuns = new Array<number>(n).fill(0);
  const computeHours = new Array<number>(n).fill(0);

  const byTicket = new Map<string, RunLite[]>();
  for (const r of runs) {
    const key = ticketKey(r.projectKey, r.number);
    const list = byTicket.get(key);
    if (list) list.push(r);
    else byTicket.set(key, [r]);
  }

  for (const [key, list] of byTicket) {
    const seen = new Set<string>();
    for (const r of inOrder(list)) {
      const i = indexOf(r.startedAt);
      const isLoop = r.actor !== 'human' && seen.has(r.actor);
      if (r.actor !== 'human') seen.add(r.actor);
      if (i < 0 || i >= n) continue;
      active[i]!.add(key);
      if (r.actor === 'human') humanCalls[i]! += 1;
      if (isLoop) loopRuns[i]! += 1;
      if (r.actor !== 'human' && r.endedAt !== null) {
        computeHours[i]! += (r.endedAt - r.startedAt) / MS_PER_HOUR;
      }
    }
  }

  const leadSum = new Array<number>(n).fill(0);
  const leadCount = new Array<number>(n).fill(0);
  for (const t of tickets) {
    if (t.validatedAt === null) continue;
    const i = indexOf(t.validatedAt);
    if (i < 0 || i >= n) continue;
    leadSum[i]! += (t.validatedAt - t.firstSeenAt) / MS_PER_HOUR;
    leadCount[i]! += 1;
  }

  const perActive = (values: number[]): number[] =>
    values.map((v, i) => (active[i]!.size === 0 ? 0 : v / active[i]!.size));

  return [
    { key: 'interventions', values: perActive(humanCalls) },
    { key: 'loops', values: perActive(loopRuns) },
    { key: 'lead', values: leadSum.map((s, i) => (leadCount[i] === 0 ? null : s / leadCount[i]!)) },
    { key: 'compute', values: perActive(computeHours) },
  ];
}

export interface Delta {
  text: string;
  color: string;
  improvement: 'better' | 'worse' | 'unchanged' | null;
}

const MUTED = '#6E7887';
const BETTER = '#9EE84B';
const WORSE = '#FF6B6B';

function whole(d: number): string {
  const text = d.toFixed(0);
  return text === '-0' ? '0' : text;
}

/** First vs last bucket with a value, S5.2. Every series is better when lower. */
export function deltaOf(values: readonly (number | null)[], labels: readonly string[]): Delta {
  let firstIdx = -1;
  let lastIdx = -1;
  values.forEach((v, i) => {
    if (v !== null) {
      if (firstIdx === -1) firstIdx = i;
      lastIdx = i;
    }
  });
  const none: Delta = { text: 'no comparison yet', color: MUTED, improvement: null };
  if (firstIdx === -1 || firstIdx === lastIdx) return none;
  const first = values[firstIdx]!;
  const last = values[lastIdx]!;
  if (first === 0) return none;
  const d = ((last - first) / first) * 100;
  const label = labels[firstIdx]!;
  if (d < 0) return { text: `${whole(d)}% vs ${label} · better`, color: BETTER, improvement: 'better' };
  if (d > 0) return { text: `+${whole(d)}% vs ${label} · worse`, color: WORSE, improvement: 'worse' };
  return { text: `0% vs ${label} · unchanged`, color: MUTED, improvement: 'unchanged' };
}

export function periodLine(weeks: readonly Week[]): string {
  const n = weeks.length;
  return `${weeks[0]!.label} – ${weeks[n - 1]!.label} · ${n} ${n === 1 ? 'week' : 'weeks'} of data`;
}

interface CardDef {
  key: Series['key'];
  label: string;
  color: string;
  digits: number;
}

const CARDS: readonly CardDef[] = [
  { key: 'interventions', label: 'Human calls / ticket', color: '#FF7AB6', digits: 1 },
  { key: 'loops', label: 'Loops / ticket', color: '#F5A524', digits: 1 },
  { key: 'lead', label: 'Lead time (h)', color: '#5BC8F5', digits: 0 },
  { key: 'compute', label: 'Compute (h)', color: '#9EE84B', digits: 1 },
];

export function computeTrendCards(
  runs: readonly RunLite[],
  tickets: readonly TicketRecord[],
  now: number,
  tz: string,
): TrendCard[] {
  const weeks = weekBuckets(runs, now, tz);
  const series = computeSeries(runs, tickets, weeks, tz);
  const labels = weeks.map((w) => w.label);
  const last = weeks.length - 1;
  const middle = Math.floor(last / 2);

  return CARDS.map((def) => {
    const values = series.find((s) => s.key === def.key)!.values;
    const max = Math.max(0, ...values.filter((v): v is number => v !== null));
    const delta = deltaOf(values, labels);
    const bars: Bar[] = values.map((v, i) => {
      const text = v === null ? 'no data' : v.toFixed(def.digits);
      return {
        label: labels[i]!,
        value: v,
        text,
        heightPx: v === null ? null : max <= 0 ? 6 : Math.max(6, Math.round((v / max) * 68)),
        fill: i === last ? def.color : def.color + '55',
        showValue: i === last && v !== null,
        showLabel: i === 0 || i === middle || i === last,
        title: `${labels[i]!} · ${text}`,
      };
    });
    return {
      label: def.label,
      color: def.color,
      deltaText: delta.text,
      deltaColor: delta.color,
      improvement: delta.improvement,
      period: periodLine(weeks),
      weeks: weeks.length,
      bars,
    };
  });
}
