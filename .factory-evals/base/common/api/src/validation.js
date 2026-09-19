export function validateTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') return 'Bitte gib einen Titel ein.';
  if (title.length > 100) return 'Der Titel darf höchstens 100 Zeichen lang sein.';
  return null;
}

export function validateDueDate(dueDate) {
  if (dueDate === undefined || dueDate === null || dueDate === '') return null;
  if (typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return 'Bitte gib ein gültiges Datum ein.';
  const parsed = new Date(`${dueDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dueDate) return 'Bitte gib ein gültiges Datum ein.';
  return null;
}
