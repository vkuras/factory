// All the tolerant parsing of what Claude Code sends lives here, and only here (design, Components).
// The shapes were verified against captured real payloads (test/fixtures/hooks/README.md); every
// field has a defined "not found" outcome so an unknown shape degrades to "ignored", never to a crash.

import { capBytes, type Origin } from './meta.js';

export const BODY_SEPARATOR = '---8<---';
export const OUTPUT_CAP_BYTES = 64 * 1024;

export interface TranscriptEntry {
  type?: string;
  isSidechain?: boolean;
  message?: { content?: unknown };
  [key: string]: unknown;
}

export interface SplitBody {
  head: string;
  tail: string | null;
}

/** Splits a finish body on the first line that is exactly `---8<---`. */
export function splitBody(raw: string): SplitBody {
  const match = /(^|\n)---8<---(\n|$)/.exec(raw);
  if (!match) return { head: raw, tail: null };
  return { head: raw.slice(0, match.index), tail: raw.slice(match.index + match[0].length) };
}

export type PayloadResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false };

export function parsePayload(head: string): PayloadResult {
  try {
    const value: unknown = JSON.parse(head);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return { ok: true, payload: value as Record<string, unknown> };
    }
  } catch {
    // fall through
  }
  return { ok: false };
}

/** JSONL, one entry per line. Lines that do not parse (the leading partial line) are skipped. */
export function parseTranscriptTail(tail: string | null): TranscriptEntry[] {
  if (!tail) return [];
  const entries: TranscriptEntry[] = [];
  for (const line of tail.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed[0] !== '{') continue;
    try {
      const value: unknown = JSON.parse(trimmed);
      if (typeof value === 'object' && value !== null) entries.push(value as TranscriptEntry);
    } catch {
      // partial or damaged line: ignore
    }
  }
  return entries;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmpty(text: string | null | undefined): string | null {
  return typeof text === 'string' && text.trim() !== '' ? text : null;
}

/** Text blocks of a `content` array joined with a newline; null when there is none. */
function textOfBlocks(content: unknown): string | null {
  if (typeof content === 'string') return nonEmpty(content);
  if (!Array.isArray(content)) return null;
  const parts: string[] = [];
  for (const block of content) {
    const b = asRecord(block);
    if (b && b['type'] === 'text' && typeof b['text'] === 'string') parts.push(b['text']);
  }
  return nonEmpty(parts.join('\n'));
}

function textOfEntry(entry: TranscriptEntry): string | null {
  return textOfBlocks(entry.message?.content);
}

function lastAssistantText(entries: TranscriptEntry[], sidechain: boolean | 'any'): string | null {
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i]!;
    if (entry.type !== 'assistant') continue;
    if (sidechain === true && entry.isSidechain !== true) continue;
    if (sidechain === false && entry.isSidechain === true) continue;
    const text = textOfEntry(entry);
    if (text !== null) return text;
  }
  return null;
}

const USAGE_FIELDS = [
  'input_tokens',
  'output_tokens',
  'cache_creation_input_tokens',
  'cache_read_input_tokens',
] as const;

function usageSum(usage: unknown): number | null {
  const u = asRecord(usage);
  if (!u) return null;
  let found = false;
  let sum = 0;
  for (const field of USAGE_FIELDS) {
    const v = u[field];
    if (typeof v === 'number' && Number.isFinite(v)) {
      found = true;
      sum += v;
    }
  }
  return found ? sum : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export interface Extraction {
  /** The agent's final message exactly as received; null when there is none. */
  output: string | null;
  /** The payload flags an error (tool error, failed tool call). */
  errorFlag: boolean;
  /** A backgrounded agent's `PostToolUse` acknowledgement: not a finish. */
  acknowledgement: boolean;
  /** Token total from the payload itself; null when the payload carries none (use the delta). */
  usageTokens: number | null;
}

/**
 * Extraction in the order of the design (Interfaces, run-finish), plus the two fields real
 * payloads carry that the design does not name: `last_assistant_message` (SubagentStop, Stop) and
 * the asynchronous-launch acknowledgement, which must never be read as an output.
 */
export function extract(
  payload: Record<string, unknown>,
  transcript: TranscriptEntry[],
  origin: Origin,
): Extraction {
  const response = payload['tool_response'];
  const responseObj = asRecord(response);

  const acknowledgement =
    responseObj !== null &&
    (responseObj['isAsync'] === true || responseObj['status'] === 'async_launched');

  let errorFlag = false;
  if (responseObj) {
    errorFlag = Boolean(responseObj['is_error'] ?? responseObj['isError']);
  }
  if (payload['is_error']) errorFlag = true;
  if (typeof response === 'string' && response.startsWith('Error:')) errorFlag = true;
  // A failed Agent call (PostToolUseFailure) carries a top-level `error` string and no tool_response.
  const errorText =
    typeof payload['error'] === 'string' && payload['error'].trim() !== '' ? payload['error'] : null;
  if (errorText !== null) errorFlag = true;

  let output: string | null = null;
  if (!acknowledgement) {
    if (responseObj) {
      output = textOfBlocks(responseObj['content']);
      if (output === null) output = nonEmpty(typeof responseObj['text'] === 'string' ? responseObj['text'] : null);
    } else if (typeof response === 'string') {
      output = nonEmpty(response);
    }
    if (output === null) {
      const last = payload['last_assistant_message'];
      output = nonEmpty(typeof last === 'string' ? last : null);
    }
    // With no tool_response and the error flag set, the agent produced nothing and the transcript's
    // last assistant entry belongs to the calling session: those steps are skipped.
    const failedCall = errorFlag && response === undefined;
    if (output === null && !failedCall) {
      output =
        origin === 'main'
          ? lastAssistantText(transcript, false)
          : (lastAssistantText(transcript, true) ?? lastAssistantText(transcript, 'any'));
    }
    // The harness's own error text is the only text such a run produced (design, assumption 19).
    if (output === null && errorText !== null) output = errorText;
  }

  let usageTokens: number | null = null;
  if (responseObj) {
    usageTokens =
      usageSum(responseObj['usage']) ??
      finiteNumber(responseObj['totalTokens']) ??
      finiteNumber(responseObj['total_tokens']);
  }

  return { output, errorFlag, acknowledgement, usageTokens };
}

/** First `STATUS:` value of the output, e.g. `designed` from `STATUS: designed | needs-architect`. */
export function parseStatus(output: string | null): string | null {
  if (output === null) return null;
  const match = /^STATUS:[ \t]*([a-z-]+)/m.exec(output);
  return match ? match[1]! : null;
}

/** The `SUMMARY:` line, else the first non-empty line (200 characters at most), else null. */
export function parseSummary(output: string | null): string | null {
  if (output === null) return null;
  const match = /^SUMMARY:[ \t]*(.+)$/m.exec(output);
  if (match) return match[1]!.trim();
  return firstLine(output);
}

export function firstLine(text: string | null): string | null {
  if (text === null) return null;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed !== '') return trimmed.length > 200 ? trimmed.slice(0, 199) + '…' : trimmed;
  }
  return null;
}

/** Stores the output unchanged up to 64 KiB, cut at a character boundary (R6). */
export function capOutput(output: string): { text: string; truncated: boolean } {
  return capBytes(output, OUTPUT_CAP_BYTES);
}
