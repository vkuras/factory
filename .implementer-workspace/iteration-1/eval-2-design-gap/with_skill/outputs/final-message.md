Status: needs-architect (branch `feat/002-find-a-task`, commits e107de5..9f2ad15)

Built: the "open only" filter (S6.1, S6.3) — `src/search.js` `filterTasks()`, `GET /api/tasks?open=true`, and an "Open only" checkbox in the UI. Self-validated in Docker (`tb-i1-e2-ws`, port 8102): 14 unit tests and 13 acceptance tests green (0 skipped), stack healthy, UI checked by hand, data survives a restart, 19 MiB / 256 MiB memory.

Blocked (G1, `docs/architecture/.gaps/002-find-a-task.md`): the design's match rule is a case-sensitive prefix match (`title.startsWith(q)`), but the requirements explicitly need a case-insensitive substring match anywhere in the title (R4, S5.2, S5.3 — e.g. "Buy milk" must match a search for "milk", which `startsWith` cannot do). This contradicts the design's own stated rationale, so it needs an architecture decision, not a guess from me. It blocks all of S5, S6.2, the `q`/`query` API surface, the search field and no-match UI state, and the QE5 load test. Suggested fix is in the gap file: switch to a case-insensitive `includes()` match, which keeps ADR-0003 and the rest of the design as is.

Requirements status left unchanged ("Designed – ready for implementation") since this hands back to the architect, not to validation.
