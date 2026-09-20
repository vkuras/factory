import { AGENTS, type Agent, type RunSource } from '../domain/types.js';

export type MetaEvent = 'run-start' | 'run-finish' | 'session-end' | 'intervention';
export type Origin = 'subagent' | 'main';

export interface Meta {
  event: MetaEvent;
  ts: number;
  project: string;
  repoPath: string | null;
  ticket: string;
  title: string | null;
  slug: string | null;
  reqStatus: string | null;
  agent: Agent | null;
  source: RunSource;
  origin: Origin;
  driver: string | null;
  sessionId: string | null;
  toolUseId: string | null;
  transcriptPath: string | null;
  cumTokens: number | null;
  result: string | null;
  what: string | null;
}

export type MetaResult = { ok: true; meta: Meta } | { ok: false; reason: string };

const EVENTS: readonly MetaEvent[] = ['run-start', 'run-finish', 'session-end', 'intervention'];
const SOURCES: readonly RunSource[] = ['subagent-hook', 'session-hook', 'cli'];
const WHAT_CAP_BYTES = 4096;

function optString(value: unknown, max = 2000): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed.slice(0, max);
}

/** Caps at `maxBytes` of UTF-8 without cutting a character in half. */
export function capBytes(text: string, maxBytes: number): { text: string; truncated: boolean } {
  const buf = Buffer.from(text, 'utf8');
  if (buf.length <= maxBytes) return { text, truncated: false };
  let end = maxBytes;
  while (end > 0 && (buf[end]! & 0xc0) === 0x80) end--;
  return { text: buf.subarray(0, end).toString('utf8'), truncated: true };
}

/** Decodes and validates `X-Factory-Meta`: base64 of a UTF-8 JSON object (design, Write API). */
export function decodeMeta(header: string | undefined): MetaResult {
  if (!header) return { ok: false, reason: 'missing X-Factory-Meta header' };
  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
  } catch {
    return { ok: false, reason: 'X-Factory-Meta is not base64 of a JSON object' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: 'X-Factory-Meta is not a JSON object' };
  }
  const m = raw as Record<string, unknown>;
  if (m['v'] !== 1) return { ok: false, reason: 'unsupported meta version' };
  const event = m['event'];
  if (typeof event !== 'string' || !EVENTS.includes(event as MetaEvent)) {
    return { ok: false, reason: 'meta.event is missing or unknown' };
  }
  const ts = m['ts'];
  if (typeof ts !== 'number' || !Number.isFinite(ts) || ts <= 0) {
    return { ok: false, reason: 'meta.ts must be a positive epoch-millisecond number' };
  }
  const project = optString(m['project'], 500);
  if (!project) return { ok: false, reason: 'meta.project is mandatory' };
  const ticket = optString(m['ticket'], 64);
  if (!ticket) return { ok: false, reason: 'meta.ticket is mandatory' };

  let agent: Agent | null = null;
  if (m['agent'] !== undefined && m['agent'] !== null) {
    if (typeof m['agent'] !== 'string' || !AGENTS.includes(m['agent'] as Agent)) {
      return { ok: false, reason: 'meta.agent is not one of the four factory agents' };
    }
    agent = m['agent'] as Agent;
  }
  if (event === 'run-start' && agent === null) {
    return { ok: false, reason: 'meta.agent is mandatory for run-start' };
  }

  let what: string | null = null;
  if (typeof m['what'] === 'string' && m['what'] !== '') {
    what = capBytes(m['what'], WHAT_CAP_BYTES).text;
  }
  if (event === 'intervention' && what === null) {
    return { ok: false, reason: 'meta.what is mandatory for intervention' };
  }

  let source: RunSource = 'cli';
  if (m['source'] !== undefined && m['source'] !== null) {
    if (typeof m['source'] !== 'string' || !SOURCES.includes(m['source'] as RunSource)) {
      return { ok: false, reason: 'meta.source is not one of subagent-hook, session-hook, cli' };
    }
    source = m['source'] as RunSource;
  }

  const cum = m['cum_tokens'];
  return {
    ok: true,
    meta: {
      event: event as MetaEvent,
      ts: Math.round(ts),
      project,
      repoPath: optString(m['repo_path'], 1000),
      ticket,
      title: optString(m['title'], 500),
      slug: optString(m['slug'], 200),
      reqStatus: optString(m['req_status'], 300),
      agent,
      source,
      origin: m['origin'] === 'main' ? 'main' : 'subagent',
      driver: optString(m['driver'], 100),
      sessionId: optString(m['session_id'], 200),
      toolUseId: optString(m['tool_use_id'], 200),
      transcriptPath: optString(m['transcript_path'], 1000),
      cumTokens: typeof cum === 'number' && Number.isFinite(cum) && cum >= 0 ? Math.round(cum) : null,
      result: optString(m['result'], 100),
      what,
    },
  };
}
