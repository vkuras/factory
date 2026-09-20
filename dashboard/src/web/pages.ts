// View models: what the templates render. Reads through `Queries`, computes with `domain/`,
// and returns plain objects. Nothing here touches the HTTP layer or the clock (`now` is passed in).

import type { Config } from '../config.js';
import type { Queries } from '../db/queries.js';
import { fmtDateTime, fmtH, fmtTok, MS_PER_HOUR, pct } from '../domain/format.js';
import { computeMetrics, inOrder, type TicketMetrics } from '../domain/metrics.js';
import { AG, STAGES, UNKNOWN_COLOR } from '../domain/palette.js';
import { repositoryView, type RepositoryView } from '../domain/repository.js';
import {
  attentionOf,
  compareAttention,
  isFailedResult,
  onlineIndicator,
  stageOf,
  type Attention,
  type OnlineIndicator,
  type StageInfo,
} from '../domain/rules.js';
import { computeTrendCards, type TrendCard } from '../domain/trends.js';
import {
  AGENTS,
  ticketKey,
  type Actor,
  type RunLite,
  type RunRecord,
  type StatusEvent,
  type TicketRecord,
} from '../domain/types.js';

export type TabKey = 'attention' | 'pipeline' | 'analytics';
export const TABS: readonly { key: TabKey; label: string }[] = [
  { key: 'attention', label: 'Attention' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'analytics', label: 'Analytics' },
];

export function parseTab(value: unknown): TabKey {
  return value === 'pipeline' || value === 'analytics' ? value : 'attention';
}

/** A ticket as every list shows it; the `ticketId` partial reads `number` and `repoLabel`. */
export interface TicketCard {
  number: string;
  projectKey: string;
  repoLabel: string | null;
  title: string;
  href: string;
  statusText: string;
  statusColor: string;
  ownerLabel: string;
  ownerColor: string;
  idleLabel: string;
  elapsedLabel: string;
  loops: number;
  interventions: number;
  tokensLabel: string;
}

export interface AttentionCard extends TicketCard {
  attention: Attention;
}

export interface PipelineColumn {
  label: string;
  color: string;
  hint: string;
  count: number;
  tickets: TicketCard[];
}

export interface TableRow {
  card: TicketCard;
  interventions: number;
  loops: number;
  leadLabel: string;
  computeLabel: string;
  tokensLabel: string;
  wInt: string;
  wLoop: string;
  wLead: string;
  wComp: string;
}

export interface BarRow {
  label: string;
  color: string;
  value: string;
  width: string;
}

export interface OverviewModel {
  online: OnlineIndicator;
  empty: boolean;
  activeTab: TabKey;
  tabs: { key: TabKey; label: string; count: number }[];
  attention: AttentionCard[];
  calm: TicketCard[];
  pipeline: PipelineColumn[];
  trends: TrendCard[];
  table: TableRow[];
  agentSpend: BarRow[];
  bounces: BarRow[];
}

interface Loaded {
  tickets: TicketRecord[];
  runsByTicket: Map<string, RunLite[]>;
  allRuns: RunLite[];
  repo: RepositoryView;
  online: number;
}

/** An open run older than the stale window is `abandoned` even before the sweeper got to it. */
export function withStaleness<T extends RunLite>(runs: T[], now: number, staleHours: number): T[] {
  const cutoff = now - staleHours * MS_PER_HOUR;
  return runs.map((r) =>
    r.endedAt === null && r.result === null && r.startedAt < cutoff ? { ...r, result: 'abandoned' } : r,
  );
}

function load(q: Queries, cfg: Config, now: number): Loaded {
  const tickets = q.listTickets();
  const allRuns = withStaleness(q.listRunsLite(), now, cfg.runStaleHours);
  const runsByTicket = new Map<string, RunLite[]>();
  for (const r of allRuns) {
    const key = ticketKey(r.projectKey, r.number);
    const list = runsByTicket.get(key);
    if (list) list.push(r);
    else runsByTicket.set(key, [r]);
  }
  return {
    tickets,
    runsByTicket,
    allRuns,
    repo: repositoryView(q.listRepositoryKeys()),
    online: q.countOnline(now - cfg.runStaleHours * MS_PER_HOUR),
  };
}

/** Every link to a ticket: the short form while no repository is shown, else the canonical one. */
export function ticketHref(showRepo: boolean, projectKey: string, number: string, from: TabKey): string {
  const n = encodeURIComponent(number);
  return showRepo
    ? `/ticket/${encodeURIComponent(projectKey)}/${n}?from=${from}`
    : `/ticket/${n}?from=${from}`;
}

interface Entry {
  ticket: TicketRecord;
  runs: RunLite[];
  metrics: TicketMetrics;
  stage: StageInfo;
}

function card(entry: Entry, repo: RepositoryView, from: TabKey): TicketCard {
  const { ticket, metrics, stage } = entry;
  return {
    number: ticket.number,
    projectKey: ticket.projectKey,
    repoLabel: repo.show ? repo.labelOf(ticket.projectKey) : null,
    title: ticket.title,
    href: ticketHref(repo.show, ticket.projectKey, ticket.number, from),
    statusText: stage.statusText,
    statusColor: stage.color,
    ownerLabel: AG[stage.owner].label,
    ownerColor: AG[stage.owner].color,
    idleLabel: fmtH(metrics.idleHours),
    elapsedLabel: fmtH(metrics.leadTimeHours),
    loops: metrics.loops,
    interventions: metrics.interventions,
    tokensLabel: fmtTok(metrics.tokens),
  };
}

function barRows(rows: { label: string; color: string; value: string; amount: number }[], max: number): BarRow[] {
  return rows.map((r) => ({ label: r.label, color: r.color, value: r.value, width: pct(r.amount, max) }));
}

export function buildOverview(q: Queries, cfg: Config, now: number, tab: TabKey): OverviewModel {
  const data = load(q, cfg, now);
  const entries: Entry[] = data.tickets.map((ticket) => {
    const runs = data.runsByTicket.get(ticketKey(ticket.projectKey, ticket.number)) ?? [];
    return {
      ticket,
      runs,
      metrics: computeMetrics(ticket, runs, now),
      stage: stageOf(ticket.requirementsStatus, runs),
    };
  });

  const attention: (AttentionCard & { idleHours: number })[] = [];
  const calmEntries: Entry[] = [];
  for (const e of entries) {
    const a = attentionOf(
      {
        requirementsStatus: e.ticket.requirementsStatus,
        agentStatus: e.ticket.agentStatus,
        loops: e.metrics.loops,
        idleHours: e.metrics.idleHours,
        failedRun: e.runs.some((r) => isFailedResult(r.result)),
      },
      { loop: cfg.loopThreshold, idleHours: cfg.idleHours },
    );
    if (a) attention.push({ ...card(e, data.repo, 'attention'), attention: a, idleHours: e.metrics.idleHours });
    else calmEntries.push(e);
  }
  attention.sort((a, b) => compareAttention(a, b));
  calmEntries.sort(
    (a, b) => b.ticket.lastActivityAt - a.ticket.lastActivityAt || cmp(a.ticket.number, b.ticket.number),
  );

  const byLastActivity = [...entries].sort(
    (a, b) => b.ticket.lastActivityAt - a.ticket.lastActivityAt || cmp(a.ticket.number, b.ticket.number),
  );
  const pipeline: PipelineColumn[] = STAGES.map((s) => {
    const list = byLastActivity.filter((e) => e.stage.stage === s.key);
    return {
      label: s.label,
      color: s.color,
      hint: s.hint,
      count: list.length,
      tickets: list.map((e) => card(e, data.repo, 'pipeline')),
    };
  });

  const maxI = Math.max(1, ...entries.map((e) => e.metrics.interventions));
  const maxL = Math.max(1, ...entries.map((e) => e.metrics.loops));
  const maxLead = Math.max(0, ...entries.map((e) => e.metrics.leadTimeHours));
  const maxComp = Math.max(0, ...entries.map((e) => e.metrics.workingTimeHours));
  const table: TableRow[] = [...entries]
    .sort(
      (a, b) =>
        b.metrics.interventions - a.metrics.interventions ||
        b.metrics.loops - a.metrics.loops ||
        cmp(a.ticket.number, b.ticket.number),
    )
    .map((e) => ({
      card: card(e, data.repo, 'analytics'),
      interventions: e.metrics.interventions,
      loops: e.metrics.loops,
      leadLabel: fmtH(e.metrics.leadTimeHours),
      computeLabel: fmtH(e.metrics.workingTimeHours),
      tokensLabel: fmtTok(e.metrics.tokens),
      wInt: pct(e.metrics.interventions, maxI),
      wLoop: pct(e.metrics.loops, maxL),
      wLead: pct(e.metrics.leadTimeHours, maxLead),
      wComp: pct(e.metrics.workingTimeHours, maxComp),
    }));

  const spend = new Map<Actor, { tokens: number; time: number }>();
  for (const e of entries) {
    for (const [agent, s] of Object.entries(e.metrics.byAgent) as [Actor, { tokens: number; timeHours: number }][]) {
      const total = spend.get(agent) ?? { tokens: 0, time: 0 };
      total.tokens += s.tokens;
      total.time += s.timeHours;
      spend.set(agent, total);
    }
  }
  const maxSpend = Math.max(0, ...[...spend.values()].map((s) => s.tokens));
  const agentSpend = barRows(
    AGENTS.filter((a) => spend.has(a)).map((a) => ({
      label: AG[a].label,
      color: AG[a].color,
      value: `${fmtTok(spend.get(a)!.tokens)} · ${fmtH(spend.get(a)!.time)}`,
      amount: spend.get(a)!.tokens,
    })),
    maxSpend,
  );

  const count = (pred: (r: RunLite) => boolean): number => data.allRuns.filter(pred).length;
  const bounceDefs = [
    { label: 'validator → implementer', color: '#F5A524', n: count((r) => r.actor === 'validator' && r.result === 'changes-requested') },
    { label: 'validator → architect', color: '#A78BFA', n: count((r) => r.actor === 'validator' && r.result === 'needs-architect') },
    { label: 'validator → groom', color: '#5BC8F5', n: count((r) => r.actor === 'validator' && r.result === 'needs-groomer') },
    { label: 'implementer → architect', color: '#A78BFA', n: count((r) => r.actor === 'implementer' && r.result === 'needs-architect') },
    { label: 'agent run failed', color: '#FF6B6B', n: count((r) => isFailedResult(r.result)) },
  ];
  const maxBounce = Math.max(1, ...bounceDefs.map((b) => b.n));
  const bounces = barRows(
    bounceDefs.map((b) => ({ label: b.label, color: b.color, value: `${b.n}x`, amount: b.n })),
    maxBounce,
  );

  return {
    online: onlineIndicator(data.online),
    empty: entries.length === 0,
    activeTab: tab,
    tabs: [
      { key: 'attention', label: 'Attention', count: attention.length },
      { key: 'pipeline', label: 'Pipeline', count: entries.length },
      { key: 'analytics', label: 'Analytics', count: entries.length },
    ],
    attention,
    calm: calmEntries.map((e) => card(e, data.repo, 'attention')),
    pipeline,
    trends: entries.length === 0 ? [] : computeTrendCards(data.allRuns, data.tickets, now, cfg.tz),
    table,
    agentSpend,
    bounces,
  };
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// ---------------------------------------------------------------- detail

export interface LaneBlock {
  left: string;
  width: string;
  background: string;
  border: string;
  color: string;
  label: string;
  title: string;
}

export interface Lane {
  label: string;
  color: string;
  blocks: LaneBlock[];
}

export interface LogEntry {
  agentLabel: string;
  color: string;
  result: string;
  statusBg: string;
  timeLabel: string;
  timeTitle: string;
  durLabel: string;
  tokensLabel: string;
  summary: string;
  transition: string | null;
  runMeta: string;
  steps: { n: string; text: string }[];
  isHuman: boolean;
  finalLabel: string;
  verdict: string;
}

export interface DetailModel {
  online: OnlineIndicator;
  card: TicketCard;
  from: TabKey;
  statusColor: string;
  statusBg: string;
  agentStatus: string;
  ownerColor: string;
  metrics: { label: string; value: string; color: string }[];
  spanLabel: string;
  lanes: Lane[];
  ticks: string[];
  legend: { label: string; color: string }[];
  log: LogEntry[];
  tokenBars: BarRow[];
  humanLog: { text: string; timeLabel: string }[];
  trail: { label: string; color: string }[];
}

const LANE_ORDER: Actor[] = ['groom', 'architect', 'implementer', 'validator', 'human'];
const STATUS_COLOR_OF = (status: string): string => {
  const info = stageOf(status, []);
  return info.known ? info.color : UNKNOWN_COLOR;
};

function tokensText(tokens: number | null, suffix: string): string {
  if (tokens === null) return '—';
  return tokens === 0 ? 'no tokens' : fmtTok(tokens) + suffix;
}

export function outputLines(output: string | null): string[] {
  if (output === null) return [];
  return output.split('\n').filter((line) => line.trim() !== '');
}

export function buildDetail(
  q: Queries,
  cfg: Config,
  now: number,
  projectKey: string,
  number: string,
  from: TabKey,
): DetailModel | null {
  const ticket = q.getTicket(projectKey, number);
  if (!ticket) return null;
  const runs = withStaleness(q.runsOfTicket(projectKey, number), now, cfg.runStaleHours);
  const trail: StatusEvent[] = q.statusTrail(projectKey, number);
  const repo = repositoryView(q.listRepositoryKeys());
  const metrics = computeMetrics(ticket, runs, now);
  const stage = stageOf(ticket.requirementsStatus, runs);
  const cardModel = card({ ticket, runs, metrics, stage }, repo, from);

  const t0 = ticket.firstSeenAt;
  const endOf = (r: RunRecord): number =>
    r.endedAt ?? (r.result === 'abandoned' ? r.startedAt : now);
  const spanMs = Math.max(1, ...runs.map(endOf).map((e) => e - t0));
  const spanH = spanMs / MS_PER_HOUR;

  const ordered = inOrder(runs);
  const runNo = new Map<string, number>();
  const seen = new Map<Actor, number>();
  for (const r of ordered) {
    const k = (seen.get(r.actor) ?? 0) + 1;
    seen.set(r.actor, k);
    runNo.set(r.id, k);
  }

  const lanes: Lane[] = LANE_ORDER.map((actor) => ({
    label: AG[actor].label,
    color: AG[actor].color,
    blocks: ordered
      .filter((r) => r.actor === actor)
      .map((r) => {
        const durMs = Math.max(0, endOf(r) - r.startedAt);
        const width = Math.max(3.5, (durMs / spanMs) * 100);
        const left = Math.min(Math.max(0, ((r.startedAt - t0) / spanMs) * 100), 100 - width);
        const bad = r.result === 'failed' || r.result === 'blocked-environment' || r.result === 'abandoned';
        const resultText = r.result ?? 'running';
        const c = AG[actor].color;
        return {
          left: left + '%',
          width: width + '%',
          background: c + (bad ? '18' : '2E'),
          border: bad ? '#FF6B6B' : c + '77',
          color: bad ? '#FF9B9B' : c,
          label: width >= 11 ? resultText : '',
          title: `${AG[actor].label} · ${resultText} · t+${fmtH((r.startedAt - t0) / MS_PER_HOUR)} · ${fmtH(durMs / MS_PER_HOUR)}`,
        };
      }),
  }));

  const log: LogEntry[] = [...ordered].reverse().map((r) => {
    const human = r.actor === 'human';
    const finished = r.endedAt !== null;
    const durH = finished ? (r.endedAt! - r.startedAt) / MS_PER_HOUR : null;
    const lines = human ? (r.output ? [r.output] : []) : outputLines(r.output);
    const moved = r.statusAfter !== null && r.statusAfter !== r.statusBefore;
    const stepsText = `${lines.length} ${lines.length === 1 ? 'step' : 'steps'}`;
    return {
      agentLabel: AG[r.actor].label,
      color: AG[r.actor].color,
      result: r.result ?? 'running',
      statusBg: AG[r.actor].color + '1F',
      timeLabel: 't+' + fmtH((r.startedAt - t0) / MS_PER_HOUR),
      timeTitle: fmtDateTime(r.startedAt, cfg.tz),
      durLabel: fmtH(durH),
      tokensLabel: r.tokens === null ? '—' : r.tokens === 0 ? 'no tokens' : fmtTok(r.tokens) + ' tok',
      summary: r.summary ?? '—',
      transition: moved ? r.statusAfter : null,
      runMeta: human
        ? 'manual · 1 step · 0m · no tokens'
        : `run #${runNo.get(r.id)} · ${stepsText} · ${fmtH(durH)} · ${tokensText(r.tokens, ' tokens')}`,
      steps: lines.map((text, i) => ({ n: String(i + 1).padStart(2, '0'), text })),
      isHuman: human,
      finalLabel: human ? 'Your note' : 'Final output',
      verdict: moved ? `Ticket moved to "${r.statusAfter}"` : 'No status change',
    };
  });

  const tokenAgents = LANE_ORDER.filter((a) => metrics.byAgent[a]);
  const maxTok = Math.max(0, ...tokenAgents.map((a) => metrics.byAgent[a]!.tokens));
  const tokenBars = barRows(
    tokenAgents.map((a) => ({
      label: AG[a].label,
      color: AG[a].color,
      value: fmtTok(metrics.byAgent[a]!.tokens),
      amount: metrics.byAgent[a]!.tokens,
    })),
    maxTok,
  );

  return {
    online: onlineIndicator(q.countOnline(now - cfg.runStaleHours * MS_PER_HOUR)),
    card: cardModel,
    from,
    statusColor: stage.color,
    statusBg: stage.color + '1F',
    agentStatus: ticket.agentStatus ?? '—',
    ownerColor: AG[stage.owner].color,
    metrics: [
      { label: 'lead time', value: fmtH(metrics.leadTimeHours), color: '#E6E9EE' },
      { label: 'agent compute', value: fmtH(metrics.workingTimeHours), color: '#9EE84B' },
      { label: 'loops', value: String(metrics.loops), color: metrics.loops >= cfg.loopThreshold ? '#F5A524' : '#E6E9EE' },
      { label: 'your calls', value: String(metrics.interventions), color: metrics.interventions > 0 ? '#FF7AB6' : '#E6E9EE' },
      { label: 'tokens', value: fmtTok(metrics.tokens), color: '#5BC8F5' },
      { label: 'runs', value: String(metrics.runs), color: '#E6E9EE' },
    ],
    spanLabel: `span ${fmtH(spanH)} · ${metrics.runs} agent runs`,
    lanes,
    ticks: [0, 1, 2, 3, 4, 5].map((i) => fmtH((spanH * i) / 5)),
    legend: LANE_ORDER.map((a) => ({ label: AG[a].label, color: AG[a].color })),
    log,
    tokenBars,
    humanLog: ordered
      .filter((r) => r.actor === 'human')
      .map((r) => ({ text: r.output ?? '', timeLabel: 't+' + fmtH((r.startedAt - t0) / MS_PER_HOUR) })),
    trail: trail.map((e) => ({ label: e.status, color: STATUS_COLOR_OF(e.status) })),
  };
}

export interface ResolvedTicket {
  projectKey: string;
  number: string;
}

/** `/ticket/:number`: the one ticket with that number, or the most recently active of several. */
export function resolveShortLink(q: Queries, number: string): { ticket: ResolvedTicket; ambiguous: boolean } | null {
  const found = q.ticketsByNumber(number);
  const first = found[0];
  if (!first) return null;
  return { ticket: { projectKey: first.projectKey, number: first.number }, ambiguous: found.length > 1 };
}

export function canonicalPath(projectKey: string, number: string, from: TabKey): string {
  return `/ticket/${encodeURIComponent(projectKey)}/${encodeURIComponent(number)}?from=${from}`;
}
