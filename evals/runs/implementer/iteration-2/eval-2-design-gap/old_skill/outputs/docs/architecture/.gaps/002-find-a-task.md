## G1 – The designed match algorithm contradicts R4 and its worked examples
- Status: Open
- Design: docs/architecture/002-find-a-task.md, sections "Decisions" and
  "Interfaces": "The match is a **prefix match on the title, compared
  case-sensitively**... `String.prototype.startsWith` over 500 in-memory
  titles..." and "`q` selects the tasks whose **title starts with** the value
  of `q`, compared **case-sensitively**: `title.startsWith(q)`."
- Requirement: R4, S5.2, S5.3 (docs/requirements/002-find-a-task.md)
- Problem: R4 says "A search matches when the typed text occurs anywhere in
  the task's title, comparing without regard to upper and lower case." S5.2's
  worked example is a task titled "Buy Milk", searched with "milk", expected
  to match. S5.3's worked example is "Buy milk" found via "milk" occurring
  anywhere, not only at the start, and the requirement's own notes give
  "Order milk crate" and "Milk bill" as titles that must also be found by
  "milk".
  The design's algorithm is `title.startsWith(q)` with case-sensitive
  comparison. Checked against the requirement's own examples:
  `"Buy Milk".startsWith("milk")` -> `false` (wrong on two counts: "milk" is
  not a prefix of "Buy Milk", and the case differs). `"Order milk
  crate".startsWith("milk")` -> `false` for the same reason. As written, the
  design's `matchesQuery()` would fail every worked example the requirements
  give and would implement a materially different feature (prefix search)
  than the one described (substring search, case-insensitive).
- Blocks: S5.1, S5.2, S5.3, S5.4, S5.5, R4, the `q` query parameter and the
  search input field in the UI, the "no match" state (S5.5), the
  search-and-filter combination half of S6.2, and the QE5 load-test scenario
  in the test strategy (it types a real query and expects a real match).
  S6 (the open-only filter) does not depend on the match algorithm and is
  built in this round.
- Suggestion: implement `matchesQuery(title, q)` as
  `title.toLowerCase().includes(q.toLowerCase())`, i.e. substring match,
  case-insensitive, exactly as R4 and the worked examples state. This is one
  extra `toLowerCase()` per title compared to the designed `startsWith`,
  still O(n) over an in-memory array of at most 500 rows (microseconds), so
  it does not put QE5 at risk. Update the "Decisions" and "Interfaces"
  sections of the design (and, if ADR-0003 quotes the algorithm, that ADR)
  to describe substring/case-insensitive matching instead of prefix/case-
  sensitive matching.
