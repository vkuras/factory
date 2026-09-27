import { describe, expect, it } from 'vitest';
import { AG } from '../src/domain/palette.js';
import {
  attentionOf,
  compareAttention,
  isFailedResult,
  onlineIndicator,
  stageOf,
  type AttentionInput,
} from '../src/domain/rules.js';
import type { RunLite } from '../src/domain/types.js';

const TH = { loop: 3, idleHours: 24 };
const base: AttentionInput = {
  requirementsStatus: 'Designed – ready for implementation',
  agentStatus: 'designed',
  loops: 0,
  idleHours: 1,
  failedRun: false,
};

describe('R1 attention rules (T-UNIT-R1-1…7, worked examples)', () => {
  it('rule 1: blocked waiting for requirements beats everything', () => {
    const a = attentionOf(
      { ...base, requirementsStatus: 'Blocked – waiting for requirements', loops: 5, idleHours: 40 },
      TH,
    );
    expect(a).toMatchObject({ reason: 'needs requirements', severity: 'blocking', color: '#FF6B6B' });
    expect(a?.note).toBe('Grooming needs a decision from you before anything moves.');
  });

  it('rule 2: blocked waiting for architecture is a design gap', () => {
    const a = attentionOf({ ...base, requirementsStatus: 'Blocked – waiting for architecture' }, TH);
    expect(a).toMatchObject({ reason: 'design gap', severity: 'blocking', color: '#FF6B6B' });
    expect(a?.note).toBe(
      'The implementer hit a gap the design does not cover. The architect needs a ruling before the work continues.',
    );
  });

  it('rule 3: a failed run on a ticket that is not validated', () => {
    const a = attentionOf(
      { ...base, requirementsStatus: 'Implemented – ready for validation', failedRun: true, idleHours: 2 },
      TH,
    );
    expect(a).toMatchObject({ reason: 'agent run failed', severity: 'check', color: '#F5A524' });
    expect(a?.note).toBe(
      'An agent run aborted before it finished. Worth a glance that the re-run covered everything.',
    );
  });

  it('rules 3 and 7 both exclude Validated', () => {
    expect(attentionOf({ ...base, requirementsStatus: 'Validated', failedRun: true, idleHours: 400 }, TH)).toBeNull();
  });

  it('rule 4: changes requested', () => {
    const a = attentionOf({ ...base, requirementsStatus: 'Changes requested – back to implementation' }, TH);
    expect(a).toMatchObject({ reason: 'changes requested', severity: 'review', color: '#F5A524' });
    expect(a?.note).toBe('The validator sent the ticket back to implementation with findings.');
  });

  it('rule 5: loops reach the threshold, and the note names both numbers', () => {
    const a = attentionOf({ ...base, loops: 3, idleHours: 1 }, TH);
    expect(a).toMatchObject({ reason: 'loop threshold', severity: 'review' });
    expect(a?.note).toBe(
      '3 re-runs on this ticket, over your threshold of 3. The factory is spinning rather than converging.',
    );
    expect(attentionOf({ ...base, loops: 2 }, TH)).toBeNull();
  });

  it('S7.1: a changed loop threshold changes the rule and its note', () => {
    const a = attentionOf({ ...base, loops: 2 }, { loop: 2, idleHours: 24 });
    expect(a?.note).toContain('2 re-runs on this ticket, over your threshold of 2.');
  });

  it('rule 6 precedes rule 7', () => {
    const a = attentionOf(
      { ...base, requirementsStatus: 'In grooming', agentStatus: 'in-grooming', idleHours: 30 },
      TH,
    );
    expect(a).toMatchObject({ reason: 'open questions', severity: 'answer', color: '#5BC8F5' });
    expect(a?.note).toBe('Grooming is holding open questions only you can answer.');
  });

  it('rule 7: idle at least the threshold', () => {
    const a = attentionOf(
      { ...base, requirementsStatus: 'Groomed – ready for architecture', agentStatus: 'groomed', idleHours: 25 },
      TH,
    );
    expect(a).toMatchObject({ reason: 'idle', severity: 'review' });
    expect(a?.note).toBe('No agent has touched this for 1.0d. Nothing is blocking it on paper.');
  });

  it('S7.2: the idle threshold is honoured exactly', () => {
    expect(attentionOf({ ...base, idleHours: 23.9 }, TH)).toBeNull();
    expect(attentionOf({ ...base, idleHours: 24 }, TH)?.reason).toBe('idle');
    expect(attentionOf({ ...base, idleHours: 5 }, { loop: 3, idleHours: 4 })?.reason).toBe('idle');
  });

  it('colours the badge at 12% alpha', () => {
    expect(attentionOf({ ...base, requirementsStatus: 'Blocked – waiting for requirements' }, TH)?.background).toBe('#FF6B6B1F');
  });

  it('a ticket that meets no rule needs nobody', () => {
    expect(attentionOf(base, TH)).toBeNull();
  });
});

describe('R1 ordering (T-UNIT-R1-ORD)', () => {
  const blocking = attentionOf({ ...base, requirementsStatus: 'Blocked – waiting for requirements' }, TH)!;
  const check = attentionOf({ ...base, failedRun: true }, TH)!;
  const review = attentionOf({ ...base, idleHours: 30 }, TH)!;
  const answer = attentionOf({ ...base, agentStatus: 'in-grooming' }, TH)!;

  it('sorts by severity: blocking, check, review, answer', () => {
    const items = [
      { attention: answer, idleHours: 99, number: '004' },
      { attention: review, idleHours: 99, number: '003' },
      { attention: check, idleHours: 99, number: '002' },
      { attention: blocking, idleHours: 1, number: '001' },
    ];
    expect(items.sort(compareAttention).map((i) => i.number)).toEqual(['001', '002', '003', '004']);
  });

  it('within a severity the ticket untouched longest comes first (30 h vs 50 h)', () => {
    const items = [
      { attention: blocking, idleHours: 30, number: '001' },
      { attention: blocking, idleHours: 50, number: '002' },
    ];
    expect(items.sort(compareAttention).map((i) => i.number)).toEqual(['002', '001']);
  });

  it('ties are broken by number ascending', () => {
    const items = [
      { attention: blocking, idleHours: 30, number: '010' },
      { attention: blocking, idleHours: 30, number: '002' },
    ];
    expect(items.sort(compareAttention).map((i) => i.number)).toEqual(['002', '010']);
  });
});

describe('R2 stage of a ticket (T-UNIT-R2-1)', () => {
  it.each([
    ['In grooming', 'grooming', 'groom', '#5BC8F5'],
    ['Groomed – ready for architecture', 'grooming', 'groom', '#5BC8F5'],
    ['Designed – ready for implementation', 'design', 'architect', '#A78BFA'],
    ['Implemented – ready for validation', 'implementation', 'implementer', '#F5A524'],
    ['Validated', 'verification', 'validator', '#9EE84B'],
    ['Changes requested – back to implementation', 'implementation', 'implementer', '#FF6B6B'],
    ['Blocked – waiting for architecture', 'design', 'architect', '#FF6B6B'],
    ['Blocked – waiting for requirements', 'grooming', 'groom', '#FF6B6B'],
  ])('%s -> %s / %s', (status, stage, owner, color) => {
    expect(stageOf(status, [])).toMatchObject({ stage, owner, color, statusText: status, known: true });
  });

  const run = (actor: RunLite['actor'], startedAt: number): RunLite => ({
    id: `${actor}${startedAt}`,
    projectKey: 'p',
    number: '001',
    actor,
    startedAt,
    endedAt: startedAt + 1,
    result: null,
    agentStatus: null,
    tokens: null,
  });

  it('an unknown status falls back to the stage of the newest run, in grey, status verbatim', () => {
    const info = stageOf('Waiting for the moon', [run('groom', 1), run('architect', 5)]);
    expect(info).toMatchObject({ stage: 'design', owner: 'architect', color: '#6E7887', statusText: 'Waiting for the moon', known: false });
  });

  it('a newest human run uses the newest non-human run', () => {
    expect(stageOf('weird', [run('implementer', 2), run('human', 9)])).toMatchObject({ stage: 'implementation', owner: 'implementer' });
  });

  it('a missing status shows "unknown" and no runs mean Grooming', () => {
    expect(stageOf(null, [])).toMatchObject({ stage: 'grooming', owner: 'groom', statusText: 'unknown' });
    expect(stageOf('', [])).toMatchObject({ statusText: 'unknown' });
  });
});

describe('R7 wording', () => {
  it('says how many agents are online, or that none run', () => {
    expect(onlineIndicator(0)).toEqual({ text: 'no agents running', color: '#39414D', pulsing: false });
    expect(onlineIndicator(1)).toEqual({ text: '1 agent online', color: '#9EE84B', pulsing: true });
    expect(onlineIndicator(3).text).toBe('3 agents online');
  });
});

describe('failed results and the palette', () => {
  it('counts failed and blocked-environment, not abandoned or interrupted', () => {
    expect(isFailedResult('failed')).toBe(true);
    expect(isFailedResult('blocked-environment')).toBe(true);
    expect(isFailedResult('abandoned')).toBe(false);
    expect(isFailedResult('interrupted')).toBe(false);
    expect(isFailedResult(null)).toBe(false);
  });
  it('has the five agent colours of the design', () => {
    expect(Object.values(AG).map((a) => a.color)).toEqual(['#5BC8F5', '#A78BFA', '#F5A524', '#9EE84B', '#FF7AB6']);
  });
});
