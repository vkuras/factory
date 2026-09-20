import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Opens the database file with the pragmas of the design (Data model). */
export function openDatabase(path: string): Database {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  db.pragma('cache_size = -8000');
  return db;
}

interface MigrationFile {
  version: number;
  name: string;
  sql: string;
}

function readMigrations(dir: string): MigrationFile[] {
  return readdirSync(dir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort()
    .map((name) => ({
      version: Number(name.split('_')[0]),
      name,
      sql: readFileSync(join(dir, name), 'utf8'),
    }));
}

/**
 * Applies pending migrations in order, each in its own transaction, and records them in
 * `schema_migration`. Forward only: an applied file is never re-run or edited. Returns the
 * names of the files applied by this call.
 */
export function migrate(db: Database, dir: string, now: number = Date.now()): string[] {
  const hasTable = db
    .prepare<{ n: number }>(`SELECT count(*) AS n FROM sqlite_master WHERE name = 'schema_migration'`)
    .get();
  const applied = new Set<number>(
    hasTable && hasTable.n > 0
      ? db.prepare<{ version: number }>('SELECT version FROM schema_migration').all().map((r) => r.version)
      : [],
  );
  const done: string[] = [];
  for (const file of readMigrations(dir)) {
    if (applied.has(file.version)) continue;
    db.transaction(() => {
      db.exec(file.sql);
      db.prepare('INSERT INTO schema_migration (version, name, applied_at) VALUES (?, ?, ?)').run(
        file.version,
        file.name,
        now,
      );
    })();
    done.push(file.name);
  }
  return done;
}
