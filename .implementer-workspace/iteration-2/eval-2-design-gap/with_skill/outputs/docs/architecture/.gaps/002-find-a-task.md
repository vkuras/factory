# 002 – Find a task: gaps for the architect

## G1 – The design's match rule contradicts the requirements
- Status: Open
- Design: docs/architecture/002-find-a-task.md §Decisions ("The match is a prefix match on the title, compared case-sensitively") and §Interfaces (`q` selects tasks whose "title starts with the value of `q`, compared case-sensitively: `title.startsWith(q)`")
- Requirement: S5.2, S5.3, R4 (docs/requirements/002-find-a-task.md)
- Problem: The design specifies a case-sensitive prefix match. The requirements specify the opposite on both axes:
  - R4: "A search matches when the typed text occurs anywhere in the task's title, comparing without regard to upper and lower case. 'milk' matches 'Buy Milk', 'Order milk crate' and 'MILK'."
  - S5.2: searching "milk" must find a task titled "Buy Milk" ("Upper and lower case make no difference").
  - S5.3: searching "milk" must find a task titled "Buy milk" "anywhere in the title, not only at its start".
  - The requirements' own worked example (stakeholder demo: typing "milk" should surface "Buy Milk", "Order milk crate" and "Milk bill") fails under the design's rule on every one of the three: "Buy Milk" and "Milk bill" fail on case, "Order milk crate" fails on both case and position.
  Building the design's `title.startsWith(q)` as written would ship a feature that fails S5.2, S5.3, R4 and the stakeholder's own example. Building the requirements' rule instead would silently overrule a decision the design made explicitly ("Decisions" + "Interfaces" both state it), which is not mine to overrule.
- Blocks: S5.1–S5.5, R4, and the `q` query parameter of `GET /api/tasks` (`src/search.js` `matchesQuery()`, the search field in the UI, and the "no match" state, since none of them can be built correctly until the rule is fixed). S6 (open-only filter) and the `open` query parameter do not depend on this and were built.
- Suggestion: Change the rule to a case-insensitive substring match, e.g. `title.toLowerCase().includes(q.toLowerCase())`, which is what R4/S5.2/S5.3 literally ask for. At 500 rows this is still a microsecond-scale scan per request, so QE5 (p95 < 500 ms at 500 tasks / 10 concurrent users) should hold with the same margin the design already argues for `startsWith`; if the hot-path allocation from repeated `toLowerCase()` calls is a concern, lower-casing each title once when it is stored (or caching the lower-cased title) removes it.
