const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

// ADR-0002: "today" is computed on the server in Europe/Berlin, and can be
// pinned per request with the X-Today header so R4's boundary is a normal
// test instead of a clock trick. An override that isn't a valid day is
// ignored and the real day is used instead.
export function today(override) {
  if (typeof override === 'string' && isRealDate(override)) {
    return override;
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
}

function isRealDate(value) {
  if (!DATE_FORMAT.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// R5: a day is optional; when given it must be a full calendar date in the
// form YYYY-MM-DD that actually exists (so 2026-02-30 is rejected).
export function validateDueDate(raw) {
  if (raw === undefined || raw === null) {
    return { dueDate: null };
  }
  if (typeof raw !== 'string' || !isRealDate(raw)) {
    return { error: 'The due date must be a real date in the form YYYY-MM-DD.' };
  }
  return { dueDate: raw };
}

// R4: a task is overdue when its day lies strictly before the reference day,
// due today when it equals it, and otherwise upcoming. YYYY-MM-DD strings
// compare correctly with plain string comparison.
export function dueState(dueDate, reference) {
  if (!dueDate) return 'none';
  if (dueDate < reference) return 'overdue';
  if (dueDate === reference) return 'due-today';
  return 'upcoming';
}
