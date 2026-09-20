// R1 (attention), R2 (stage of a ticket) and the R7 wording. Pure functions over plain data.

import { fmtH } from './format.js';
import { AG, FAILURE_COLOR, UNKNOWN_COLOR, type Stage } from './palette.js';
import type { Actor, Agent, RunLite } from './types.js';

export type Severity = 'blocking' | 'check' | 'review' | 'answer';

export interface Attention {
  reason: string;
  severity: Severity;
  color: string;
  /** The badge background: the colour at 12 % alpha, as in the design. */
  background: string;
  note: string;
  rank: number;
}

export interface AttentionInput {
  requirementsStatus: string | null;
  agentStatus: string | null;
  loops: number;
  idleHours: number;
  /** Any run has result `failed` or `blocked-environment` (design assumption 4). */
  failedRun: boolean;
}

export interface Thresholds {
  loop: number;
  idleHours: number;
}

const RANK: Record<Severity, number> = { blocking: 0, check: 1, review: 2, answer: 3 };

function attention(reason: string, severity: Severity, color: string, note: string): Attention {
  return { reason, severity, color, background: color + '1F', note, rank: RANK[severity] };
}

/** The first matching rule decides; null when the ticket needs nobody (R1). */
export function attentionOf(t: AttentionInput, th: Thresholds): Attention | null {
  const status = t.requirementsStatus;
  if (status === 'Blocked – waiting for requirements') {
    return attention('needs requirements', 'blocking', '#FF6B6B', 'Grooming needs a decision from you before anything moves.');
  }
  if (status === 'Blocked – waiting for architecture') {
    return attention(
      'design gap',
      'blocking',
      '#FF6B6B',
      'The implementer hit a gap the design does not cover. The architect needs a ruling before the work continues.',
    );
  }
  if (t.failedRun && status !== 'Validated') {
    return attention(
      'agent run failed',
      'check',
      '#F5A524',
      'An agent run aborted before it finished. Worth a glance that the re-run covered everything.',
    );
  }
  if (status === 'Changes requested – back to implementation') {
    return attention(
      'changes requested',
      'review',
      '#F5A524',
      'The validator sent the ticket back to implementation with findings.',
    );
  }
  if (t.loops >= th.loop) {
    return attention(
      'loop threshold',
      'review',
      '#F5A524',
      `${t.loops} re-runs on this ticket, over your threshold of ${th.loop}. The factory is spinning rather than converging.`,
    );
  }
  if (t.agentStatus === 'in-grooming') {
    return attention('open questions', 'answer', '#5BC8F5', 'Grooming is holding open questions only you can answer.');
  }
  if (t.idleHours >= th.idleHours && status !== 'Validated') {
    return attention(
      'idle',
      'review',
      '#F5A524',
      `No agent has touched this for ${fmtH(t.idleHours)}. Nothing is blocking it on paper.`,
    );
  }
  return null;
}

export interface Orderable {
  attention: Attention;
  idleHours: number;
  number: string;
}

/** Severity, then the one untouched longest, then the number, so the order is stable (S1.3). */
export function compareAttention(a: Orderable, b: Orderable): number {
  return (
    a.attention.rank - b.attention.rank ||
    b.idleHours - a.idleHours ||
    (a.number < b.number ? -1 : a.number > b.number ? 1 : 0)
  );
}

export interface StageInfo {
  stage: Stage;
  owner: Agent;
  color: string;
  /** The status text shown: verbatim, or `unknown` when a ticket has none. */
  statusText: string;
  known: boolean;
}

const STATUS_TABLE: Record<string, { stage: Stage; owner: Agent; color: string }> = {
  'In grooming': { stage: 'grooming', owner: 'groom', color: '#5BC8F5' },
  'Groomed – ready for architecture': { stage: 'grooming', owner: 'groom', color: '#5BC8F5' },
  'Designed – ready for implementation': { stage: 'design', owner: 'architect', color: '#A78BFA' },
  'Implemented – ready for validation': { stage: 'implementation', owner: 'implementer', color: '#F5A524' },
  Validated: { stage: 'verification', owner: 'validator', color: '#9EE84B' },
  'Changes requested – back to implementation': { stage: 'implementation', owner: 'implementer', color: FAILURE_COLOR },
  'Blocked – waiting for architecture': { stage: 'design', owner: 'architect', color: FAILURE_COLOR },
  'Blocked – waiting for requirements': { stage: 'grooming', owner: 'groom', color: FAILURE_COLOR },
};

const STAGE_OF_ACTOR: Record<Agent, Stage> = {
  groom: 'grooming',
  architect: 'design',
  implementer: 'implementation',
  validator: 'verification',
};

/**
 * R2. An unknown or missing status falls back to the stage owned by the actor of the newest run
 * (a human run counts as the newest non-human run); no runs at all means Grooming. Nothing is
 * dropped from a column.
 */
export function stageOf(status: string | null, runs: readonly RunLite[]): StageInfo {
  const known = status !== null ? STATUS_TABLE[status] : undefined;
  if (known) return { ...known, statusText: status!, known: true };

  let owner: Agent = 'groom';
  let newestStart = -Infinity;
  for (const r of runs) {
    if (r.actor === 'human') continue;
    if (r.startedAt >= newestStart) {
      newestStart = r.startedAt;
      owner = r.actor;
    }
  }
  return {
    stage: STAGE_OF_ACTOR[owner],
    owner,
    color: UNKNOWN_COLOR,
    statusText: status !== null && status.trim() !== '' ? status : 'unknown',
    known: false,
  };
}

export function ownerLabel(owner: Actor): string {
  return AG[owner].label;
}

export interface OnlineIndicator {
  text: string;
  color: string;
  pulsing: boolean;
}

/** R7 in the header: `{n} agents online` with the pulsing dot, or `no agents running`. */
export function onlineIndicator(count: number): OnlineIndicator {
  if (count <= 0) return { text: 'no agents running', color: '#39414D', pulsing: false };
  return { text: count === 1 ? '1 agent online' : `${count} agents online`, color: '#9EE84B', pulsing: true };
}

/** A run counts as failed for R1 rule 3 when its result is `failed` or `blocked-environment`. */
export function isFailedResult(result: string | null): boolean {
  return result === 'failed' || result === 'blocked-environment';
}
