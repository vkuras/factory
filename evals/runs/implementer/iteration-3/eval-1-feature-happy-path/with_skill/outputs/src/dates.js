// R4/R5/ADR-0002: the due-date rules in one place, see docs/architecture/002-due-dates.md.
const TIME_ZONE = 'Europe/Berlin';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// R5: a day is written as YYYY-MM-DD and must be a day that exists.
// A missing day (undefined/null) is valid: the field is optional (R6).
export function validateDueDate(raw) {
  if (raw === undefined || raw === null) {
    return { value: null };
  }
  if (typeof raw !== 'string' || !DATE_RE.test(raw)) {
    return { error: 'The date must be a real day in the form YYYY-MM-DD.' };
  }
  const [year, month, day] = raw.split('-').map(Number);
  const roundTrip = new Date(Date.UTC(year, month - 1, day));
  const exists =
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day;
  if (!exists) {
    return { error: 'The date must be a real day in the form YYYY-MM-DD.' };
  }
  return { value: raw };
}

// ADR-0002: "today" is the team's day in Europe/Berlin, overridable per
// request (the X-Today header) so R4's boundary can be tested without
// waiting for midnight. An override that isn't a valid day is ignored.
export function today(override) {
  if (override !== undefined && override !== null) {
    const { value } = validateDueDate(override);
    if (value) return value;
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// R4: overdue strictly before the reference day, due-today when equal,
// upcoming when after, none without a day. YYYY-MM-DD strings compare
// lexically in the same order as chronologically.
export function dueState(dueDate, reference) {
  if (!dueDate) return 'none';
  if (dueDate < reference) return 'overdue';
  if (dueDate === reference) return 'due-today';
  return 'upcoming';
}
