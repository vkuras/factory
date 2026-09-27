// The write side: what each ingest endpoint does with a decoded meta and a parsed body.
// Every function runs inside one SQLite transaction started by the caller (routes.ts), so a
// report is stored completely or not at all. Answers are decided by routes.ts; these return what
// happened so it can be logged and tested.

import type Database from 'better-sqlite3';
import type { Logger } from '../log.js';
import type { Queries } from '../db/queries.js';
import type { Meta } from './meta.js';
import {
  capOutput,
  extract,
  firstLine,
  parseStatus,
  parseSummary,
  type TranscriptEntry,
} from './payload.js';

export interface IngestDeps {
  db: Database;
  q: Queries;
  now: () => number;
  uuid: () => string;
  log: Logger;
}

export type StartOutcome = 'created' | 'duplicate';
export type FinishOutcome = 'closed' | 'filled' | 'ignored' | 'dropped';
export type InterventionOutcome = 'created' | 'duplicate' | 'merged';

function logFields(meta: Meta): Record<string, unknown> {
  return { event_kind: meta.event, driver: meta.driver, source: meta.source };
}

/** Step 0 of every endpoint: "the dashboard has heard from this repository" (R3). */
function touchRepository(d: IngestDeps, meta: Meta): void {
  const { isNew, count } = d.q.upsertRepository(meta.project, meta.ts, meta.repoPath);
  if (isNew) d.log('info', 'repository_first_seen', { project: meta.project, repositories: count });
}

/** Creates or updates the ticket from a report and keeps its status trail (Interfaces, run-start 1). */
function touchTicket(d: IngestDeps, meta: Meta, runId: string | null): void {
  const existing = d.q.getTicket(meta.project, meta.ticket);
  const now = d.now();
  if (!existing) {
    d.q.insertTicket({
      key: meta.project,
      number: meta.ticket,
      title: meta.title ?? meta.ticket,
      slug: meta.slug,
      status: meta.reqStatus,
      ts: meta.ts,
      now,
    });
  } else {
    d.q.updateTicketFromReport({
      key: meta.project,
      number: meta.ticket,
      title: meta.title,
      slug: meta.slug,
      status: meta.reqStatus,
      ts: meta.ts,
      now,
    });
  }
  if (meta.reqStatus !== null) {
    if (d.q.latestStatus(meta.project, meta.ticket) !== meta.reqStatus) {
      d.q.insertStatusEvent(meta.project, meta.ticket, meta.reqStatus, meta.ts, runId);
    }
    if (meta.reqStatus === 'Validated') d.q.setValidatedAt(meta.project, meta.ticket, meta.ts);
  }
}

export function handleRunStart(d: IngestDeps, meta: Meta): StartOutcome {
  touchRepository(d, meta);
  const agent = meta.agent!;
  const byToolUse = meta.toolUseId ? d.q.runByToolUse(meta.toolUseId) : null;
  const open = byToolUse ? null : d.q.openRunForStart(meta.project, meta.ticket, agent, meta.sessionId);
  const duplicate = byToolUse ?? open;
  const runId = duplicate ? duplicate.id : d.uuid();
  touchTicket(d, meta, runId);
  if (duplicate) return 'duplicate';
  d.q.insertRun({
    id: runId,
    projectKey: meta.project,
    number: meta.ticket,
    actor: agent,
    startedAt: meta.ts,
    endedAt: null,
    result: null,
    tokens: null,
    output: null,
    summary: null,
    statusBefore: meta.reqStatus,
    statusAfter: null,
    source: meta.source,
    toolUseId: meta.toolUseId,
    sessionId: meta.sessionId,
    transcriptPath: meta.transcriptPath,
    now: d.now(),
  });
  return 'created';
}

export interface FinishInput {
  meta: Meta;
  /** The hook payload; null for a `cli` finish, whose body is the output text itself. */
  payload: Record<string, unknown> | null;
  transcript: TranscriptEntry[];
  /** Verbatim output for a `cli` finish. */
  cliOutput: string | null;
}

function resolveRun(d: IngestDeps, meta: Meta) {
  if (meta.toolUseId) {
    const byId = d.q.runByToolUse(meta.toolUseId);
    if (byId) return byId;
  }
  if (meta.sessionId) {
    const bySession = d.q.openRunForFinishBySession(meta.project, meta.ticket, meta.sessionId);
    if (bySession) return bySession;
  }
  if (meta.source === 'cli' && !meta.sessionId && meta.agent) {
    // A CLI driver has no Claude Code session to key on (design assumption 18).
    const byActor = d.q.openRunForFinishByActor(meta.project, meta.ticket, meta.agent);
    if (byActor) return byActor;
  }
  return d.q.openRunForFinishByTicket(meta.project, meta.ticket);
}

export function handleRunFinish(d: IngestDeps, input: FinishInput): FinishOutcome {
  const { meta } = input;
  touchRepository(d, meta);
  const run = resolveRun(d, meta);
  if (!run) {
    d.log('warn', 'report_drop', { reason: 'finish without a start', ticket: meta.ticket, ...logFields(meta) });
    return 'dropped';
  }

  const isSessionEnd = meta.event === 'session-end';
  const isCli = meta.source === 'cli';

  let output: string | null = null;
  let errorFlag = false;
  let usageTokens: number | null = null;
  let acknowledgement = false;
  if (isCli) {
    output = input.cliOutput !== null && input.cliOutput.trim() !== '' ? input.cliOutput : null;
  } else if (input.payload) {
    const ex = extract(input.payload, input.transcript, meta.origin);
    output = ex.output;
    errorFlag = ex.errorFlag;
    usageTokens = ex.usageTokens;
    acknowledgement = ex.acknowledgement;
  }

  const closesWithoutOutput = isSessionEnd || (isCli && meta.result !== null);
  if (output === null && !errorFlag && !closesWithoutOutput) {
    d.log('info', 'report_ignored', {
      reason: acknowledgement ? 'background launch acknowledgement' : 'no output and no error',
      ticket: meta.ticket,
      ...logFields(meta),
    });
    return 'ignored';
  }

  const status = parseStatus(output);
  let result: string;
  if (isSessionEnd) result = 'interrupted';
  else if (isCli && meta.result !== null) result = meta.result;
  else if (errorFlag) result = 'failed';
  else if (status !== null) result = status;
  else result = 'unreported';

  // ADR-0004: the transcript delta leads. `tool_response.usage` describes only the agent's last API
  // response, so it is the fallback for a body with no counter behind it.
  let tokens = usageTokens;
  if (meta.cumTokens !== null) {
    const cursor = d.q.getCursor(meta.sessionId ?? '', meta.transcriptPath ?? '');
    tokens = Math.max(0, meta.cumTokens - cursor);
    d.q.upsertCursor(meta.sessionId ?? '', meta.transcriptPath ?? '', meta.cumTokens, d.now());
  }

  const capped = output === null ? null : capOutput(output);
  const summary = parseSummary(output);
  const now = d.now();
  touchTicket(d, meta, run.id);

  let outcome: FinishOutcome;
  if (run.endedAt === null) {
    d.q.finishRun({
      id: run.id,
      endedAt: meta.ts,
      result,
      agentStatus: status,
      tokens,
      output: capped?.text ?? null,
      truncated: capped?.truncated ?? false,
      summary,
      statusAfter: meta.reqStatus,
      now,
    });
    outcome = 'closed';
  } else {
    // Already finished: only the fields that are still NULL are filled; ended_at and result
    // are never overwritten, which makes a doubled delivery harmless in any order.
    // One narrow upgrade: an error flag is a statement that the run ended badly, `unreported` only
    // the absence of one. An agent's own STATUS is never overwritten (R6).
    if (errorFlag && (run.result === null || run.result === 'unreported')) {
      d.q.upgradeResultToFailed(run.id, now);
    }
    d.q.fillRun({
      id: run.id,
      agentStatus: status,
      tokens,
      output: capped?.text ?? null,
      truncated: capped?.truncated ?? false,
      summary,
      statusAfter: meta.reqStatus,
      now,
    });
    outcome = 'filled';
  }

  // The ticket's agent status is the STATUS value of the newest finished run.
  if (d.q.latestFinishedAgentRunId(meta.project, meta.ticket) === run.id) {
    const current = d.q.runById(run.id);
    d.q.setAgentStatus(meta.project, meta.ticket, current?.agentStatus ?? null, now);
  }
  return outcome;
}

export function handleIntervention(d: IngestDeps, meta: Meta): InterventionOutcome {
  touchRepository(d, meta);
  const what = meta.what!;
  const near = d.q.interventionNear(meta.project, meta.ticket, meta.ts);
  const runId = near ? near.id : d.uuid();
  touchTicket(d, meta, runId);
  const summary = firstLine(what);
  if (!near) {
    d.q.insertRun({
      id: runId,
      projectKey: meta.project,
      number: meta.ticket,
      actor: 'human',
      startedAt: meta.ts,
      endedAt: meta.ts,
      result: 'intervention',
      tokens: 0,
      output: what,
      summary,
      statusBefore: meta.reqStatus,
      statusAfter: meta.reqStatus,
      source: meta.source,
      toolUseId: null,
      sessionId: meta.sessionId,
      transcriptPath: null,
      now: d.now(),
    });
    return 'created';
  }
  if (near.output === what) return 'duplicate';
  // The same act of the operator seen twice: the driver's own description beats the raw prompt.
  if (meta.source === 'cli' && near.source !== 'cli') {
    d.q.mergeIntervention({ id: near.id, what, summary, source: meta.source, now: d.now() });
  }
  d.log('info', 'intervention_merged', { ticket: meta.ticket, kept: meta.source === 'cli' ? 'cli' : near.source });
  return 'merged';
}
