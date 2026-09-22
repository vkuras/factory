const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ZONE = 'Europe/Berlin';

// The team's own day, in the team's time zone (ADR-0002). Formatted directly
// as YYYY-MM-DD via the en-CA locale, which happens to use that order.
export function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// R5: a day is optional; when given it must be YYYY-MM-DD and a day that
// really exists (a round-trip check catches "2026-02-30").
export function validateDueDate(raw) {
  if (raw === undefined || raw === null) {
    return { dueDate: null };
  }
  if (typeof raw !== 'string' || !DATE_RE.test(raw)) {
    return { error: 'The day must be in the form YYYY-MM-DD.' };
  }
  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const roundTrips =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!roundTrips) {
    return { error: 'That day does not exist.' };
  }
  return { dueDate: raw };
}

// R4: strictly before the reference day is overdue, equal is due today (not
// overdue, the day is still running), after is upcoming, no day is none.
export function dueState(dueDate, reference) {
  if (!dueDate) return 'none';
  if (dueDate < reference) return 'overdue';
  if (dueDate > reference) return 'upcoming';
  return 'due-today';
}
