// The date rules for 002 (due dates and overdue tasks). Kept in one module so
// that R4's boundary lives in exactly one place (see docs/architecture/002-due-dates.md).
const TIME_ZONE = 'Europe/Berlin';
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

const todayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// True when `raw` is a string in the form YYYY-MM-DD that names a day which
// actually exists (R5): 2026-02-30 is well-formed but not a real day.
function isRealDay(raw) {
  if (typeof raw !== 'string' || !DATE_FORMAT.test(raw)) return false;
  const [year, month, day] = raw.split('-').map(Number);
  const roundTrip = new Date(Date.UTC(year, month - 1, day));
  return (
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day
  );
}

// R5: a day is optional; when given it must be a real calendar day in the
// form YYYY-MM-DD. Returns { dueDate } (string or null) or { error }.
export function validateDueDate(raw) {
  if (raw === undefined || raw === null) {
    return { dueDate: null };
  }
  if (!isRealDay(raw)) {
    return { error: 'The date must be a real day in the form YYYY-MM-DD.' };
  }
  return { dueDate: raw };
}

// The team's current day (ADR-0002: Europe/Berlin, overridable per request so
// R4's boundary can be tested without waiting for midnight). `override` is
// read from the X-Today header; anything that is not a real day is ignored
// and the real day is used instead, since the header only ever relabels a
// response and never changes what is stored.
export function today(override) {
  if (isRealDay(override)) return override;
  return todayFormatter.format(new Date());
}

// R4: overdue when the day is strictly before the reference day, due-today
// when it equals it, upcoming when it is after, none without a day. Plain
// string comparison is correct because both sides are YYYY-MM-DD.
export function dueState(dueDate, reference) {
  if (!dueDate) return 'none';
  if (dueDate < reference) return 'overdue';
  if (dueDate > reference) return 'upcoming';
  return 'due-today';
}
