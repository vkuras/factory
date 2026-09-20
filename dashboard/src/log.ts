// One JSON object per line on stdout. No log library (overview.md, Logging).

export type Level = 'info' | 'warn' | 'error';

export interface Logger {
  (level: Level, event: string, fields?: Record<string, unknown>): void;
}

export function createLogger(write: (line: string) => void = (l) => process.stdout.write(l)): Logger {
  return (level, event, fields = {}) => {
    write(JSON.stringify({ t: new Date().toISOString(), lvl: level, event, ...fields }) + '\n');
  };
}

export const silentLogger: Logger = () => {};
