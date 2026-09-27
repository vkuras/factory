// The design's own formatters, ported unchanged: they define the wording of the UI (ADR-0002).
// Pure functions; the zone comes in as an argument, never from the environment.

/** 1234 -> "1.2k", 12345 -> "12k", 1500000 -> "1.50M"; unknown -> "—". */
export function fmtTok(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}

/** Hours: 0.5 -> "30m", 3.25 -> "3.3h", 12 -> "12h", 36 -> "1.5d"; unknown -> "—". */
export function fmtH(h: number | null | undefined): string {
  if (h === null || h === undefined || Number.isNaN(h)) return '—';
  if (h < 1) return Math.round(h * 60) + 'm';
  if (h < 24) return h.toFixed(h < 10 ? 1 : 0) + 'h';
  return (h / 24).toFixed(1) + 'd';
}

/** Width of a bar: at least 2 % when there is a maximum, "0%" when there is none. */
export function pct(v: number, max: number): string {
  return (max <= 0 ? 0 : Math.max(2, Math.round((v / max) * 100))) + '%';
}

export const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    formatters.set(tz, f);
  }
  return f;
}

export function localParts(ts: number, tz: string): LocalParts {
  const parts = formatterFor(tz).formatToParts(new Date(ts));
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? '0');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
  };
}

/** `YYYY-MM-DD HH:mm` in the display zone. */
export function fmtDateTime(ts: number, tz: string): string {
  const p = localParts(ts, tz);
  const two = (n: number): string => String(n).padStart(2, '0');
  return `${p.year}-${two(p.month)}-${two(p.day)} ${two(p.hour)}:${two(p.minute)}`;
}

/** The local calendar date of `ts` as a day number (days since 1970-01-01, zone-independent). */
export function localDayNumber(ts: number, tz: string): number {
  const p = localParts(ts, tz);
  return Math.floor(Date.UTC(p.year, p.month - 1, p.day) / MS_PER_DAY);
}

/** The Monday (as a day number) of the ISO week containing the given day number. */
export function mondayOf(dayNumber: number): number {
  // 1970-01-01 was a Thursday, so (day + 3) mod 7 is 0 for Monday.
  const sinceMonday = (((dayNumber + 3) % 7) + 7) % 7;
  return dayNumber - sinceMonday;
}

/** ISO week number of the week whose Monday is `monday`. */
export function isoWeekOfMonday(monday: number): number {
  const thursday = new Date((monday + 3) * MS_PER_DAY);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((thursday.getTime() - yearStart) / MS_PER_DAY);
  return Math.floor(dayOfYear / 7) + 1;
}

/** "w38" for the week starting on the given Monday. */
export function weekLabel(monday: number): string {
  return 'w' + isoWeekOfMonday(monday);
}
