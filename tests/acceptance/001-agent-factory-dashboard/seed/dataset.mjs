// The dataset every check of this suite is written against. It is created through the product's
// own reporting API, exactly as the factory creates it, and never written to the database directly.
//
// The repository keys are deliberately unlike the product's own name, so a check for "is the
// repository shown anywhere" (S1.7) cannot be confused by the words "Agent Factory" on the page.

import { run, runStart, intervention, H, DAY, WEEK } from '../lib/report.mjs';

export const REPO_A = 'github.com/vkuras/invoice-service';
export const REPO_A_LABEL = 'invoice-service';
export const REPO_B = 'github.com/acme/shop-api';
export const REPO_B_LABEL = 'shop-api';

export const S = {
  grooming: 'In grooming',
  groomed: 'Groomed – ready for architecture',
  designed: 'Designed – ready for implementation',
  implemented: 'Implemented – ready for validation',
  validated: 'Validated',
  changes: 'Changes requested – back to implementation',
  blockedArch: 'Blocked – waiting for architecture',
  blockedReq: 'Blocked – waiting for requirements',
};

export const TITLES = {
  '001': 'Invoice OCR: multi-page PDF splitting',
  '002': 'Tenant-scoped API keys',
  '003': 'Nightly reconciliation job times out',
  '004': 'Webhook retry storm on 5xx',
  '005': 'SSO group mapping for enterprise plan',
  '006': 'Bulk export to Parquet',
  '007': 'Audit log retention policy',
  '008': 'Rate-limit headers on public API',
  '009': 'Search: fuzzy matching for customer names',
  '010': 'Usage metering events to billing',
  '011': 'Legacy import of paper invoices',
};

/** What the Attention tab must list, in this exact order (S1.3, R1). */
export const EXPECTED_ATTENTION = [
  { ticket: '003', reason: 'design gap', severity: 'blocking' },      // rule 2, idle 50 h
  { ticket: '001', reason: 'needs requirements', severity: 'blocking' }, // rule 1, idle 19 h
  { ticket: '004', reason: 'agent run failed', severity: 'check' },   // rule 3
  { ticket: '008', reason: 'idle', severity: 'review' },              // rule 7, idle 25 h
  { ticket: '002', reason: 'changes requested', severity: 'review' }, // rule 4, idle 3 h
  { ticket: '006', reason: 'loop threshold', severity: 'review' },    // rule 5, idle 2 h
  { ticket: '005', reason: 'open questions', severity: 'answer' },    // rule 6, idle 30 h
];

export const EXPECTED_CALM = ['007', '009', '010'];

/** R2: which column each ticket belongs in. */
export const EXPECTED_STAGES = {
  Grooming: ['001', '005', '008'],
  Design: ['003', '006', '009'],
  Implementation: ['002', '004'],
  Verification: ['007', '010'],
};

/** S5.4: interventions desc, then loops desc, then number asc. */
export const EXPECTED_TABLE_ORDER = ['001', '010', '005', '006', '002', '004', '007', '003', '008', '009'];

export const EXPECTED_METRICS = {
  // ticket: [loops, interventions, runs]
  '001': [2, 1, 6],
  '002': [2, 0, 6],
  '003': [0, 0, 3],
  '004': [1, 0, 4],
  '005': [1, 1, 2],
  '006': [3, 0, 5],
  '007': [1, 0, 5],
  '008': [0, 0, 1],
  '009': [0, 0, 2],
  '010': [2, 1, 6],
};

export const OUTPUT_001_VALIDATOR = [
  'STATUS: needs-groomer',
  'REQUIREMENTS: docs/requirements/001-invoice-ocr.md',
  '  indented line, kept as it is  ',
  'A line with <b>markup</b> & an "ampersand"',
  'SUMMARY: The ticket and criterion 3 contradict each other; grooming has to decide.',
].join('\n');

const agentRun = (o) => run(o);

/**
 * Monday 08:00 UTC of the ISO week `n` weeks before the week of `now`. Weekly buckets are what the
 * trends are made of, so a seed that lands in a bucket by accident makes a check depend on the
 * weekday it runs. 08:00 UTC is inside the same day in every European offset.
 */
export function mondayWeeksAgo(now, n) {
  const d = new Date(now);
  const isoMonday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7), 8, 0, 0);
  return isoMonday - n * WEEK;
}

export async function seedMain(now = Date.now(), project = REPO_A) {
  const t = (ticket, extra = {}) => ({ project, ticket, title: TITLES[ticket], ...extra });

  // 001 — blocked on requirements (R1 rule 1 wins over rule 5 and 7), one intervention
  await agentRun(t('001', { agent: 'groom', startedAt: now - 62 * H, endedAt: now - 60.6 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: Split four acceptance criteria out of the ticket text.', tokens: 14200 }));
  await agentRun(t('001', { agent: 'architect', startedAt: now - 60 * H, endedAt: now - 57.9 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Split, classify, OCR worker pool; one schema migration.', tokens: 38400 }));
  await agentRun(t('001', { agent: 'implementer', startedAt: now - 57 * H, endedAt: now - 50.7 * H, statusBefore: S.designed, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Splitter and classifier built, 31 tests green.', tokens: 96500 }));
  await agentRun(t('001', { agent: 'validator', startedAt: now - 44 * H, endedAt: now - 42.8 * H, statusBefore: S.implemented, statusAfter: S.changes, output: 'STATUS: changes-requested\nSUMMARY: Golden-set accuracy 82 % against a 95 % target.', tokens: 21800 }));
  await agentRun(t('001', { agent: 'implementer', startedAt: now - 40 * H, endedAt: now - 35.5 * H, statusBefore: S.changes, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Deskew and adaptive threshold added for low-DPI scans.', tokens: 74300 }));
  await intervention(t('001', { ts: now - 30 * H, status: S.implemented, what: 'faxes are in scope, but 90 % accuracy is fine for them' }));
  await agentRun(t('001', { agent: 'validator', startedAt: now - 22 * H, endedAt: now - 19 * H, statusBefore: S.implemented, statusAfter: S.blockedReq, output: OUTPUT_001_VALIDATOR, tokens: 19400 }));

  // 002 — changes requested (rule 4), two loops, idle 3 h
  await agentRun(t('002', { agent: 'groom', startedAt: now - 44 * H, endedAt: now - 43.1 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: Creation, rotation and revocation of keys.', tokens: 11300 }));
  await agentRun(t('002', { agent: 'architect', startedAt: now - 42 * H, endedAt: now - 40.2 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Prefix plus hashed secret, one table per tenant.', tokens: 34100 }));
  await agentRun(t('002', { agent: 'implementer', startedAt: now - 39 * H, endedAt: now - 33.8 * H, statusBefore: S.designed, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Endpoints, middleware and migration; 47 tests.', tokens: 88700 }));
  await agentRun(t('002', { agent: 'validator', startedAt: now - 32 * H, endedAt: now - 30.9 * H, statusBefore: S.implemented, statusAfter: S.changes, output: 'STATUS: changes-requested\nSUMMARY: Three findings, one of them a timing-unsafe compare.', tokens: 23600 }));
  await agentRun(t('002', { agent: 'implementer', startedAt: now - 28 * H, endedAt: now - 25.6 * H, statusBefore: S.changes, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Constant-time compare and cache invalidation fixed.', tokens: 41200 }));
  await agentRun(t('002', { agent: 'validator', startedAt: now - 4 * H, endedAt: now - 3 * H, statusBefore: S.implemented, statusAfter: S.changes, output: 'STATUS: changes-requested\nSUMMARY: The gateway has no per-route limit; the finding stands.', tokens: 17900 }));

  // 003 — blocked on architecture (rule 2), untouched longest of the blocking ones
  await agentRun(t('003', { agent: 'groom', startedAt: now - 60 * H, endedAt: now - 58.9 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: The job exceeds its 30-minute window above two million rows.', tokens: 12900 }));
  await agentRun(t('003', { agent: 'architect', startedAt: now - 57 * H, endedAt: now - 55.4 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: A chunked cursor pass, conflicting with ADR-014.', tokens: 36800 }));
  await agentRun(t('003', { agent: 'implementer', startedAt: now - 54 * H, endedAt: now - 50 * H, statusBefore: S.designed, statusAfter: S.blockedArch, output: 'STATUS: needs-architect\nSUMMARY: Chunking breaks atomicity; stopping before writing data.', tokens: 62400 }));

  // 004 — a failed agent run (rule 3)
  await agentRun(t('004', { agent: 'groom', startedAt: now - 51 * H, endedAt: now - 50 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: Backoff curve and dead-letter policy agreed.', tokens: 10400 }));
  await agentRun(t('004', { agent: 'architect', startedAt: now - 49 * H, endedAt: now - 47.5 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Exponential backoff with jitter and a circuit breaker.', tokens: 31200 }));
  await agentRun(t('004', { agent: 'implementer', startedAt: now - 46 * H, endedAt: now - 39.9 * H, statusBefore: S.designed, statusAfter: S.designed, errorString: 'Agent call failed: the integration environment lost the broker mid-run' }));
  await agentRun(t('004', { agent: 'implementer', startedAt: now - 8 * H, endedAt: now - 1 * H, statusBefore: S.designed, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Breaker and dead-letter queue shipped behind a flag.', tokens: 79800 }));

  // 005 — grooming holds open questions (rule 6 beats rule 7 although it is idle 30 h)
  await agentRun(t('005', { agent: 'groom', startedAt: now - 40 * H, endedAt: now - 38 * H, statusBefore: S.grooming, statusAfter: S.grooming, output: 'STATUS: in-grooming\nSUMMARY: Three open questions on precedence, nesting and de-provisioning.', tokens: 18700 }));
  await intervention(t('005', { ts: now - 35 * H, status: S.grooming, what: 'verschachtelte Gruppen: tiefe zuerst' }));
  await agentRun(t('005', { agent: 'groom', startedAt: now - 32 * H, endedAt: now - 30 * H, statusBefore: S.grooming, statusAfter: S.grooming, output: 'STATUS: in-grooming\nSUMMARY: Nested groups resolved; precedence still open.', tokens: 9600 }));

  // 006 — three loops, exactly the default threshold (rule 5, S7.3)
  await agentRun(t('006', { agent: 'groom', startedAt: now - 30 * H, endedAt: now - 29.2 * H, statusBefore: S.grooming, statusAfter: S.grooming, output: 'STATUS: in-grooming\nSUMMARY: Scope of one export per tenant per day.', tokens: 9800 }));
  await agentRun(t('006', { agent: 'groom', startedAt: now - 28 * H, endedAt: now - 27.4 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: S3 destination, no incremental mode.', tokens: 8700 }));
  await agentRun(t('006', { agent: 'architect', startedAt: now - 26 * H, endedAt: now - 23.8 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Streaming writer with row-group sizing per table.', tokens: 40300 }));
  await agentRun(t('006', { agent: 'architect', startedAt: now - 20 * H, endedAt: now - 18.5 * H, statusBefore: S.designed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Schema registry lookup moved out of the hot path.', tokens: 22100 }));
  await agentRun(t('006', { agent: 'architect', startedAt: now - 4 * H, endedAt: now - 2 * H, statusBefore: S.designed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Row-group sizing reworked after the third review.', tokens: 19500 }));

  // 007 — validated although an earlier run failed and it is idle 400 h (no attention at all)
  await agentRun(t('007', { agent: 'groom', startedAt: now - 5 * WEEK, endedAt: now - 5 * WEEK + 0.7 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: Retention tiers per plan and a legal-hold override.', tokens: 8900 }));
  await agentRun(t('007', { agent: 'architect', startedAt: now - 5 * WEEK + 2 * H, endedAt: now - 5 * WEEK + 3.2 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: A partitioned table with a TTL sweeper.', tokens: 26400 }));
  await agentRun(t('007', { agent: 'implementer', startedAt: now - 5 * WEEK + 5 * H, endedAt: now - 5 * WEEK + 6 * H, statusBefore: S.designed, statusAfter: S.designed, errorString: 'Agent call failed: the sandbox ran out of disk' }));
  await agentRun(t('007', { agent: 'implementer', startedAt: now - 3 * WEEK, endedAt: now - 3 * WEEK + 3.4 * H, statusBefore: S.designed, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Sweeper, hold flag and admin endpoint; 28 tests green.', tokens: 61700 }));
  await agentRun(t('007', { agent: 'validator', startedAt: now - 401 * H, endedAt: now - 400 * H, statusBefore: S.implemented, statusAfter: S.validated, output: 'STATUS: validated\nSUMMARY: Every criterion met; the hold override verified.', tokens: 18300 }));

  // 008 — untouched 25 h (rule 7 at the default threshold of 24 h, S7.3)
  await agentRun(t('008', { agent: 'groom', startedAt: now - 30 * H, endedAt: now - 25 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: Standard draft headers with a per-key window.', tokens: 10100 }));

  // 009 — nothing wrong with it (calm)
  await agentRun(t('009', { agent: 'groom', startedAt: now - 21 * H, endedAt: now - 19.9 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: Trigram threshold agreed with support.', tokens: 11900 }));
  await agentRun(t('009', { agent: 'architect', startedAt: now - 4.4 * H, endedAt: now - 2 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: pg_trgm index for now, OpenSearch later.', tokens: 42600 }));

  // 010 — the oldest ticket, validated four weeks ago (history for the trends). Its runs are
  // anchored to the Monday of their ISO week, so the first bucket of every trend has data
  // whatever weekday the suite runs on.
  const w6 = mondayWeeksAgo(now, 6);
  const w4 = mondayWeeksAgo(now, 4);
  await agentRun(t('010', { agent: 'groom', startedAt: w6, endedAt: w6 + 1.5 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: Event schema agreed with billing.', tokens: 16200 }));
  await agentRun(t('010', { agent: 'architect', startedAt: w6 + 3 * H, endedAt: w6 + 5 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Outbox table and relay, at-least-once with dedupe.', tokens: 37800 }));
  await agentRun(t('010', { agent: 'implementer', startedAt: w6 + 6 * H, endedAt: w6 + 11.8 * H, statusBefore: S.designed, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Outbox relay with backpressure; 52 tests.', tokens: 99200 }));
  await agentRun(t('010', { agent: 'validator', startedAt: w6 + 14 * H, endedAt: w6 + 15.6 * H, statusBefore: S.implemented, statusAfter: S.changes, output: 'STATUS: changes-requested\nSUMMARY: The dedupe window is too short for a 24 h retry.', tokens: 24100 }));
  await agentRun(t('010', { agent: 'implementer', startedAt: w6 + 18 * H, endedAt: w6 + 20.2 * H, statusBefore: S.changes, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Window extended to 48 h.', tokens: 38900 }));
  await intervention(t('010', { ts: w6 + 22 * H, status: S.implemented, what: 'passt so, 48h ist ok' }));
  await agentRun(t('010', { agent: 'validator', startedAt: w4, endedAt: w4 + 1.3 * H, statusBefore: S.implemented, statusAfter: S.validated, output: 'STATUS: validated\nSUMMARY: Re-validated against the 24 h retry fixture.', tokens: 20700 }));
}

/** A ticket whose history reaches 40 weeks back — for the six-month window of D4 / R8. */
export async function seedOldHistory(now = Date.now(), project = REPO_A) {
  const t = (ticket, extra = {}) => ({ project, ticket, title: TITLES[ticket], ...extra });
  await agentRun(t('011', { agent: 'groom', startedAt: now - 40 * WEEK, endedAt: now - 40 * WEEK + 1 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: Paper invoices are scanned in batches of 50.', tokens: 7700 }));
  await agentRun(t('011', { agent: 'architect', startedAt: now - 39 * WEEK, endedAt: now - 39 * WEEK + 2 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: One import worker per batch.', tokens: 15400 }));
  await agentRun(t('011', { agent: 'implementer', startedAt: now - 38 * WEEK, endedAt: now - 38 * WEEK + 4 * H, statusBefore: S.designed, statusAfter: S.implemented, output: 'STATUS: ready-for-validation\nSUMMARY: Importer built.', tokens: 51000 }));
  await agentRun(t('011', { agent: 'validator', startedAt: now - 37 * WEEK, endedAt: now - 37 * WEEK + 1 * H, statusBefore: S.implemented, statusAfter: S.validated, output: 'STATUS: validated\nSUMMARY: All criteria met.', tokens: 12000 }));
}

/** The first report of a second repository (R3, D17): the same number 001 as repository A. */
export async function seedSecondRepository(now = Date.now(), project = REPO_B) {
  const t = (ticket, title, extra = {}) => ({ project, ticket, title, ...extra });
  await agentRun(t('001', 'Checkout rewrite', { agent: 'groom', startedAt: now - 6 * H, endedAt: now - 5 * H, statusBefore: S.grooming, statusAfter: S.groomed, output: 'STATUS: groomed\nSUMMARY: One checkout page, three payment methods.', tokens: 13100 }));
  await agentRun(t('002', 'Guest orders', { agent: 'architect', startedAt: now - 4 * H, endedAt: now - 3 * H, statusBefore: S.groomed, statusAfter: S.designed, output: 'STATUS: designed\nSUMMARY: Guest orders keep the same order table.', tokens: 21000 }));
}

/** Runs that are still in progress, for "agents online" (S2, R7). */
export async function seedOpenRuns(now, project, tickets) {
  const handles = [];
  for (const [i, ticket] of tickets.entries()) {
    handles.push(
      await runStart({ project, ticket, title: 'Running right now ' + ticket, agent: ['groom', 'architect', 'implementer', 'validator'][i % 4], startedAt: now - (i + 1) * 0.5 * H, statusBefore: S.designed }),
    );
  }
  return handles;
}
