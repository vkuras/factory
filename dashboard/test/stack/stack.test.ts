// The tests that need Docker: T-DEPLOY-1, T-PERF-1, T-PERF-2, T-RES-1, T-ARCH-1.
//   npm run test:stack
// One stack, started the way an operator starts it, in a compose project of its own.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createStack,
  docker,
  get,
  memoryMiB,
  p95,
  report,
  REPO,
  type Stack,
} from './stack.js';

const H = 3_600_000;
const DAY = 24 * H;
const PROJECT = `dash-stack-${process.pid}`;

let stack: Stack;
let heaviestTicket = '';

beforeAll(async () => {
  stack = await createStack(PROJECT);
  stack.down(true);
  stack.compose(['build']);
}, 900_000);

afterAll(() => {
  stack?.down(true);
  stack?.dispose();
}, 120_000);

describe('T-DEPLOY-1: docker compose up -d is the whole start', () => {
  it('reaches healthy within 60 s and answers 200 with the empty state', async () => {
    const t0 = Date.now();
    stack.up();
    const ms = await stack.waitHealthy(60_000);
    expect(Date.now() - t0).toBeLessThan(60_000);
    console.log(`healthy after ${ms} ms`);
    const res = await get(`${stack.url}/`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Nothing here yet.');
    expect(res.text).toContain('no agents running');
    const health = JSON.parse((await get(`${stack.url}/healthz`)).text) as Record<string, unknown>;
    expect(health).toMatchObject({ status: 'ok', tickets: 0, openRuns: 0 });
  });

  it('a report creates a ticket, and it is still there after down and up (volume persistence)', async () => {
    const meta = { event: 'run-start', ts: Date.now(), project: 'github.com/vkuras/factory', ticket: '001', title: 'Persisted ticket', agent: 'groom', session_id: 's1', req_status: 'In grooming' };
    expect(await report(stack.url, '/api/hook/run-start', meta, '{}')).toBe(204);
    expect((await get(`${stack.url}/`)).text).toContain('Persisted ticket');

    stack.down(false);
    stack.up();
    await stack.waitHealthy(60_000);
    const after = await get(`${stack.url}/`);
    expect(after.text).toContain('Persisted ticket');
    expect(after.text).not.toContain('Nothing here yet.');
    expect(stack.compose(['config', '--volumes']).trim()).toBe('dashboard-data');
  });

  it('runs as the non-root node user with the pinned limits', () => {
    const id = stack.container();
    expect(docker(['exec', id, 'id', '-un']).trim()).toBe('node');
    expect(docker(['inspect', '-f', '{{.HostConfig.Memory}} {{.HostConfig.NanoCpus}}', id]).trim()).toBe(`${256 * 1024 * 1024} 1000000000`);
    expect(docker(['inspect', '-f', '{{.HostConfig.RestartPolicy.Name}}', id]).trim()).toBe('unless-stopped');
  });
});

describe('seeded with 300 tickets / 3 000 runs / 26 weeks (T-PERF-1, T-PERF-2, T-RES-1)', () => {
  beforeAll(async () => {
    stack.down(true);
    stack.up();
    await stack.waitHealthy(60_000);

    const now = Date.now();
    const project = 'github.com/vkuras/factory';
    const agents = ['groom', 'architect', 'implementer', 'validator'] as const;
    const statuses = ['Groomed – ready for architecture', 'Designed – ready for implementation', 'Implemented – ready for validation', 'Changes requested – back to implementation', 'Validated'];
    const output = (n: number): string =>
      `${'A line of what the agent did, roughly eighty characters long, to reach four kilobytes.\n'.repeat(45)}STATUS: ready-for-validation\nSUMMARY: run ${n}`;
    let runs = 0;
    let heaviest = 0;

    for (let t = 1; t <= 300; t += 1) {
      const number = String(t).padStart(3, '0');
      const count = t === 1 ? 120 : t <= 200 ? 10 : 9; // 120 + 199*10 + 100*9 = 3010
      const span = (1 + (t % 25)) * 7 * DAY; // every ticket lives inside the 26-week window
      const first = now - 26 * 7 * DAY + (t % 26) * 7 * DAY * 0.9;
      const status = statuses[t % statuses.length]!;
      for (let r = 0; r < count; r += 1) {
        const agent = agents[r % 4]!;
        const start = Math.min(now - H, first + (span / count) * r);
        const session = `s-${t}-${r}`;
        const base = { project, ticket: number, title: `Seeded ticket ${number}`, session_id: session, tool_use_id: `tu-${t}-${r}` };
        await report(stack.url, '/api/hook/run-start', { ...base, event: 'run-start', ts: start, agent, req_status: status }, '{}');
        const payload = JSON.stringify({ tool_response: { content: [{ type: 'text', text: output(runs) }], totalTokens: 5000 + r * 100 } });
        await report(stack.url, '/api/hook/run-finish', { ...base, event: 'run-finish', ts: start + 20 * 60_000, req_status: status }, payload);
        runs += 1;
      }
      if (t % 7 === 0) {
        await report(stack.url, '/api/intervention', { event: 'intervention', ts: first + H, project, ticket: number, what: `Operator note on ${number}`, source: 'session-hook' });
      }
      if (count > heaviest) {
        heaviest = count;
        heaviestTicket = number;
      }
    }
    const health = JSON.parse((await get(`${stack.url}/healthz`)).text) as { tickets: number };
    expect(health.tickets).toBe(300);
    expect(runs).toBeGreaterThanOrEqual(3000);
  }, 900_000);

  it('T-PERF-1: GET /?tab=analytics p95 < 300 ms over 100 requests, at --cpus=1 --memory=256m', async () => {
    await get(`${stack.url}/?tab=analytics`); // warm the template cache like an operator's first visit would
    const samples: number[] = [];
    for (let i = 0; i < 100; i += 1) {
      const res = await get(`${stack.url}/?tab=analytics`);
      expect(res.status).toBe(200);
      samples.push(res.ms);
    }
    const value = p95(samples);
    console.log(`T-PERF-1 GET /?tab=analytics p95=${value.toFixed(1)} ms max=${Math.max(...samples).toFixed(1)} ms`);
    expect(value).toBeLessThan(300);
  }, 120_000);

  it('T-PERF-2: GET /ticket/... of the ticket with the most runs, p95 < 200 ms over 100 requests', async () => {
    const path = `/ticket/${heaviestTicket}`;
    const first = await get(`${stack.url}${path}`);
    expect(first.status).toBe(200);
    expect((first.text.match(/<details/g) ?? []).length).toBe(120); // one <details> per run
    const samples: number[] = [];
    for (let i = 0; i < 100; i += 1) samples.push((await get(`${stack.url}${path}`)).ms);
    const value = p95(samples);
    console.log(`T-PERF-2 GET ${path} (120 runs) p95=${value.toFixed(1)} ms max=${Math.max(...samples).toFixed(1)} ms`);
    expect(value).toBeLessThan(200);
  }, 120_000);

  it('T-RES-1: 200 requests across all tabs keep the container under 256 MB and never OOM-kill it', async () => {
    const id = stack.container();
    const paths = ['/', '/?tab=pipeline', '/?tab=analytics', `/ticket/${heaviestTicket}`, '/ticket/150'];
    let peak = memoryMiB(id);
    for (let i = 0; i < 200; i += 1) {
      const res = await get(`${stack.url}${paths[i % paths.length]}`);
      expect(res.status).toBe(200);
      if (i % 10 === 0) peak = Math.max(peak, memoryMiB(id));
    }
    peak = Math.max(peak, memoryMiB(id));
    console.log(`T-RES-1 peak memory ${peak.toFixed(1)} MiB of 256 MiB`);
    expect(peak).toBeLessThan(256);
    expect(docker(['inspect', '-f', '{{.State.OOMKilled}} {{.RestartCount}} {{.State.Status}}', id]).trim()).toBe('false 0 running');
  }, 180_000);
});

describe('T-ARCH-1: the image exists for the target CPU and compiles nothing', () => {
  it('builds for linux/arm64, shows no compilation of better-sqlite3, and loads prebuilds/linux-arm64.node', () => {
    const tag = `${PROJECT}-arm64`;
    const log = docker(['buildx', 'build', '--platform', 'linux/arm64', '--load', '--no-cache', '--progress=plain', '-t', tag, `${REPO}/dashboard`]);
    try {
      expect(log).not.toMatch(/node-gyp|gyp info|make: Entering|g\+\+|gcc /);
      expect(docker(['image', 'inspect', '-f', '{{.Architecture}}', tag]).trim()).toBe('arm64');
      const loaded = docker([
        'run', '--rm', '--platform', 'linux/arm64', '-e', 'DB_PATH=/tmp/x.sqlite', tag, 'node', '-e',
        `const D=require('better-sqlite3');const d=new D(':memory:');d.prepare('select 1').get();
         const so=process.report.getReport().sharedObjects.filter(p=>p.includes('better-sqlite3'));
         console.log(JSON.stringify(so));`,
      ]).trim();
      const objects = JSON.parse(loaded.split('\n').pop()!) as string[];
      expect(objects.length).toBe(1);
      expect(objects[0]).toMatch(/better-sqlite3\/prebuilds\/linux-arm64\.node$/);
      // no compiler in the final image
      expect(docker(['run', '--rm', '--platform', 'linux/arm64', tag, 'sh', '-c', 'command -v gcc g++ make python3 || echo none'], { allowFail: true }).trim()).toBe('none');
    } finally {
      docker(['image', 'rm', '-f', tag], { allowFail: true });
    }
  }, 900_000);
});
