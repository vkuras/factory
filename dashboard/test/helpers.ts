// Shared helpers of the integration tests: an app over a temp-file database with a fixed clock,
// and builders for the reporter's requests (X-Factory-Meta + body).

import type Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig, type Config } from '../src/config.js';
import { createQueries } from '../src/db/queries.js';
import { migrate, openDatabase } from '../src/db/schema.js';
import { createLogger } from '../src/log.js';

export const H = 3_600_000;
export const DAY = 24 * H;
/** Sunday 2026-09-20 12:00 UTC, ISO week 38. */
export const T0 = Date.UTC(2026, 8, 20, 12, 0, 0);

export const REPO_A = 'github.com/vkuras/factory';
export const REPO_B = 'github.com/vkuras/shop';

export interface TestApp {
  app: ReturnType<typeof createApp>;
  db: Database;
  config: Config;
  logs: Record<string, unknown>[];
  clock: { now: number };
  close(): void;
}

export function makeApp(env: Record<string, string> = {}, startAt = T0): TestApp {
  const dir = mkdtempSync(join(tmpdir(), 'dash-'));
  const config = loadConfig({ DB_PATH: join(dir, 'factory.sqlite'), TZ: 'Europe/Berlin', ...env });
  const db = openDatabase(config.dbPath);
  migrate(db, new URL('../migrations', import.meta.url).pathname);
  const clock = { now: startAt };
  const logs: Record<string, unknown>[] = [];
  let counter = 0;
  const log = createLogger((line) => logs.push(JSON.parse(line) as Record<string, unknown>));
  const app = createApp({
    config,
    db,
    now: () => clock.now,
    uuid: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    log,
  });
  return {
    app,
    db,
    config,
    logs,
    clock,
    close() {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export type MetaInput = Record<string, unknown> & { event: string; ts: number; ticket: string };
export type MetaFields = Record<string, unknown> & { ts: number; ticket: string };

export function metaHeader(meta: MetaInput): string {
  const full = { v: 1, project: REPO_A, source: 'subagent-hook', origin: 'subagent', ...meta };
  return Buffer.from(JSON.stringify(full), 'utf8').toString('base64');
}

export interface Post {
  path: string;
  meta: MetaInput;
  body?: string;
  token?: string;
  rawMeta?: string;
}

export async function post(t: TestApp, p: Post) {
  const req = request(t.app)
    .post(p.path)
    .set('Content-Type', 'text/plain; charset=utf-8')
    .set('X-Factory-Meta', p.rawMeta ?? metaHeader(p.meta));
  if (p.token !== undefined) req.set('Authorization', `Bearer ${p.token}`);
  return req.send(p.body ?? '');
}

const START = '/api/hook/run-start';
const FINISH = '/api/hook/run-finish';
const INTERVENTION = '/api/intervention';

export const startRun = (t: TestApp, meta: MetaFields & { agent: string }, body = '{}') =>
  post(t, { path: START, meta: { ...meta, event: 'run-start' }, body });

export const finishRun = (t: TestApp, meta: MetaFields, payload: unknown, tail = '') =>
  post(t, {
    path: FINISH,
    meta: { ...meta, event: (meta['event'] as string | undefined) ?? 'run-finish' },
    body: JSON.stringify(payload) + (tail ? `\n---8<---\n${tail}` : ''),
  });

export const intervene = (t: TestApp, meta: MetaFields & { what: string }) =>
  post(t, { path: INTERVENTION, meta: { ...meta, event: 'intervention' } });

export function output(text: string): unknown {
  return { tool_response: { content: [{ type: 'text', text }] } };
}

/** One complete finished run, through the real endpoints. */
export async function reportRun(
  t: TestApp,
  o: {
    ticket: string;
    agent: string;
    startedAt: number;
    endedAt: number;
    project?: string;
    title?: string;
    statusBefore?: string;
    statusAfter?: string;
    text?: string;
    tokens?: number;
    session?: string;
  },
): Promise<void> {
  const session = o.session ?? `s-${o.project ?? REPO_A}-${o.ticket}-${o.agent}-${o.startedAt}`;
  const base = { ticket: o.ticket, project: o.project ?? REPO_A, title: o.title ?? `Ticket ${o.ticket}`, session_id: session };
  await startRun(t, { ...base, agent: o.agent, ts: o.startedAt, req_status: o.statusBefore, tool_use_id: `tu-${session}` });
  const payload: Record<string, unknown> = { tool_response: { content: [{ type: 'text', text: o.text ?? `STATUS: done\nSUMMARY: ${o.agent} ran` }] } };
  if (o.tokens !== undefined) {
    (payload['tool_response'] as Record<string, unknown>)['totalTokens'] = o.tokens;
  }
  await finishRun(t, { ...base, ts: o.endedAt, req_status: o.statusAfter ?? o.statusBefore, tool_use_id: `tu-${session}` }, payload);
}

export const q = (t: TestApp) => createQueries(t.db);

export function rows<T = Record<string, unknown>>(t: TestApp, sql: string, ...params: unknown[]): T[] {
  return t.db.prepare<T>(sql).all(...params);
}
