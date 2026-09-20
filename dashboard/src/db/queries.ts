// Every prepared statement of the product. No SQL anywhere else (design, Components).
// The application never deletes a row: there is no DELETE statement in this file (R8, T-DATA-1).

import type Database from 'better-sqlite3';
import type {
  Actor,
  RunLite,
  RunRecord,
  RunSource,
  StatusEvent,
  TicketRecord,
} from '../domain/types.js';

interface TicketRow {
  project_key: string;
  number: string;
  title: string;
  slug: string | null;
  requirements_status: string | null;
  agent_status: string | null;
  first_seen_at: number;
  last_activity_at: number;
  validated_at: number | null;
}

interface RunLiteRow {
  id: string;
  project_key: string;
  number: string;
  actor: Actor;
  started_at: number;
  ended_at: number | null;
  result: string | null;
  agent_status: string | null;
  tokens: number | null;
}

interface RunRow extends RunLiteRow {
  output: string | null;
  output_truncated: number;
  summary: string | null;
  status_before: string | null;
  status_after: string | null;
  source: RunSource;
  tool_use_id: string | null;
  session_id: string | null;
  transcript_path: string | null;
}

const toTicket = (r: TicketRow): TicketRecord => ({
  projectKey: r.project_key,
  number: r.number,
  title: r.title,
  slug: r.slug,
  requirementsStatus: r.requirements_status,
  agentStatus: r.agent_status,
  firstSeenAt: r.first_seen_at,
  lastActivityAt: r.last_activity_at,
  validatedAt: r.validated_at,
});

const toRunLite = (r: RunLiteRow): RunLite => ({
  id: r.id,
  projectKey: r.project_key,
  number: r.number,
  actor: r.actor,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  result: r.result,
  agentStatus: r.agent_status,
  tokens: r.tokens,
});

const toRun = (r: RunRow): RunRecord => ({
  ...toRunLite(r),
  output: r.output,
  outputTruncated: r.output_truncated === 1,
  summary: r.summary,
  statusBefore: r.status_before,
  statusAfter: r.status_after,
  source: r.source,
  toolUseId: r.tool_use_id,
  sessionId: r.session_id,
  transcriptPath: r.transcript_path,
});

const RUN_LITE_COLUMNS =
  'id, project_key, number, actor, started_at, ended_at, result, agent_status, tokens';
const RUN_COLUMNS = `${RUN_LITE_COLUMNS}, output, output_truncated, summary, status_before,
  status_after, source, tool_use_id, session_id, transcript_path`;

export interface NewRun {
  id: string;
  projectKey: string;
  number: string;
  actor: Actor;
  startedAt: number;
  endedAt: number | null;
  result: string | null;
  tokens: number | null;
  output: string | null;
  summary: string | null;
  statusBefore: string | null;
  statusAfter: string | null;
  source: RunSource;
  toolUseId: string | null;
  sessionId: string | null;
  transcriptPath: string | null;
  now: number;
}

export function createQueries(db: Database) {
  const stmt = {
    upsertRepository: db.prepare(
      `INSERT INTO repository (project_key, first_seen_at, last_seen_at, repo_path)
       VALUES (@key, @ts, @ts, @path)
       ON CONFLICT (project_key) DO UPDATE SET
         first_seen_at = min(first_seen_at, excluded.first_seen_at),
         last_seen_at = max(last_seen_at, excluded.last_seen_at),
         repo_path = coalesce(excluded.repo_path, repo_path)`,
    ),
    repositoryExists: db.prepare<{ n: number }>(
      'SELECT count(*) AS n FROM repository WHERE project_key = ?',
    ),
    countRepositories: db.prepare<{ n: number }>('SELECT count(*) AS n FROM repository'),
    listRepositoryKeys: db.prepare<{ project_key: string }>(
      'SELECT project_key FROM repository ORDER BY project_key',
    ),
    getTicket: db.prepare<TicketRow>('SELECT * FROM ticket WHERE project_key = ? AND number = ?'),
    insertTicket: db.prepare(
      `INSERT INTO ticket (project_key, number, title, slug, requirements_status, agent_status,
         first_seen_at, last_activity_at, validated_at, created_at, updated_at)
       VALUES (@key, @number, @title, @slug, @status, NULL, @ts, @ts, NULL, @now, @now)`,
    ),
    updateTicketFromReport: db.prepare(
      `UPDATE ticket SET
         title = coalesce(@title, title),
         slug = coalesce(@slug, slug),
         requirements_status = coalesce(@status, requirements_status),
         first_seen_at = min(first_seen_at, @ts),
         last_activity_at = max(last_activity_at, @ts),
         updated_at = @now
       WHERE project_key = @key AND number = @number`,
    ),
    setValidatedAt: db.prepare(
      `UPDATE ticket SET validated_at = @ts
       WHERE project_key = @key AND number = @number AND validated_at IS NULL`,
    ),
    setAgentStatus: db.prepare(
      'UPDATE ticket SET agent_status = @status, updated_at = @now WHERE project_key = @key AND number = @number',
    ),
    latestStatusEvent: db.prepare<{ status: string }>(
      `SELECT status FROM ticket_status_event WHERE project_key = ? AND number = ?
       ORDER BY at DESC, id DESC LIMIT 1`,
    ),
    insertStatusEvent: db.prepare(
      `INSERT INTO ticket_status_event (project_key, number, status, at, run_id)
       VALUES (@key, @number, @status, @ts, @runId)`,
    ),
    statusTrail: db.prepare<{ id: number; status: string; at: number; run_id: string | null }>(
      `SELECT id, status, at, run_id FROM ticket_status_event
       WHERE project_key = ? AND number = ? ORDER BY at ASC, id ASC`,
    ),
    runByToolUse: db.prepare<RunRow>(`SELECT ${RUN_COLUMNS} FROM run WHERE tool_use_id = ?`),
    runById: db.prepare<RunRow>(`SELECT ${RUN_COLUMNS} FROM run WHERE id = ?`),
    openRunForStart: db.prepare<RunRow>(
      `SELECT ${RUN_COLUMNS} FROM run
       WHERE project_key = @key AND number = @number AND actor = @actor
         AND coalesce(session_id, '') = coalesce(@session, '')
         AND ended_at IS NULL AND result IS NULL
       ORDER BY started_at DESC LIMIT 1`,
    ),
    openRunsForFinishBySession: db.prepare<RunRow>(
      `SELECT ${RUN_COLUMNS} FROM run
       WHERE project_key = @key AND number = @number AND session_id = @session AND actor != 'human'
         AND ended_at IS NULL AND (result IS NULL OR result = 'abandoned')
       ORDER BY started_at DESC, created_at DESC LIMIT 1`,
    ),
    openRunForFinishByTicket: db.prepare<RunRow>(
      `SELECT ${RUN_COLUMNS} FROM run
       WHERE project_key = @key AND number = @number AND actor != 'human'
         AND ended_at IS NULL AND (result IS NULL OR result = 'abandoned')
       ORDER BY started_at DESC, created_at DESC LIMIT 1`,
    ),
    openRunForFinishByActor: db.prepare<RunRow>(
      `SELECT ${RUN_COLUMNS} FROM run
       WHERE project_key = @key AND number = @number AND actor = @actor
         AND ended_at IS NULL AND (result IS NULL OR result = 'abandoned')
       ORDER BY started_at DESC, created_at DESC LIMIT 1`,
    ),
    insertRun: db.prepare(
      `INSERT INTO run (id, project_key, number, actor, started_at, ended_at, result, agent_status,
         tokens, output, output_truncated, summary, status_before, status_after, source,
         tool_use_id, session_id, transcript_path, created_at, updated_at)
       VALUES (@id, @key, @number, @actor, @startedAt, @endedAt, @result, NULL,
         @tokens, @output, @truncated, @summary, @statusBefore, @statusAfter, @source,
         @toolUseId, @sessionId, @transcriptPath, @now, @now)`,
    ),
    finishRun: db.prepare(
      `UPDATE run SET ended_at = @endedAt, result = @result, agent_status = @agentStatus,
         tokens = @tokens, output = @output, output_truncated = @truncated, summary = @summary,
         status_after = @statusAfter, updated_at = @now
       WHERE id = @id`,
    ),
    fillRun: db.prepare(
      `UPDATE run SET
         tokens = coalesce(tokens, @tokens),
         agent_status = coalesce(agent_status, @agentStatus),
         summary = coalesce(summary, @summary),
         status_after = coalesce(status_after, @statusAfter),
         output_truncated = CASE WHEN output IS NULL AND @output IS NOT NULL THEN @truncated ELSE output_truncated END,
         output = coalesce(output, @output),
         updated_at = @now
       WHERE id = @id`,
    ),
    latestFinishedAgentRun: db.prepare<{ id: string }>(
      `SELECT id FROM run WHERE project_key = ? AND number = ? AND actor != 'human' AND ended_at IS NOT NULL
       ORDER BY ended_at DESC, started_at DESC, created_at DESC LIMIT 1`,
    ),
    interventionNear: db.prepare<RunRow>(
      `SELECT ${RUN_COLUMNS} FROM run
       WHERE project_key = @key AND number = @number AND actor = 'human'
         AND abs(started_at - @ts) <= 120000
       ORDER BY abs(started_at - @ts) ASC, started_at ASC LIMIT 1`,
    ),
    mergeIntervention: db.prepare(
      `UPDATE run SET output = @what, summary = @summary, source = @source, updated_at = @now
       WHERE id = @id`,
    ),
    getCursor: db.prepare<{ cum_tokens: number }>(
      'SELECT cum_tokens FROM hook_cursor WHERE session_id = ? AND transcript_path = ?',
    ),
    upsertCursor: db.prepare(
      `INSERT INTO hook_cursor (session_id, transcript_path, cum_tokens, updated_at)
       VALUES (@session, @path, @cum, @now)
       ON CONFLICT (session_id, transcript_path) DO UPDATE SET
         cum_tokens = excluded.cum_tokens, updated_at = excluded.updated_at`,
    ),
    listTickets: db.prepare<TicketRow>('SELECT * FROM ticket'),
    ticketsByNumber: db.prepare<TicketRow>(
      'SELECT * FROM ticket WHERE number = ? ORDER BY last_activity_at DESC, project_key ASC',
    ),
    listRunsLite: db.prepare<RunLiteRow>(
      `SELECT ${RUN_LITE_COLUMNS} FROM run ORDER BY started_at ASC, created_at ASC, rowid ASC`,
    ),
    runsOfTicket: db.prepare<RunRow>(
      `SELECT ${RUN_COLUMNS} FROM run WHERE project_key = ? AND number = ?
       ORDER BY started_at ASC, created_at ASC, rowid ASC`,
    ),
    countOnline: db.prepare<{ n: number }>(
      `SELECT count(*) AS n FROM run
       WHERE ended_at IS NULL AND result IS NULL AND started_at > ?`,
    ),
    countTickets: db.prepare<{ n: number }>('SELECT count(*) AS n FROM ticket'),
    countOpenRuns: db.prepare<{ n: number }>(
      'SELECT count(*) AS n FROM run WHERE ended_at IS NULL AND result IS NULL',
    ),
    sweep: db.prepare(
      `UPDATE run SET result = 'abandoned', updated_at = @now
       WHERE ended_at IS NULL AND result IS NULL AND started_at < @cutoff`,
    ),
  };

  return {
    /** Returns whether the key was new and the repository count afterwards. */
    upsertRepository(key: string, ts: number, repoPath: string | null): { isNew: boolean; count: number } {
      const existed = (stmt.repositoryExists.get(key)?.n ?? 0) > 0;
      stmt.upsertRepository.run({ key, ts, path: repoPath });
      return { isNew: !existed, count: stmt.countRepositories.get()?.n ?? 0 };
    },
    countRepositories: (): number => stmt.countRepositories.get()?.n ?? 0,
    listRepositoryKeys: (): string[] => stmt.listRepositoryKeys.all().map((r) => r.project_key),

    getTicket(key: string, number: string): TicketRecord | null {
      const row = stmt.getTicket.get(key, number);
      return row ? toTicket(row) : null;
    },
    insertTicket(p: { key: string; number: string; title: string; slug: string | null; status: string | null; ts: number; now: number }): void {
      stmt.insertTicket.run(p);
    },
    updateTicketFromReport(p: { key: string; number: string; title: string | null; slug: string | null; status: string | null; ts: number; now: number }): void {
      stmt.updateTicketFromReport.run(p);
    },
    setValidatedAt: (key: string, number: string, ts: number): void => {
      stmt.setValidatedAt.run({ key, number, ts });
    },
    setAgentStatus: (key: string, number: string, status: string | null, now: number): void => {
      stmt.setAgentStatus.run({ key, number, status, now });
    },
    latestStatus: (key: string, number: string): string | null =>
      stmt.latestStatusEvent.get(key, number)?.status ?? null,
    insertStatusEvent: (key: string, number: string, status: string, ts: number, runId: string | null): void => {
      stmt.insertStatusEvent.run({ key, number, status, ts, runId });
    },
    statusTrail: (key: string, number: string): StatusEvent[] =>
      stmt.statusTrail.all(key, number).map((r) => ({ id: r.id, status: r.status, at: r.at, runId: r.run_id })),

    runByToolUse(id: string): RunRecord | null {
      const row = stmt.runByToolUse.get(id);
      return row ? toRun(row) : null;
    },
    runById(id: string): RunRecord | null {
      const row = stmt.runById.get(id);
      return row ? toRun(row) : null;
    },
    openRunForStart(key: string, number: string, actor: Actor, session: string | null): RunRecord | null {
      const row = stmt.openRunForStart.get({ key, number, actor, session });
      return row ? toRun(row) : null;
    },
    openRunForFinishBySession(key: string, number: string, session: string): RunRecord | null {
      const row = stmt.openRunsForFinishBySession.get({ key, number, session });
      return row ? toRun(row) : null;
    },
    openRunForFinishByTicket(key: string, number: string): RunRecord | null {
      const row = stmt.openRunForFinishByTicket.get({ key, number });
      return row ? toRun(row) : null;
    },
    openRunForFinishByActor(key: string, number: string, actor: Actor): RunRecord | null {
      const row = stmt.openRunForFinishByActor.get({ key, number, actor });
      return row ? toRun(row) : null;
    },
    insertRun(r: NewRun): void {
      stmt.insertRun.run({
        id: r.id,
        key: r.projectKey,
        number: r.number,
        actor: r.actor,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
        result: r.result,
        tokens: r.tokens,
        output: r.output,
        truncated: 0,
        summary: r.summary,
        statusBefore: r.statusBefore,
        statusAfter: r.statusAfter,
        source: r.source,
        toolUseId: r.toolUseId,
        sessionId: r.sessionId,
        transcriptPath: r.transcriptPath,
        now: r.now,
      });
    },
    finishRun(p: { id: string; endedAt: number; result: string; agentStatus: string | null; tokens: number | null; output: string | null; truncated: boolean; summary: string | null; statusAfter: string | null; now: number }): void {
      stmt.finishRun.run({ ...p, truncated: p.truncated ? 1 : 0 });
    },
    fillRun(p: { id: string; agentStatus: string | null; tokens: number | null; output: string | null; truncated: boolean; summary: string | null; statusAfter: string | null; now: number }): void {
      stmt.fillRun.run({ ...p, truncated: p.truncated ? 1 : 0 });
    },
    latestFinishedAgentRunId: (key: string, number: string): string | null =>
      stmt.latestFinishedAgentRun.get(key, number)?.id ?? null,
    interventionNear(key: string, number: string, ts: number): RunRecord | null {
      const row = stmt.interventionNear.get({ key, number, ts });
      return row ? toRun(row) : null;
    },
    mergeIntervention(p: { id: string; what: string; summary: string | null; source: RunSource; now: number }): void {
      stmt.mergeIntervention.run(p);
    },

    getCursor: (session: string, path: string): number =>
      stmt.getCursor.get(session, path)?.cum_tokens ?? 0,
    upsertCursor: (session: string, path: string, cum: number, now: number): void => {
      stmt.upsertCursor.run({ session, path, cum, now });
    },

    listTickets: (): TicketRecord[] => stmt.listTickets.all().map(toTicket),
    ticketsByNumber: (number: string): TicketRecord[] => stmt.ticketsByNumber.all(number).map(toTicket),
    listRunsLite: (): RunLite[] => stmt.listRunsLite.all().map(toRunLite),
    runsOfTicket: (key: string, number: string): RunRecord[] => stmt.runsOfTicket.all(key, number).map(toRun),
    countOnline: (freshAfter: number): number => stmt.countOnline.get(freshAfter)?.n ?? 0,
    countTickets: (): number => stmt.countTickets.get()?.n ?? 0,
    countOpenRuns: (): number => stmt.countOpenRuns.get()?.n ?? 0,
    sweep: (now: number, cutoff: number): number => stmt.sweep.run({ now, cutoff }).changes,
  };
}

export type Queries = ReturnType<typeof createQueries>;
