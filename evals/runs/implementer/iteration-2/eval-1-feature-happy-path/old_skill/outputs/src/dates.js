const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

// ADR-0002: "today" is the team's day in Europe/Berlin, computed on the
// server so every client sees the same answer.
export function today(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA formats as YYYY-MM-DD.
  return formatter.format(now);
}

// R5: a day is a full calendar date in the form YYYY-MM-DD that exists.
// R6: a day is optional; a missing or null value is valid and means "no day".
export function validateDueDate(raw) {
  if (raw === undefined || raw === null) {
    return { dueDate: null };
  }
  if (typeof raw !== 'string' || !DAY_FORMAT.test(raw)) {
    return { error: 'The date must be in the form YYYY-MM-DD.' };
  }
  const [year, month, day] = raw.split('-').map(Number);
  const asDate = new Date(Date.UTC(year, month - 1, day));
  const roundTrips =
    asDate.getUTCFullYear() === year &&
    asDate.getUTCMonth() === month - 1 &&
    asDate.getUTCDate() === day;
  if (!roundTrips) {
    return { error: 'The date must be in the form YYYY-MM-DD.' };
  }
  return { dueDate: raw };
}

// R4: overdue when the day lies strictly before today, due today when it
// equals today, and neither when it is after. YYYY-MM-DD sorts the same
// lexicographically as chronologically, so plain string comparison holds.
export function dueState(dueDate, reference) {
  if (!dueDate) return 'none';
  if (dueDate < reference) return 'overdue';
  if (dueDate === reference) return 'due-today';
  return 'upcoming';
}
