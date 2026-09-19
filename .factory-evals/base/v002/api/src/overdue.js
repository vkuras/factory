const DAY_MS = 24 * 60 * 60 * 1000;

// Calendar date ('YYYY-MM-DD') of the given instant in Europe/Berlin.
export function todayInBerlin(instant) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

// R1: working days (Mon–Fri) after the due date up to and including today. 0 means not overdue.
export function overdueWorkingDays(dueDate, today) {
  if (!dueDate || dueDate >= today) return 0;
  const end = Date.parse(`${today}T00:00:00Z`);
  let days = 0;
  for (let t = Date.parse(`${dueDate}T00:00:00Z`) + DAY_MS; t <= end; t += DAY_MS) {
    const weekday = new Date(t).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days++;
  }
  return days;
}

// R2: the label text, or null when the task is not overdue.
export function overdueLabel(days) {
  if (days < 1) return null;
  return days === 1 ? 'Überfällig seit 1 Arbeitstag' : `Überfällig seit ${days} Arbeitstagen`;
}
