// Black-box client for the dashboard: it speaks the same two interfaces the product has —
// the factory's reporting API and the operator's browser (plain HTTP here, a real browser in ui/).
// It never imports product code and never touches the database.

export const BASE = (process.env.BASE || 'http://127.0.0.1:8787').replace(/\/$/, '');

const meta64 = (o) => Buffer.from(JSON.stringify(o), 'utf8').toString('base64');

let seq = 0;
const nextId = (p) => `${p}-${Date.now().toString(36)}-${++seq}`;

export async function post(path, meta, body = '') {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Factory-Meta': meta64(meta) },
    body,
  });
  // drain, so the socket is reused
  await res.text();
  return res;
}

function baseMeta(t, event, ts) {
  return {
    v: 1,
    event,
    ts,
    project: t.project,
    repo_path: t.repoPath || '/home/pi/repos/' + t.project.split('/').pop(),
    ticket: t.ticket,
    title: t.title,
    slug: t.slug || 'ticket-' + t.ticket,
    driver: t.driver || 'acceptance',
  };
}

/** One agent run that has started and not finished yet (S2, R7). */
export async function runStart(t) {
  const session = t.session || nextId('sess');
  const toolUse = t.toolUse || nextId('toolu');
  const res = await post('/api/hook/run-start', {
    ...baseMeta(t, 'run-start', t.startedAt),
    agent: t.agent,
    req_status: t.statusBefore,
    source: t.source || 'subagent-hook',
    origin: t.origin || 'subagent',
    session_id: session,
    tool_use_id: toolUse,
  });
  if (res.status !== 204) throw new Error(`run-start ${t.ticket} -> ${res.status}`);
  return { session, toolUse };
}

/** The finish of a run, the way a Claude Code subagent hook delivers it. */
export async function runFinish(t, handle) {
  const body = t.errorString
    ? JSON.stringify({ error: t.errorString })
    : JSON.stringify({
        tool_response: {
          content: [{ type: 'text', text: t.output }],
          ...(t.tokens == null ? {} : { totalTokens: t.tokens }),
        },
      });
  const res = await post(
    '/api/hook/run-finish',
    {
      ...baseMeta(t, 'run-finish', t.endedAt),
      agent: t.agent,
      req_status: t.statusAfter,
      source: t.source || 'subagent-hook',
      origin: t.origin || 'subagent',
      session_id: handle.session,
      tool_use_id: handle.toolUse,
    },
    body,
  );
  if (res.status !== 204) throw new Error(`run-finish ${t.ticket} -> ${res.status}`);
}

/** A complete agent run: start and finish. */
export async function run(t) {
  const handle = await runStart(t);
  await runFinish(t, handle);
  return handle;
}

/** One message the operator typed in a running session (R4, D19). */
export async function intervention(t) {
  const res = await post('/api/intervention', {
    ...baseMeta(t, 'intervention', t.ts),
    req_status: t.status,
    source: t.source || 'session-hook',
    what: t.what,
  });
  if (res.status !== 204) throw new Error(`intervention ${t.ticket} -> ${res.status}`);
}

export async function health() {
  const res = await fetch(BASE + '/healthz');
  return res.json();
}

export async function page(path) {
  const res = await fetch(BASE + path, { redirect: 'manual' });
  const html = await res.text();
  return { status: res.status, headers: res.headers, html, text: asText(html) };
}

/** Visible text of a page, whitespace collapsed — enough for "is this string on the screen". */
export function asText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export const H = 3600000;
export const DAY = 24 * H;
export const WEEK = 7 * DAY;
