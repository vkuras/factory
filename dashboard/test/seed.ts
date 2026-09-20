// A small factory history reported through the real endpoints, relative to the fixed clock T0.

import { H, T0, REPO_A, reportRun, startRun, intervene, type TestApp } from './helpers.js';

const ago = (hours: number): number => T0 - hours * H;

export const S = {
  BLOCKED_REQ: 'Blocked – waiting for requirements',
  BLOCKED_ARCH: 'Blocked – waiting for architecture',
  GROOMED: 'Groomed – ready for architecture',
  DESIGNED: 'Designed – ready for implementation',
  IMPLEMENTED: 'Implemented – ready for validation',
  CHANGES: 'Changes requested – back to implementation',
  VALIDATED: 'Validated',
  GROOMING: 'In grooming',
};

/**
 * Ten tickets, one per situation of the design's worked examples:
 * 001 needs requirements (idle 40 h), 002 design gap (idle 10 h), 003 failed run, 004 changes
 * requested (idle 6 h), 005 loop threshold (idle 2 h), 006 open questions, 007 idle 30 h,
 * 008 and 009 running on their own, 010 validated after a failed run.
 */
export async function seedFactory(t: TestApp, project: string = REPO_A): Promise<void> {
  const r = (o: Parameters<typeof reportRun>[1]) => reportRun(t, { project, ...o });

  await r({ ticket: '001', title: 'Needs requirements ticket', agent: 'groom', startedAt: ago(45), endedAt: ago(44), statusBefore: S.GROOMING, statusAfter: S.GROOMED, text: 'STATUS: groomed\nSUMMARY: Groomed the ticket', tokens: 1000 });
  await r({ ticket: '001', title: 'Needs requirements ticket', agent: 'validator', startedAt: ago(41), endedAt: ago(40), statusBefore: S.IMPLEMENTED, statusAfter: S.BLOCKED_REQ, text: 'STATUS: needs-groomer\nSUMMARY: Requirement contradicts the ticket', tokens: 2000 });

  await r({ ticket: '002', title: 'Design gap ticket', agent: 'implementer', startedAt: ago(12), endedAt: ago(10), statusBefore: S.DESIGNED, statusAfter: S.BLOCKED_ARCH, text: 'STATUS: needs-architect\nSUMMARY: The design is silent', tokens: 5000 });

  await r({ ticket: '003', title: 'Failed run ticket', agent: 'implementer', startedAt: ago(5), endedAt: ago(3), statusBefore: S.DESIGNED, statusAfter: S.DESIGNED, text: 'STATUS: failed\nSUMMARY: Broker lost', tokens: 3000 });
  await r({ ticket: '003', title: 'Failed run ticket', agent: 'implementer', startedAt: ago(2.5), endedAt: ago(2), statusBefore: S.DESIGNED, statusAfter: S.IMPLEMENTED, text: 'STATUS: ready-for-validation\nSUMMARY: Re-run complete', tokens: 4000 });

  await r({ ticket: '004', title: 'Changes requested ticket', agent: 'validator', startedAt: ago(7), endedAt: ago(6), statusBefore: S.IMPLEMENTED, statusAfter: S.CHANGES, text: 'STATUS: changes-requested\nSUMMARY: 3 findings', tokens: 7000 });

  for (let i = 0; i < 4; i += 1) {
    await r({ ticket: '005', title: 'Loop ticket', agent: 'implementer', startedAt: ago(20 - i * 4), endedAt: ago(19 - i * 4), statusBefore: S.DESIGNED, statusAfter: S.DESIGNED, text: 'STATUS: ready-for-validation\nSUMMARY: Round', tokens: 100 });
  }

  await r({ ticket: '006', title: 'Open questions ticket', agent: 'groom', startedAt: ago(4), endedAt: ago(3), statusBefore: S.GROOMING, statusAfter: S.GROOMING, text: 'STATUS: in-grooming\nSUMMARY: Three open questions', tokens: 900 });

  await r({ ticket: '007', title: 'Idle ticket', agent: 'groom', startedAt: ago(31), endedAt: ago(30), statusBefore: S.GROOMING, statusAfter: S.GROOMED, text: 'STATUS: groomed\nSUMMARY: Groomed', tokens: 800 });

  await r({ ticket: '008', title: 'Calm groomed ticket', agent: 'groom', startedAt: ago(2), endedAt: ago(1), statusBefore: S.GROOMING, statusAfter: S.GROOMED, text: 'STATUS: groomed\nSUMMARY: Groomed', tokens: 700 });
  await r({ ticket: '009', title: 'Calm designed ticket', agent: 'architect', startedAt: ago(3), endedAt: ago(2), statusBefore: S.GROOMED, statusAfter: S.DESIGNED, text: 'STATUS: designed\nSUMMARY: Designed', tokens: 1600 });

  await r({ ticket: '010', title: 'Validated ticket', agent: 'implementer', startedAt: ago(100), endedAt: ago(99), statusBefore: S.DESIGNED, statusAfter: S.DESIGNED, text: 'STATUS: failed', tokens: 10 });
  await r({ ticket: '010', title: 'Validated ticket', agent: 'validator', startedAt: ago(98), endedAt: ago(97), statusBefore: S.IMPLEMENTED, statusAfter: S.VALIDATED, text: 'STATUS: validated\nSUMMARY: All criteria met', tokens: 20 });

  await intervene(t, { ticket: '001', project, ts: ago(43), what: 'Faxes are in scope, 90% is fine', source: 'session-hook', title: 'Needs requirements ticket' });
}

/** Two tickets that both run on their own. */
export async function seedCalm(t: TestApp, project: string = REPO_A): Promise<void> {
  await reportRun(t, { project, ticket: '001', title: 'Calm one', agent: 'groom', startedAt: T0 - 2 * H, endedAt: T0 - H, statusBefore: S.GROOMING, statusAfter: S.GROOMED });
  await reportRun(t, { project, ticket: '002', title: 'Calm two', agent: 'architect', startedAt: T0 - 3 * H, endedAt: T0 - 2 * H, statusBefore: S.GROOMED, statusAfter: S.DESIGNED });
}

export async function seedRunning(t: TestApp, n: number): Promise<void> {
  for (let i = 0; i < n; i += 1) {
    await startRun(t, { ticket: `10${i}`, title: `Running ${i}`, agent: 'implementer', ts: T0 - 60_000 * (i + 1), session_id: `run-${i}` });
  }
}
