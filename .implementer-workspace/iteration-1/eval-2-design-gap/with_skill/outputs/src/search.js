// S6: the "open only" filter. Hides done tasks so a team member sees only
// what is left (R4's text-matching half of this file, `matchesQuery()`, is
// blocked by a design/requirements contradiction — see
// docs/architecture/.gaps/002-find-a-task.md, G1 — and is not built yet).
export function filterTasks(tasks, { open } = {}) {
  return open ? tasks.filter((task) => !task.done) : tasks;
}
