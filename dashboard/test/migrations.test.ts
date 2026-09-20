import Database from 'better-sqlite3';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { migrate, openDatabase } from '../src/db/schema.js';

const migrations = new URL('../migrations', import.meta.url).pathname;

describe('migrations (design, Migration from the current state)', () => {
  it('001_init creates the six tables on an empty database and records itself', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mig-'));
    try {
      const db = openDatabase(join(dir, 'x.sqlite'));
      expect(migrate(db, migrations, 1234)).toEqual(['001_init.sql']);
      const tables = db.prepare<{ name: string }>(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all().map((r) => r.name);
      expect(tables).toEqual(['hook_cursor', 'repository', 'run', 'schema_migration', 'ticket', 'ticket_status_event']);
      expect(db.prepare('SELECT version, name, applied_at FROM schema_migration').all()).toEqual([{ version: 1, name: '001_init.sql', applied_at: 1234 }]);
      db.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('runs no migration twice, and applies a later one on top of an existing database', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mig-'));
    try {
      const db = openDatabase(join(dir, 'x.sqlite'));
      migrate(db, migrations);
      db.prepare(`INSERT INTO repository (project_key, first_seen_at, last_seen_at) VALUES ('p', 1, 1)`).run();
      expect(migrate(db, migrations)).toEqual([]);

      const extra = join(dir, 'migs');
      mkdirSync(extra);
      writeFileSync(join(extra, '001_init.sql'), 'SELECT 1;');
      writeFileSync(join(extra, '002_more.sql'), 'ALTER TABLE repository ADD COLUMN note TEXT;');
      expect(migrate(db, extra)).toEqual(['002_more.sql']);
      expect(db.prepare('SELECT project_key, note FROM repository').all()).toEqual([{ project_key: 'p', note: null }]);
      db.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rolls a failing migration back completely and does not record it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mig-'));
    try {
      const db = openDatabase(join(dir, 'x.sqlite'));
      migrate(db, migrations);
      const bad = join(dir, 'bad');
      mkdirSync(bad);
      writeFileSync(join(bad, '002_bad.sql'), 'CREATE TABLE half (a INTEGER); INSERT INTO nowhere VALUES (1);');
      expect(() => migrate(db, bad)).toThrow();
      expect(db.prepare(`SELECT count(*) AS n FROM sqlite_master WHERE name = 'half'`).get()).toEqual({ n: 0 });
      expect(db.prepare('SELECT count(*) AS n FROM schema_migration').get()).toEqual({ n: 1 });
      db.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('opens the database in WAL mode with foreign keys on (Data model)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mig-'));
    try {
      const db = openDatabase(join(dir, 'x.sqlite'));
      expect(db.pragma('journal_mode', { simple: true })).toBe('wal');
      expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
      expect(db.pragma('busy_timeout', { simple: true })).toBe(5000);
      expect(db.pragma('synchronous', { simple: true })).toBe(1); // NORMAL
      db.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects a run without its ticket and an unknown actor', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    migrate(db, migrations);
    db.prepare(`INSERT INTO repository VALUES ('p', 1, 1, NULL)`).run();
    expect(() => db.prepare(`INSERT INTO run (id, project_key, number, actor, started_at, source, created_at, updated_at) VALUES ('r', 'p', '001', 'groom', 1, 'cli', 1, 1)`).run()).toThrow(/FOREIGN KEY/);
    db.prepare(`INSERT INTO ticket (project_key, number, title, first_seen_at, last_activity_at, created_at, updated_at) VALUES ('p', '001', 't', 1, 1, 1, 1)`).run();
    expect(() => db.prepare(`INSERT INTO run (id, project_key, number, actor, started_at, source, created_at, updated_at) VALUES ('r', 'p', '001', 'wizard', 1, 'cli', 1, 1)`).run()).toThrow(/CHECK/);
    expect(() => db.prepare(`INSERT INTO run (id, project_key, number, actor, started_at, source, created_at, updated_at) VALUES ('r', 'p', '001', 'groom', 1, 'carrier-pigeon', 1, 1)`).run()).toThrow(/CHECK/);
    db.close();
  });
});
