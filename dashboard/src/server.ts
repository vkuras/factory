// Startup: configuration, database, migrations, sweeper, then listen (design, Startup).

import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { ConfigError, isLoopback, loadConfig } from './config.js';
import { createQueries } from './db/queries.js';
import { migrate, openDatabase } from './db/schema.js';
import { startSweeper } from './jobs/sweeper.js';
import { createLogger } from './log.js';

const log = createLogger();

let config;
try {
  config = loadConfig();
} catch (err) {
  if (err instanceof ConfigError) {
    process.stderr.write(`configuration error: ${err.message}\n`);
    process.exit(1);
  }
  throw err;
}

const db = openDatabase(config.dbPath);
const applied = migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
const q = createQueries(db);

log('info', 'startup', {
  version: config.version,
  port: config.port,
  dbPath: config.dbPath,
  tz: config.tz,
  loopThreshold: config.loopThreshold,
  idleHours: config.idleHours,
  runStaleHours: config.runStaleHours,
  ingestToken: config.ingestToken === '' ? '(none)' : '(set)',
  migrationsApplied: applied,
});
if (config.ingestToken === '' && !isLoopback(config.bind)) {
  log('warn', 'ingest_open', {
    message: `FACTORY_INGEST_TOKEN is empty and DASHBOARD_BIND is ${config.bind}: anyone who can reach the port can report runs`,
  });
}

const sweeper = startSweeper(q, config.runStaleHours, log);
const app = createApp({ config, db, log });
const server = app.listen(config.port, () => log('info', 'listening', { port: config.port }));

const shutdown = (): void => {
  sweeper.stop();
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
