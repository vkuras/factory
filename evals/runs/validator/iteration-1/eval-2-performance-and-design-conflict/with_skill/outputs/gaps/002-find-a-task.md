# 002 – Find a task: design gaps

## G1 – The specified match rule contradicts S5.2, S5.3 and R4

- Status: Open
- Raised by: validator, round 1, 2026-09-19

### Design
`docs/architecture/002-find-a-task.md`, "Decisions" and "Interfaces":

> The match is a **prefix match on the title, compared case-sensitively** (see Interfaces).

> `q` selects the tasks whose **title starts with** the value of `q`, compared
> **case-sensitively**: `title.startsWith(q)`.

The design's "Requirement conflicts" section says "None", and its traceability
table maps S5.2, S5.3 and R4 to this `matchesQuery()`.

### Requirement
`docs/requirements/002-find-a-task.md`:

> S5.2 Given a task "Buy Milk", when I search for "milk", then I see it. Upper
> and lower case make no difference.

> S5.3 Given a task "Buy milk", when I search for "milk", then I see it. The
> text may sit anywhere in the title, not only at its start.

> R4 A search matches when the typed text occurs anywhere in the task's title,
> comparing without regard to upper and lower case. "milk" matches "Buy Milk",
> "Order milk crate" and "MILK".

### Problem
The design specifies the exact opposite of the requirement on both axes: prefix
instead of anywhere, case-sensitive instead of case-insensitive. The implementer
built the design faithfully (`src/search.js`), so the product fails the
stakeholder's own demonstration: with 500 tasks in the list, 50 of which contain
"the milk", typing `milk` shows `No task matches "milk".`

The design's stated reason is performance (QE5). That reason does not hold at
this scale: measured on the running stack with 500 tasks and 10 concurrent
searchers, the **unfiltered** list request — the largest response the required
rule could produce — answers at p95 5.22 ms against a 500 ms threshold, and the
container stays at 28 MiB of 256 MiB. A case-insensitive `includes()` over 500
in-memory titles has room in that budget many times over.

### Blocks
S5.1, S5.2, S5.3, S6.2, R4 — validation finding F1 (blocking). The feature
cannot be validated until the design states the required rule.

### Suggestion
Replace the match rule in "Decisions" and "Interfaces" with the requirement's
rule, for example
`task.title.toLowerCase().includes(query.trim().toLowerCase())`, keep an empty
or missing `q` selecting everything, and remove the "Requirement conflicts:
None" claim or record how it was resolved. If any doubt about QE5 remains,
require the load test in `tests/acceptance/002-find-a-task/perf/search.js` to be
re-run against the corrected rule — it is already part of the regression suite.
