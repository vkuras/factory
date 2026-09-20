# Gaps – 002 Find a task

## G1 – The match rule contradicts the requirements
- Status: Open
- Design: docs/architecture/002-find-a-task.md, section "Decisions" and
  "Interfaces": "the match is a prefix match on the title, compared
  case-sensitively (see Interfaces)... `String.prototype.startsWith` over
  500 in-memory titles is the cheapest operation..."; Interfaces table:
  "`q` selects the tasks whose **title starts with** the value of `q`,
  compared **case-sensitively**: `title.startsWith(q)`."
- Requirement: R4, S5.2, S5.3 (docs/requirements/002-find-a-task.md)
- Problem: the design's match rule is a case-sensitive prefix match
  (`title.startsWith(q)`), but the requirements explicitly ask for the
  opposite on both axes:
  - R4: "A search matches when the typed text occurs anywhere in the
    task's title, comparing without regard to upper and lower case."
  - S5.2: searching "milk" must find "Buy Milk" — case must not matter.
  - S5.3: the text "may sit anywhere in the title, not only at its
    start" — a prefix-only match fails this by construction (e.g. "Buy
    milk" would not match a search for "milk").
  The stakeholder's own trace confirms this is deliberate on the
  requirements side (L2, L3: "I type milk and I want to see everything
  with milk in it", "I never know how somebody wrote it down").
  This is not a detail left to developers: the design gives an explicit,
  reasoned decision for the case-sensitive prefix match tied to QE5, so I
  cannot silently build the requirements' version instead of the design's
  without an architecture decision.
- Blocks: S5.1, S5.2, S5.3, S5.4, S5.5 (the whole search-by-text story),
  S6.2 (search combined with the open-only filter), and the `query` field
  and `q` parameter of `GET /api/tasks`, and the search field + no-match
  state in the UI.
- Suggestion: change the design's match rule to a case-insensitive
  substring match (`title.toLowerCase().includes(q.toLowerCase())`) to
  match R4/S5.2/S5.3 exactly. At 500 in-memory titles this is still a
  microsecond-scale operation per request (QE5's own reasoning: "a filter
  over an array is measured in microseconds" per ADR-0003), so the
  QE5/QE6 rationale for filtering in-process still holds; only the
  comparison itself needs to change. No other part of the design (ADR-0003,
  component split, deployment) needs to change.

## Not built because of G1
- `matchesQuery()` in `src/search.js` and the `q` handling in
  `GET /api/tasks` and its `query` response field.
- The search field and the `No task matches "<text>".` state in the UI.
- S6.2 (search text combined with "open only"), because it needs a working
  `matchesQuery()`.

## Built despite G1 (not blocked by it)
- The "open only" filter (S6.1, S6.3), which only depends on the `done`
  boolean, not on the match rule.
