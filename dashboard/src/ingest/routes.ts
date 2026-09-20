// The three ingest endpoints (design, Interfaces). Only these accept POST; every page is a GET.

import express, { type NextFunction, type Request, type Response, type Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import {
  handleIntervention,
  handleRunFinish,
  handleRunStart,
  type IngestDeps,
} from './handlers.js';
import { decodeMeta, type Meta, type MetaEvent } from './meta.js';
import { parsePayload, parseTranscriptTail, splitBody } from './payload.js';

export const MAX_BODY = '2mb';

function tokenMatches(header: string | undefined, token: string): boolean {
  if (!header || !header.startsWith('Bearer ')) return false;
  const given = Buffer.from(header.slice('Bearer '.length));
  const wanted = Buffer.from(token);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export function createIngestRouter(deps: IngestDeps, ingestToken: string): Router {
  const router = express.Router();

  const drop = (res: Response, status: number, reason: string, meta?: Meta | null): void => {
    deps.log('warn', 'report_drop', {
      reason,
      status,
      driver: meta?.driver ?? null,
      source: meta?.source ?? null,
    });
    res.status(status).end();
  };

  // The token is checked before the body is read: a wrong token stores nothing (design, Write API).
  const auth = (req: Request, res: Response, next: NextFunction): void => {
    if (ingestToken !== '' && !tokenMatches(req.get('authorization'), ingestToken)) {
      drop(res, 401, 'missing or wrong bearer token');
      return;
    }
    next();
  };

  const body = express.text({ type: () => true, limit: MAX_BODY });

  const withMeta =
    (accepts: readonly MetaEvent[], run: (meta: Meta, raw: string, res: Response) => void) =>
    (req: Request, res: Response): void => {
      const decoded = decodeMeta(req.get('x-factory-meta'));
      if (!decoded.ok) {
        drop(res, 400, decoded.reason);
        return;
      }
      if (!accepts.includes(decoded.meta.event)) {
        drop(res, 400, `meta.event "${decoded.meta.event}" does not belong to this endpoint`, decoded.meta);
        return;
      }
      const raw = typeof req.body === 'string' ? req.body : '';
      run(decoded.meta, raw, res);
    };

  router.post(
    '/api/hook/run-start',
    auth,
    body,
    withMeta(['run-start'], (meta, raw, res) => {
      // A hook start body is the raw hook payload; a CLI start has none.
      if (meta.source !== 'cli' && raw.trim() !== '' && !parsePayload(splitBody(raw).head).ok) {
        drop(res, 400, 'body is not a JSON hook payload', meta);
        return;
      }
      deps.db.transaction(() => handleRunStart(deps, meta))();
      res.status(204).end();
    }),
  );

  router.post(
    '/api/hook/run-finish',
    auth,
    body,
    withMeta(['run-finish', 'session-end'], (meta, raw, res) => {
      let payload: Record<string, unknown> | null = null;
      let transcript: ReturnType<typeof parseTranscriptTail> = [];
      let cliOutput: string | null = null;
      if (meta.source === 'cli') {
        cliOutput = raw;
      } else {
        const { head, tail } = splitBody(raw);
        if (head.trim() === '' && meta.event === 'session-end') {
          payload = {};
        } else {
          const parsed = parsePayload(head);
          if (!parsed.ok) {
            drop(res, 400, 'body is not a JSON hook payload', meta);
            return;
          }
          payload = parsed.payload;
        }
        transcript = parseTranscriptTail(tail);
      }
      deps.db.transaction(() => handleRunFinish(deps, { meta, payload, transcript, cliOutput }))();
      res.status(204).end();
    }),
  );

  // The body of an intervention is ignored: everything it needs is in the meta.
  router.post(
    '/api/intervention',
    auth,
    body,
    withMeta(['intervention'], (meta, _raw, res) => {
      deps.db.transaction(() => handleIntervention(deps, meta))();
      res.status(204).end();
    }),
  );

  return router;
}
