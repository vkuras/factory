// Design docs/architecture/002-find-a-task.md names this module as the home
// for both `matchesQuery()` (the `q` text search) and `filterTasks()`.
//
// `matchesQuery()` is not implemented here: the design's match rule
// (`title.startsWith(q)`, case-sensitive) contradicts the requirements
// (R4, S5.2, S5.3: match anywhere in the title, case-insensitive). See
// docs/architecture/.gaps/002-find-a-task.md#G1. Implementing either version
// unilaterally would either fail the acceptance criteria or silently
// overrule the design's documented decision, so this is left to the
// architect rather than guessed.
//
// `filterTasks()` here only applies the "open only" filter (S6), which does
// not depend on the blocked match rule.

/**
 * Keeps only the tasks that satisfy the given filters.
 *
 * @param {{id: number, title: string, done: boolean}[]} tasks
 * @param {{ open?: boolean }} filters - `open: true` keeps only tasks that
 *   are not done (S6.1). Omitted or `false` keeps every task regardless of
 *   its done state.
 */
export function filterTasks(tasks, { open = false } = {}) {
  if (!open) return tasks;
  return tasks.filter((task) => !task.done);
}
