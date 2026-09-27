// Per-ticket metrics (design, Ticket metrics). Pure: plain data in, `now` as an argument.

import { MS_PER_HOUR } from './format.js';
import type { Actor, RunLite, TicketRecord } from './types.js';

export interface AgentSpend {
  /** null when none of the agent's runs reported a token count (a failed Agent call has none). */
  tokens: number | null;
  timeHours: number;
}

export interface TicketMetrics {
  runs: number;
  loops: number;
  interventions: number;
  /** null when no run reported a token count: the UI shows "—" rather than 0. */
  tokens: number | null;
  workingTimeHours: number;
  leadTimeHours: number;
  idleHours: number;
  byAgent: Partial<Record<Actor, AgentSpend>>;
}

/** Runs ordered as the ticket lived them: by start, ties by the order given. */
export function inOrder<T extends { startedAt: number }>(runs: readonly T[]): T[] {
  return runs
    .map((run, index) => ({ run, index }))
    .sort((a, b) => a.run.startedAt - b.run.startedAt || a.index - b.index)
    .map((x) => x.run);
}

export function computeMetrics(
  ticket: TicketRecord,
  runs: readonly RunLite[],
  now: number,
): TicketMetrics {
  const work = runs.filter((r) => r.actor !== 'human');
  const perActor = new Map<Actor, number>();
  for (const r of work) perActor.set(r.actor, (perActor.get(r.actor) ?? 0) + 1);
  let loops = 0;
  for (const n of perActor.values()) loops += Math.max(0, n - 1);

  let tokens: number | null = null;
  let workingMs = 0;
  const byAgent: Partial<Record<Actor, AgentSpend>> = {};
  for (const r of work) {
    const spend = (byAgent[r.actor] ??= { tokens: null, timeHours: 0 });
    if (r.tokens !== null) {
      tokens = (tokens ?? 0) + r.tokens;
      spend.tokens = (spend.tokens ?? 0) + r.tokens;
    }
    if (r.endedAt !== null) {
      workingMs += r.endedAt - r.startedAt;
      spend.timeHours += (r.endedAt - r.startedAt) / MS_PER_HOUR;
    }
  }

  return {
    runs: work.length,
    loops,
    interventions: runs.length - work.length,
    tokens,
    workingTimeHours: workingMs / MS_PER_HOUR,
    leadTimeHours: ((ticket.validatedAt ?? now) - ticket.firstSeenAt) / MS_PER_HOUR,
    idleHours: (now - ticket.lastActivityAt) / MS_PER_HOUR,
    byAgent,
  };
}
