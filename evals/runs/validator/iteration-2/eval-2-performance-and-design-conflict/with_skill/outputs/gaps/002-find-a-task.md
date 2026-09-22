# Gaps in the design of 002 – Find a task

Raised by the validator during validation round 1 (docs/validation/002-find-a-task.md).

## G1 – The specified match rule contradicts S5.2, S5.3 and R4

- Status: Open
- Design: docs/architecture/002-find-a-task.md, "Decisions" and "Interfaces":
  "The match is a **prefix match on the title, compared case-sensitively**";
  "`q` selects the tasks whose **title starts with** the value of `q`, compared
  **case-sensitively**: `title.startsWith(q)`."
  The same document states under "Requirement conflicts": "None."
- Requirement: docs/requirements/002-find-a-task.md
  - S5.2 – "Given a task \"Buy Milk\", when I search for \"milk\", then I see it. Upper and lower case make no difference."
  - S5.3 – "Given a task \"Buy milk\", when I search for \"milk\", then I see it. The text may sit anywhere in the title, not only at its start."
  - R4 – "A search matches when the typed text occurs anywhere in the task's title, comparing without regard to upper and lower case. \"milk\" matches \"Buy Milk\", \"Order milk crate\" and \"MILK\"."
  - Decisions – "Anywhere in the title, not only at the start", "Case makes no difference".
- Problem: the design specifies the exact opposite of the requirement on both axes
  (start-of-title instead of anywhere, case-sensitive instead of case-insensitive).
  The implementer built the design faithfully (`src/search.js`: `task.title.startsWith(query)`),
  so the running product fails the stakeholder's own demonstration: with the three
  tasks "Buy Milk", "Order milk crate" and "Milk bill" in the list, searching for
  "milk" returns nothing at all. The design's stated reason (avoiding string
  normalisation on the hot path for QE5) is not supported by the measurement: at
  500 tasks and 10 concurrent searchers the measured p95 leaves roughly three
  orders of magnitude of headroom under the 500 ms budget, so a
  `title.toLowerCase().includes(query.toLowerCase())` over 500 in-memory titles
  cannot put QE5 at risk. There is no trade-off here to resolve: the requirement
  and the performance budget can both be met.
- Blocks: S5.1, S5.2, S5.3, R4, and with them the whole point of the feature.
- Suggestion: change the design's "Decisions" and "Interfaces" to a
  case-insensitive substring match on the title —
  `title.toLowerCase().includes(q.toLowerCase())`, an empty or missing `q`
  selecting every task — keep everything else (the filter inside
  `GET /api/tasks` per ADR-0003, the `open=true` flag, the AND combination,
  the UI row), and correct "Requirement conflicts: None". If normalisation per
  request is ever felt to be a cost, caching a lower-cased title next to each
  task in the store is the cheaper follow-up, but the measurement says it is not
  needed at this size.
