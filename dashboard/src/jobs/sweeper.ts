// The only job (design, Jobs): open runs older than RUN_STALE_HOURS become `abandoned`.
// `ended_at` stays NULL because the real end is unknown. Re-running changes nothing.

import type { Queries } from '../db/queries.js';
import { MS_PER_HOUR } from '../domain/format.js';
import type { Logger } from '../log.js';

export const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

export function sweepOnce(q: Queries, now: number, staleHours: number, log: Logger): number {
  const abandoned = q.sweep(now, now - staleHours * MS_PER_HOUR);
  log('info', 'sweep_done', { abandoned });
  return abandoned;
}

export interface Sweeper {
  stop(): void;
}

/** Sweeps once now, then every ten minutes; re-armed after each sweep, scheduled from the clock. */
export function startSweeper(q: Queries, staleHours: number, log: Logger, now: () => number = Date.now): Sweeper {
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;
  const tick = (): void => {
    try {
      sweepOnce(q, now(), staleHours, log);
    } catch (err) {
      log('error', 'sweep_failed', { message: err instanceof Error ? err.message : String(err) });
    }
    if (!stopped) {
      timer = setTimeout(tick, SWEEP_INTERVAL_MS);
      timer.unref();
    }
  };
  tick();
  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
