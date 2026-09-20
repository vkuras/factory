// Helpers of the stack tests: a compose project of its own (never the operator's stack), a random
// free port, HTTP through fetch, and `docker` through child_process. Needs a reachable Docker daemon.

import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');

export function docker(args: string[], opts: { input?: string; allowFail?: boolean } = {}): string {
  const r = spawnSync('docker', args, { encoding: 'utf8', input: opts.input, maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0 && !opts.allowFail) {
    throw new Error(`docker ${args.join(' ')} failed (${r.status}):\n${r.stdout}\n${r.stderr}`);
  }
  return `${r.stdout}${r.stderr}`;
}

export async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address() as { port: number };
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

export interface Stack {
  project: string;
  port: number;
  url: string;
  container: () => string;
  compose(args: string[], allowFail?: boolean): string;
  up(): void;
  waitHealthy(timeoutMs: number): Promise<number>;
  down(removeVolumes: boolean): void;
  dispose(): void;
}

/**
 * A stack started the way an operator starts it: only `.env.example` copied to an env file, then
 * `docker compose up -d`. The port and bind address are the only values changed, so that the test
 * never collides with another stack on the machine.
 */
export async function createStack(project: string): Promise<Stack> {
  const dir = mkdtempSync(join(tmpdir(), 'stack-'));
  const envFile = join(dir, '.env');
  copyFileSync(join(REPO, '.env.example'), envFile);
  const port = await freePort();
  writeFileSync(envFile, `\nDASHBOARD_PORT=${port}\nDASHBOARD_BIND=127.0.0.1\n`, { flag: 'a' });

  const compose = (args: string[], allowFail = false): string =>
    docker(['compose', '-p', project, '--env-file', envFile, '-f', join(REPO, 'docker-compose.yml'), ...args], { allowFail });
  const container = (): string => compose(['ps', '-q', 'dashboard']).trim();

  return {
    project,
    port,
    url: `http://127.0.0.1:${port}`,
    container,
    compose,
    up: () => void compose(['up', '-d']),
    async waitHealthy(timeoutMs) {
      const started = Date.now();
      for (;;) {
        const id = container();
        if (id) {
          const status = docker(['inspect', '-f', '{{.State.Health.Status}}', id], { allowFail: true }).trim();
          if (status === 'healthy') return Date.now() - started;
        }
        if (Date.now() - started > timeoutMs) throw new Error(`not healthy within ${timeoutMs} ms`);
        await new Promise((r) => setTimeout(r, 500));
      }
    },
    down: (removeVolumes) => void compose(removeVolumes ? ['down', '-v'] : ['down'], true),
    dispose: () => rmSync(dir, { recursive: true, force: true }),
  };
}

export async function get(url: string): Promise<{ status: number; text: string; ms: number }> {
  const t0 = performance.now();
  const res = await fetch(url);
  const text = await res.text();
  return { status: res.status, text, ms: performance.now() - t0 };
}

export function p95(samples: number[]): number {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]!;
}

export function metaHeader(meta: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify({ v: 1, source: 'subagent-hook', origin: 'subagent', ...meta }), 'utf8').toString('base64');
}

export async function report(base: string, path: string, meta: Record<string, unknown>, body = ''): Promise<number> {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Factory-Meta': metaHeader(meta) },
    body,
  });
  return res.status;
}

/** Parses `docker stats --no-stream` MemUsage ("58.3MiB / 256MiB") into MiB. */
export function memoryMiB(container: string): number {
  const out = execFileSync('docker', ['stats', '--no-stream', '--format', '{{.MemUsage}}', container], { encoding: 'utf8' });
  const used = out.split('/')[0]!.trim();
  const m = /^([\d.]+)\s*(B|KiB|MiB|GiB)$/.exec(used);
  if (!m) throw new Error(`cannot parse docker stats output: ${out}`);
  const n = Number(m[1]);
  return m[2] === 'GiB' ? n * 1024 : m[2] === 'MiB' ? n : m[2] === 'KiB' ? n / 1024 : n / 1024 / 1024;
}
