import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Config {
  port: number;
  dbPath: string;
  tz: string;
  loopThreshold: number;
  idleHours: number;
  runStaleHours: number;
  ingestToken: string;
  bind: string;
  version: string;
}

export class ConfigError extends Error {}

function readInt(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  if (!/^[0-9]+$/.test(raw.trim())) {
    throw new ConfigError(`${name} must be an integer >= 1, got "${raw}"`);
  }
  const value = Number(raw.trim());
  if (value < 1) throw new ConfigError(`${name} must be an integer >= 1, got "${raw}"`);
  return value;
}

function packageVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    for (const rel of ['..', '../..']) {
      try {
        const pkg = JSON.parse(readFileSync(join(here, rel, 'package.json'), 'utf8')) as {
          version?: string;
        };
        if (pkg.version) return pkg.version;
      } catch {
        // try the next location
      }
    }
  } catch {
    // fall through
  }
  return '0.0.0';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const tz = (env['TZ'] ?? '').trim() || 'Europe/Berlin';
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz });
  } catch {
    throw new ConfigError(`TZ is not a known time zone: "${tz}"`);
  }
  return {
    port: readInt(env, 'PORT', 8787),
    dbPath: (env['DB_PATH'] ?? '').trim() || '/data/factory.sqlite',
    tz,
    loopThreshold: readInt(env, 'LOOP_THRESHOLD', 3),
    idleHours: readInt(env, 'IDLE_HOURS', 24),
    runStaleHours: readInt(env, 'RUN_STALE_HOURS', 12),
    ingestToken: env['FACTORY_INGEST_TOKEN'] ?? '',
    bind: (env['DASHBOARD_BIND'] ?? '').trim() || '0.0.0.0',
    version: packageVersion(),
  };
}

export function isLoopback(address: string): boolean {
  return address === '127.0.0.1' || address === '::1' || address === 'localhost';
}
