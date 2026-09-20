// S5 (matching a search term against a title) is blocked by a design gap:
// see docs/architecture/.gaps/002-find-a-task.md (G1). Only the "open only"
// filter (S6) is implemented here until the gap is resolved.

// S6.1/S6.3: keep only the tasks that are not done when `open` is set.
export function filterTasks(tasks, { open } = {}) {
  return open ? tasks.filter((task) => !task.done) : tasks;
}
