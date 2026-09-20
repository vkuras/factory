// The team works in one office, so "today" is always the team's local day.
export const TEAM_TIME_ZONE = 'Europe/Berlin';

export function today(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TEAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// R5: due dates are ISO dates (YYYY-MM-DD) and must be real calendar days.
export function validateDueDate(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return { dueDate: null };
  }
  if (typeof raw !== 'string' || !ISO_DATE.test(raw)) {
    return { error: 'A due date must look like 2026-09-19.' };
  }
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    return { error: 'A due date must be a real date.' };
  }
  return { dueDate: raw };
}

// R4: a task is overdue once its due date has strictly passed. A task due
// today is not overdue yet, because the day is not over (S6.2).
export function dueState(dueDate, reference = today()) {
  if (!dueDate) return 'none';
  if (dueDate < reference) return 'overdue';
  if (dueDate === reference) return 'due-today';
  return 'upcoming';
}
