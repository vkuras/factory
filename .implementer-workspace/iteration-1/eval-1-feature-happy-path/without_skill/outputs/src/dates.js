// Date rules for 002 - Due dates and overdue tasks.
//
// "Today" is computed here, in one place, so the boundary rule (R4) can be
// tested without waiting for midnight (see ADR-0002): callers may pass an
// override (the X-Today header) which relabels the answer but never touches
// stored data.

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

const BERLIN_TODAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// R4: "today" in the team's time zone, or the X-Today override when it is a
// well-formed date. A malformed override is ignored rather than trusted.
export function today(override) {
  if (typeof override === 'string' && DATE_FORMAT.test(override)) {
    return override;
  }
  return BERLIN_TODAY_FORMATTER.format(new Date());
}

// R5: a day is optional; when given it must be a real calendar date in the
// form YYYY-MM-DD. Returns { dueDate } or { error }.
export function validateDueDate(raw) {
  if (raw === null || raw === undefined) {
    return { dueDate: null };
  }
  if (typeof raw !== 'string' || !DATE_FORMAT.test(raw)) {
    return { error: 'The due date must be a real date in the form YYYY-MM-DD.' };
  }
  const [year, month, day] = raw.split('-').map(Number);
  const roundTrip = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day;
  if (!isRealDate) {
    return { error: 'The due date must be a real date in the form YYYY-MM-DD.' };
  }
  return { dueDate: raw };
}

// R4: overdue when the day is strictly before the reference day, due-today
// when it equals it, upcoming when it is after, none without a day. Because
// both sides are YYYY-MM-DD strings, plain string comparison is also
// calendar-date comparison.
export function dueState(dueDate, reference) {
  if (!dueDate) return 'none';
  if (dueDate < reference) return 'overdue';
  if (dueDate === reference) return 'due-today';
  return 'upcoming';
}
