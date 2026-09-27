// S6: hide done tasks when "open only" is switched on.
//
// The text-matching half of this feature (S5, R4: matchesQuery()) is not
// built yet. The design's match rule (a case-sensitive prefix match,
// title.startsWith(q)) contradicts the requirements (R4/S5.2/S5.3: a
// case-insensitive match anywhere in the title). See
// docs/architecture/.gaps/002-find-a-task.md (G1).
export function filterTasks(tasks, { open } = {}) {
  return open ? tasks.filter((task) => !task.done) : tasks;
}
