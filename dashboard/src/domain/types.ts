// Plain data shapes shared by db/, domain/ and the views. Nothing in here has behaviour.

export type Agent = 'groom' | 'architect' | 'implementer' | 'validator';
export type Actor = Agent | 'human';

export const AGENTS: readonly Agent[] = ['groom', 'architect', 'implementer', 'validator'];
export const ACTORS: readonly Actor[] = [...AGENTS, 'human'];

export type RunSource = 'subagent-hook' | 'session-hook' | 'cli';

export interface TicketRecord {
  projectKey: string;
  number: string;
  title: string;
  slug: string | null;
  requirementsStatus: string | null;
  agentStatus: string | null;
  firstSeenAt: number;
  lastActivityAt: number;
  validatedAt: number | null;
}

/** A run as the list pages need it: no output text, which can be 64 KiB per run. */
export interface RunLite {
  id: string;
  projectKey: string;
  number: string;
  actor: Actor;
  startedAt: number;
  endedAt: number | null;
  result: string | null;
  agentStatus: string | null;
  tokens: number | null;
}

export interface RunRecord extends RunLite {
  output: string | null;
  outputTruncated: boolean;
  summary: string | null;
  statusBefore: string | null;
  statusAfter: string | null;
  source: RunSource;
  toolUseId: string | null;
  sessionId: string | null;
  transcriptPath: string | null;
}

export interface StatusEvent {
  id: number;
  status: string;
  at: number;
  runId: string | null;
}

/** The identity of a ticket: the number is digits only, so "@" cannot appear in it. */
export function ticketKey(projectKey: string, number: string): string {
  return `${number}@${projectKey}`;
}
