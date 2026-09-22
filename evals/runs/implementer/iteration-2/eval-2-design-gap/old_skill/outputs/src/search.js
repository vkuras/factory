// 002 - Find a task.
//
// matchesQuery() (the text search, S5, R4) is NOT implemented here: the
// design's algorithm (prefix match, case-sensitive) contradicts R4 and its
// worked examples. See docs/architecture/.gaps/002-find-a-task.md G1. Only
// the open-only filter (S6) is built until the architect resolves G1.

// S6: "open only" hides done tasks. R5: nothing here is stored, the flag
// lives in the request only.
export function filterTasks({ tasks, open }) {
  return open ? tasks.filter((task) => !task.done) : tasks;
}
