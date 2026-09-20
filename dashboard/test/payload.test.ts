import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  capOutput,
  extract,
  firstLine,
  OUTPUT_CAP_BYTES,
  parsePayload,
  parseStatus,
  parseSummary,
  parseTranscriptTail,
  splitBody,
} from '../src/ingest/payload.js';
import { outputLines } from '../src/web/pages.js';

const fixture = (name: string): string =>
  readFileSync(new URL(`./fixtures/hooks/${name}`, import.meta.url), 'utf8');
const payloadOf = (name: string): Record<string, unknown> => {
  const parsed = parsePayload(fixture(name));
  if (!parsed.ok) throw new Error(`fixture ${name} is not JSON`);
  return parsed.payload;
};
const transcriptOf = (name: string) => parseTranscriptTail(fixture(name));

// T-HOOK-1: the parsers against real captured payloads.
describe('extraction from real hook payloads (T-HOOK-1)', () => {
  it('a foreground PostToolUse: output from tool_response.content[], tokens from usage', () => {
    const ex = extract(payloadOf('post-tool-use-foreground.json'), [], 'subagent');
    expect(ex.output).toBe('STATUS: nothing-to-do\nSUMMARY: capture test fg');
    expect(ex.errorFlag).toBe(false);
    expect(ex.acknowledgement).toBe(false);
    // 8 + 12789 + 21163 + 138, the four counters of tool_response.usage
    expect(ex.usageTokens).toBe(34098);
  });

  it('a backgrounded PostToolUse is an acknowledgement: no output, even with a transcript that has one', () => {
    const ex = extract(payloadOf('post-tool-use-background-ack.json'), transcriptOf('main-session.transcript.jsonl'), 'subagent');
    expect(ex.acknowledgement).toBe(true);
    expect(ex.output).toBeNull();
    expect(ex.errorFlag).toBe(false);
    expect(ex.usageTokens).toBeNull();
  });

  it('a SubagentStop: output from last_assistant_message', () => {
    const ex = extract(payloadOf('subagent-stop-background.json'), [], 'subagent');
    expect(ex.output).toBe('STATUS: nothing-to-do\nSUMMARY: capture test');
    expect(ex.usageTokens).toBeNull();
  });

  it('a SubagentStop without last_assistant_message falls back to the agent transcript tail', () => {
    const payload = payloadOf('subagent-stop-foreground.json');
    delete payload['last_assistant_message'];
    const ex = extract(payload, transcriptOf('subagent-foreground.transcript.jsonl'), 'subagent');
    expect(ex.output).toBe('STATUS: nothing-to-do\nSUMMARY: capture test fg');
  });

  it('a failed Agent call (PostToolUseFailure) sets the error flag and has no output', () => {
    const ex = extract(payloadOf('post-tool-use-failure.json'), [], 'subagent');
    expect(ex.errorFlag).toBe(true);
    expect(ex.output).toBeNull();
  });

  it('a Stop of a main-session run: the last non-sidechain assistant message', () => {
    const ex = extract(payloadOf('stop-main.json'), [], 'main');
    expect(ex.output).toBe('STATUS: designed\nSUMMARY: capture main session');
    const fromTranscript = { ...payloadOf('stop-main.json') };
    delete fromTranscript['last_assistant_message'];
    expect(extract(fromTranscript, transcriptOf('main-session.transcript.jsonl'), 'main').output).toBe(
      'STATUS: designed\nSUMMARY: capture main session',
    );
  });

  it('the main-session filter is inverted: sidechain entries are not the run\'s output', () => {
    const sidechain = transcriptOf('subagent-foreground.transcript.jsonl');
    expect(extract({}, sidechain, 'main').output).toBeNull();
    expect(extract({}, sidechain, 'subagent').output).toBe('STATUS: nothing-to-do\nSUMMARY: capture test fg');
  });

  it('a SessionEnd carries no output and no error', () => {
    const ex = extract(payloadOf('session-end.json'), [], 'main');
    expect(ex).toEqual({ output: null, errorFlag: false, acknowledgement: false, usageTokens: null });
  });
});

describe('resolution order and tolerance', () => {
  it('prefers tool_response.content[] over everything else', () => {
    const payload = {
      tool_response: { content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }], text: 'no' },
      last_assistant_message: 'no',
    };
    expect(extract(payload, [], 'subagent').output).toBe('a\nb');
  });

  it('then content as a string, then text, then tool_response as a string', () => {
    expect(extract({ tool_response: { content: 'plain' } }, [], 'subagent').output).toBe('plain');
    expect(extract({ tool_response: { text: 'txt' } }, [], 'subagent').output).toBe('txt');
    expect(extract({ tool_response: 'whole' }, [], 'subagent').output).toBe('whole');
  });

  it('flags the error variants of the design', () => {
    expect(extract({ tool_response: { is_error: true } }, [], 'subagent').errorFlag).toBe(true);
    expect(extract({ tool_response: { isError: true } }, [], 'subagent').errorFlag).toBe(true);
    expect(extract({ is_error: true }, [], 'subagent').errorFlag).toBe(true);
    expect(extract({ tool_response: 'Error: boom' }, [], 'subagent').errorFlag).toBe(true);
    expect(extract({ tool_response: 'fine' }, [], 'subagent').errorFlag).toBe(false);
  });

  it('usage: the four counters, else totalTokens, else total_tokens, else nothing', () => {
    const usage = { input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 3, cache_read_input_tokens: 4 };
    expect(extract({ tool_response: { usage, totalTokens: 99 } }, [], 'subagent').usageTokens).toBe(10);
    expect(extract({ tool_response: { totalTokens: 99 } }, [], 'subagent').usageTokens).toBe(99);
    expect(extract({ tool_response: { total_tokens: 77 } }, [], 'subagent').usageTokens).toBe(77);
    expect(extract({ tool_response: {} }, [], 'subagent').usageTokens).toBeNull();
  });

  it('never throws on shapes it does not know', () => {
    for (const payload of [{}, { tool_response: null }, { tool_response: 5 }, { tool_response: [] }, { last_assistant_message: 7 }]) {
      expect(() => extract(payload as Record<string, unknown>, [], 'subagent')).not.toThrow();
    }
  });
});

describe('the finish body: payload, separator, transcript tail', () => {
  it('splits on the first line that is exactly ---8<---', () => {
    const { head, tail } = splitBody('{"a":1}\n---8<---\nline1\n---8<---\nline2');
    expect(head).toBe('{"a":1}');
    expect(tail).toBe('line1\n---8<---\nline2');
  });
  it('has no tail without the separator', () => {
    expect(splitBody('{"a":1}')).toEqual({ head: '{"a":1}', tail: null });
    expect(splitBody('{"a":"---8<---"}').tail).toBeNull();
  });
  it('ignores a leading partial transcript line and damaged lines', () => {
    const entries = parseTranscriptTail('ial":"cut off"}\n{"type":"assistant"}\nnot json\n{"type":"user"}\n');
    expect(entries.map((e) => e.type)).toEqual(['assistant', 'user']);
  });
  it('rejects a payload that is not a JSON object', () => {
    expect(parsePayload('nope').ok).toBe(false);
    expect(parsePayload('[1]').ok).toBe(false);
    expect(parsePayload('{"a":1}').ok).toBe(true);
  });
});

// T-UNIT-OUT-1: output handling.
describe('output handling (R6, T-UNIT-OUT-1)', () => {
  it('STATUS: takes the value and ignores anything after a | or a space', () => {
    expect(parseStatus('STATUS: designed')).toBe('designed');
    expect(parseStatus('STATUS: ready-for-validation | needs-architect')).toBe('ready-for-validation');
    expect(parseStatus('intro\nSTATUS:changes-requested extra')).toBe('changes-requested');
    expect(parseStatus('no status here')).toBeNull();
    expect(parseStatus('  STATUS: indented')).toBeNull();
    expect(parseStatus(null)).toBeNull();
  });

  it('SUMMARY: is quoted verbatim, else the first non-empty line, else null', () => {
    expect(parseSummary('STATUS: x\nSUMMARY:   Did the thing.  \nmore')).toBe('Did the thing.');
    expect(parseSummary('\n\nFirst real line\nsecond')).toBe('First real line');
    expect(parseSummary('   \n')).toBeNull();
    expect(parseSummary(null)).toBeNull();
  });

  it('truncates the fallback summary to 200 characters with an ellipsis', () => {
    const line = firstLine('x'.repeat(500))!;
    expect(line).toHaveLength(200);
    expect(line.endsWith('…')).toBe(true);
  });

  it('stores output unchanged under the cap and cuts at a character boundary above it', () => {
    const text = '  odd   spacing\n\n\tand tabs  \r\n';
    expect(capOutput(text)).toEqual({ text, truncated: false });
    const long = 'ä'.repeat(OUTPUT_CAP_BYTES); // two bytes each
    const capped = capOutput(long);
    expect(capped.truncated).toBe(true);
    expect(Buffer.byteLength(capped.text)).toBeLessThanOrEqual(OUTPUT_CAP_BYTES);
    expect(capped.text).toBe('ä'.repeat(OUTPUT_CAP_BYTES / 2));
  });

  it('numbers the output lines in order, drops empty lines, classifies nothing', () => {
    expect(outputLines('first\n\nsecond\n   \nthird')).toEqual(['first', 'second', 'third']);
    expect(outputLines(null)).toEqual([]);
    expect(outputLines('')).toEqual([]);
  });
});
