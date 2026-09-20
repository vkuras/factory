// The Express application: read routes, the three ingest endpoints, healthz, assets, error handler.
// Built by `createApp` so tests can run it over a temp-file database with a fixed clock.

import type Database from 'better-sqlite3';
import ejs from 'ejs';
import express, { type NextFunction, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { Config } from './config.js';
import { createQueries } from './db/queries.js';
import { MS_PER_HOUR } from './domain/format.js';
import { onlineIndicator } from './domain/rules.js';
import { createIngestRouter } from './ingest/routes.js';
import type { Logger } from './log.js';
import { silentLogger } from './log.js';
import {
  buildDetail,
  buildOverview,
  canonicalPath,
  parseTab,
  resolveShortLink,
} from './web/pages.js';

export interface AppOptions {
  config: Config;
  db: Database;
  now?: () => number;
  uuid?: () => string;
  log?: Logger;
  viewsDir?: string;
  publicDir?: string;
}

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
  "frame-ancestors 'none'; base-uri 'none'";

const localDir = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

export function createApp(options: AppOptions): express.Express {
  const { config, db } = options;
  const now = options.now ?? Date.now;
  const uuid = options.uuid ?? randomUUID;
  const log = options.log ?? silentLogger;
  const viewsDir = options.viewsDir ?? localDir('./views');
  const publicDir = options.publicDir ?? localDir('./public');
  const q = createQueries(db);

  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);

  // One JSON line per request, with the request id the error page also prints.
  app.use((req, res, next) => {
    const id = uuid().slice(0, 8);
    res.locals['requestId'] = id;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      log('info', 'request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Number((process.hrtime.bigint() - started) / 1_000_000n),
        id,
      });
    });
    next();
  });

  const renderPage = async (
    res: Response,
    status: number,
    view: string,
    data: Record<string, unknown>,
    onlineCount: number,
  ): Promise<void> => {
    const options = { views: [viewsDir], cache: true };
    const body = await ejs.renderFile(`${viewsDir}/${view}.ejs`, data, options);
    const html = await ejs.renderFile(
      `${viewsDir}/layout.ejs`,
      { body, online: onlineIndicator(onlineCount) },
      options,
    );
    res
      .status(status)
      .set('Content-Type', 'text/html; charset=utf-8')
      .set('Cache-Control', 'no-store')
      .set('Content-Security-Policy', CSP)
      .send(html);
  };

  const onlineNow = (): number => q.countOnline(now() - config.runStaleHours * MS_PER_HOUR);

  app.get('/healthz', (_req, res) => {
    res.json({
      status: 'ok',
      version: config.version,
      tickets: q.countTickets(),
      openRuns: q.countOpenRuns(),
    });
  });

  app.use(
    '/assets',
    express.static(publicDir, {
      index: false,
      etag: false,
      lastModified: false,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      },
    }),
  );

  app.use(createIngestRouter({ db, q, now, uuid, log }, config.ingestToken));

  app.get('/', async (req, res) => {
    const model = buildOverview(q, config, now(), parseTab(req.query['tab']));
    if (model.empty) {
      await renderPage(res, 200, 'empty', {}, model.online.pulsing ? Number.parseInt(model.online.text, 10) || 1 : 0);
      return;
    }
    await renderPage(res, 200, 'overview', { m: model }, onlineNow());
  });

  const notFound = (res: Response): Promise<void> =>
    renderPage(
      res,
      404,
      'error',
      { heading: 'That ticket is not here.', requestId: null, backHref: '/' },
      onlineNow(),
    );

  app.get('/ticket/:project/:number', async (req, res) => {
    const from = parseTab(req.query['from']);
    const model = buildDetail(q, config, now(), String(req.params['project']), String(req.params['number']), from);
    if (!model) {
      await notFound(res);
      return;
    }
    await renderPage(res, 200, 'detail', { m: model }, onlineNow());
  });

  app.get('/ticket/:number', async (req, res) => {
    const from = parseTab(req.query['from']);
    const resolved = resolveShortLink(q, String(req.params['number']));
    if (!resolved) {
      await notFound(res);
      return;
    }
    const { ticket, ambiguous } = resolved;
    if (ambiguous) {
      res.set('Cache-Control', 'no-store').redirect(302, canonicalPath(ticket.projectKey, ticket.number, from));
      return;
    }
    const model = buildDetail(q, config, now(), ticket.projectKey, ticket.number, from);
    if (!model) {
      await notFound(res);
      return;
    }
    await renderPage(res, 200, 'detail', { m: model }, onlineNow());
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    const status =
      typeof err === 'object' && err !== null && typeof (err as { status?: unknown }).status === 'number'
        ? (err as { status: number }).status
        : 500;
    const requestId = String(res.locals['requestId'] ?? '');
    log(status >= 500 ? 'error' : 'warn', status === 413 ? 'report_drop' : 'error', {
      reason: status === 413 ? 'body over 2 MiB' : undefined,
      status,
      path: req.path,
      id: requestId,
      message: err instanceof Error ? err.message : String(err),
    });
    if (res.headersSent) {
      next(err);
      return;
    }
    if (req.path.startsWith('/api/')) {
      res.status(status).end();
      return;
    }
    renderPage(res, 500, 'error', { heading: 'Something went wrong.', requestId, backHref: null }, 0).catch(() => {
      res.status(500).type('text/plain').send('Something went wrong.');
    });
  });

  return app;
}
