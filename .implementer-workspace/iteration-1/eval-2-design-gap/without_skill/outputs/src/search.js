// 002 - Find a task.
//
// Note on the match rule: the design (docs/architecture/002-find-a-task.md)
// describes a case-sensitive prefix match (`title.startsWith(q)`). That
// contradicts the requirements it is meant to implement:
//   - R4: "A search matches when the typed text occurs anywhere in the
//     task's title, comparing without regard to upper and lower case."
//   - S5.2 / S5.3: "milk" must match "Buy Milk" (case) and "Order milk
//     crate" (text not at the start).
// The acceptance criteria are the contract a user-facing feature is judged
// against, so this implementation follows the requirements (substring,
// case-insensitive) rather than the design's prefix/case-sensitive text.
// This should go back to architecture to reconcile ADR-0003 and the
// Interfaces section with R4/S5.2/S5.3.

// R4: matches when `query` occurs anywhere in `title`, ignoring case.
export function matchesQuery(title, query) {
  if (!query) return true;
  return title.toLowerCase().includes(query.toLowerCase());
}

// S6: filters by search text and, optionally, to open (not done) tasks only.
export function filterTasks(tasks, { q, open } = {}) {
  return tasks.filter((task) => {
    if (open && task.done) return false;
    return matchesQuery(task.title, q);
  });
}
