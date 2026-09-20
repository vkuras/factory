import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboard = new URL('..', import.meta.url).pathname;
const repo = join(dashboard, '..');
const read = (p: string): string => readFileSync(p, 'utf8');
const pkg = JSON.parse(read(join(dashboard, 'package.json'))) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

// The versions of design §Dependency currency, checked against the registries on 2026-09-20.
const DESIGN: Record<string, string> = {
  express: '5.2.1',
  ejs: '6.0.1',
  'better-sqlite3': '13.0.3',
  typescript: '7.0.2',
  vitest: '5.0.1',
  supertest: '7.2.2',
  cheerio: '1.2.0',
  '@types/node': '26.6.2',
  '@types/express': '5.0.6',
  '@fontsource/ibm-plex-sans': '5.3.0',
  '@fontsource/ibm-plex-mono': '5.3.0',
};

// T-DEP-1
describe('every runtime, image and library is the newest stable one and pinned exactly (SC9, ADR-0009)', () => {
  it('pins every dependency in package.json exactly, to the design\'s version', () => {
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(all).sort()).toEqual(Object.keys(DESIGN).sort());
    for (const [name, version] of Object.entries(all)) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+$/);
      expect(version, name).toBe(DESIGN[name]);
    }
  });

  it('has exactly three production dependencies', () => {
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['better-sqlite3', 'ejs', 'express']);
  });

  it('locks the same versions', () => {
    const lock = JSON.parse(read(join(dashboard, 'package-lock.json'))) as {
      packages: Record<string, { version?: string }>;
    };
    for (const [name, version] of Object.entries(DESIGN)) {
      expect(lock.packages[`node_modules/${name}`]?.version, name).toBe(version);
    }
  });

  it('builds both Dockerfile stages on node:26.9.0-trixie-slim and on nothing else', () => {
    const froms = read(join(dashboard, 'Dockerfile')).split('\n').filter((l) => /^FROM\s/i.test(l));
    expect(froms).toHaveLength(2);
    for (const line of froms) expect(line).toMatch(/^FROM node:26\.9\.0-trixie-slim AS (builder|runtime)$/);
  });

  it('names no image of its own in the compose file, no version key, no floating tag', () => {
    const compose = read(join(repo, 'docker-compose.yml'));
    expect(compose).not.toMatch(/^\s*image:/m);
    expect(compose).not.toMatch(/^version:/m);
    expect(compose).not.toMatch(/:(latest|stable)\b/);
    expect(compose).toMatch(/build: \.\/dashboard/);
  });

  it('pins shellcheck to v0.11.0 wherever it is used', () => {
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        if (['node_modules', '.git', 'dist'].includes(name)) continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(sh|md|json|ya?ml|ts)$/.test(name)) files.push(p);
      }
    };
    walk(join(repo, 'plugins'));
    const mentions = files.flatMap((f) => [...read(f).matchAll(/koalaman\/shellcheck(:[^\s"']*)?/g)].map((m) => m[0]));
    expect(mentions.length).toBeGreaterThan(0);
    for (const m of mentions) expect(m).toBe('koalaman/shellcheck:v0.11.0');
  });

  it('has no floating range or tag anywhere in what gets built', () => {
    const text = [read(join(dashboard, 'package.json')), read(join(dashboard, 'Dockerfile')), read(join(repo, 'docker-compose.yml'))].join('\n');
    expect(text).not.toMatch(/"[\^~]\d/);
    expect(text).not.toMatch(/\blatest\b/);
  });
});
