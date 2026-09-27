# 002 – Find a task: validation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Implementation report: docs/implementation/002-find-a-task.md
- Verdict: **Rejected – findings to fix**
- Round: 1
- Validated commit: f44ad9d on main
- Date: 2026-09-19
- Stack under test: `docker compose -p tb-e2b-ns up -d --build`, published on port 8123

## Summary
Rejected. The feature does not do what 002 asks for: the search only matches the
**beginning** of a title and only in the **exact** upper/lower case that was
typed. The stakeholder's own example fails — with 500 seeded tasks, 50 of which
contain "milk", typing `milk` shows `No task matches "milk".` S5.1, S5.2, S5.3,
S6.2 and R4 fail.

The cause is not a coding mistake. The design
(docs/architecture/002-find-a-task.md, §Decisions and §Interfaces) specifies
`title.startsWith(q)` compared case-sensitively, which directly contradicts
S5.2, S5.3 and R4, while its §Requirement conflicts says "None". The
implementer built the design faithfully and flagged the contradiction in its
report instead of stopping. So the design has to be corrected first, then the
code.

The design justifies the narrowed match with QE5 ("keeps the endpoint free of
any string normalisation on the hot path, which is what makes QE5 comfortable
rather than tight"). **That justification does not hold.** Measured on the same
machine, 500 tasks, 10 concurrent searchers, 2000 searches:

| Match rule | p50 | p95 | p99 | errors |
|---|---|---|---|---|
| As built: `title.startsWith(q)`, case-sensitive | 1.2 ms | **2.1 ms** | 3.2 ms | 0 |
| As required: `title.toLowerCase().includes(q.toLowerCase())` | 1.2 ms | **2.3 ms** | 4.2 ms | 0 |

The required match costs 0.2 ms at p95 and leaves a factor of ~215 of headroom
against the 500 ms budget. There is no performance reason to give up R4.

Everything else holds: S5.4, S5.5, S6.1, S6.3, R5, QE6 and QE7 pass, and the
001 regression suite is green (11 of 11).

## Open findings

### F1 – Blocker – The search ignores matches that are not at the start of the title
- Requirements: S5.1, S5.3, R4
- Where: `src/search.js` `matchesQuery()`; specified in the design §Interfaces
- Expected: a task is shown when the typed text occurs **anywhere** in its title.
- Actual: only titles that *begin* with the typed text are shown.
- Evidence: task "Buy milk" exists; `GET /api/tasks?q=milk` returns `{"tasks":[],…}`.
  Acceptance tests "S5.1 shows only the tasks whose title contains the typed text"
  and "S5.3 matches text anywhere in the title, not only at its start" fail.
- Note: this is the requirement the stakeholder stated twice ("I type milk and I
  want to see everything with milk in it", "I never know how somebody wrote it down").

### F2 – Blocker – The search is case-sensitive
- Requirements: S5.2, R4
- Where: `src/search.js` `matchesQuery()`; specified in the design §Interfaces
- Expected: upper and lower case make no difference. `milk` finds "Buy Milk",
  "Order milk crate" and "MILK bill".
- Actual: `q=milk` does not find "Buy Milk"; `q=MILK` does not find "Buy milk".
- Evidence: acceptance tests "S5.2 ignores upper and lower case: …" (both
  directions) and "R4 the stakeholder example: "milk" finds all three
  spellings" fail.

### F3 – Blocker – The design contradicts the requirements and declares no conflict
- Requirements: S5.2, S5.3, R4, QE5
- Where: docs/architecture/002-find-a-task.md §Decisions, §Interfaces,
  §Business rules ("R4 is implemented by `matchesQuery()` as specified under
  Interfaces"), §Requirement conflicts ("None"), §Traceability (S5.2, S5.3 and
  R4 traced to a `matchesQuery()` that cannot satisfy them)
- Expected: the design realises R4, or, if it believes R4 cannot be met, records
  the conflict and sends it back to the requirements instead of silently
  redefining the rule.
- Actual: the design redefines the match as a case-sensitive prefix match and
  states there is no conflict. Fixing only `src/search.js` would leave the
  design specifying the wrong behaviour.
- Also: the stated reason (QE5 headroom) is contradicted by measurement — see
  the table above and QE5 in Coverage. The A/B was run on one host, same data,
  same load profile, only `matchesQuery()` swapped.
- For: the architect, before the implementer touches the code.

### F4 – Minor – The no-match message quotes an empty search text
- Requirements: S5.5 (message instead of an empty screen), QE3 (English that
  makes sense)
- Where: `public/app.js` `render()`
- Expected: when "open only" is on, nothing was typed, and no task is open, the
  message says that nothing is open.
- Actual: the message reads `No task matches "".`
- Evidence: one done task, no open task, "open only" switched on — the list area
  shows `No task matches "".` (checked in the browser).

### F5 – Minor – A unit test pins the defective behaviour
- Where: `test/search.test.js`, "the query is compared case-sensitively" and
  "the query matches the start of the title"
- These tests assert the behaviour F1 and F2 reject, so they will go green while
  the product is wrong. Replace them when fixing F1/F2 (case-insensitive,
  anywhere in the title, plus the R4 example).

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance test "S5.1 shows only the tasks whose title contains the typed text" | **Failed** | F1 |
| S5.2 | Acceptance tests "S5.2 ignores upper and lower case" (both directions) | **Failed** | F2 |
| S5.3 | Acceptance test "S5.3 matches text anywhere in the title, not only at its start" | **Failed** | F1 |
| S5.4 | Acceptance test "S5.4 an empty search text shows the whole list again" + browser: clearing the field restores all 500 rows | Passed | |
| S5.5 | Acceptance test "S5.5 a text no task contains …" + browser at 375x812 | Passed with F4 | `No task matches "milk".` rendered, list area not blank |
| S6.1 | Acceptance test "S6.1 "open only" shows only tasks that are not done" | Passed | |
| S6.2 | Acceptance test "S6.2 "open only" combines with the search text" | **Failed** | root cause F1/F2: the open filter is correct, the text match is not |
| S6.3 | Acceptance test "S6.3 switching "open only" off shows the done tasks again" | Passed | |
| R4 | Acceptance test "R4 the stakeholder example: "milk" finds all three spellings" | **Failed** | F1, F2 |
| R5 | Acceptance tests "R5 searching stores nothing …", "R5 a search never writes …" | Passed | a second client that never searched sees the unchanged list; ids untouched after four searches |
| QE5 | 500 seeded tasks, 10 concurrent clients, 2000 searches with think time, against the container | Passed | p50 2.9 ms, p95 5.3 ms, p99 9.4 ms, max 28.1 ms, 0 errors. Browser end-to-end (request + re-render of 500 rows) p95 ≈ 34 ms. Host A/B shows the required match rule also passes: p95 2.3 ms vs 2.1 ms |
| QE6 | `docker stats` during the QE5 load | Passed | 59.6 MiB / 256 MiB; `mem_limit: 256m` in docker-compose.yml |
| QE7 | Acceptance test "QE7 the search is one field above the list, with no button to press" + browser | Passed | one row above the list: search field + "open only" checkbox, no button, no second page |
| Out of scope: fuzzy matching | `src/search.js` is a plain string comparison | Passed | nothing typo-tolerant |
| Out of scope: other fields | Only `title` is compared | Passed | |
| Out of scope: sorting options | No sort parameter, order still from `store.list()` | Passed | |

## Regression
- Acceptance suite 001-task-list: **11 passed, 0 failed** against the running stack.
- Acceptance suite 002-find-a-task (new, 13 tests): 7 passed, **6 failed** (F1, F2).
- Unit tests `npm test`: 15 passed, 0 failed — but see F5.
- R2 (tasks survive a restart): `docker compose restart`, 500 tasks before and after.
- Product-wide constraints: 59.6 MiB of 256 MiB under load, container healthy
  about 6 s after start, UI in English, no outbound requests from the page
  (only `/style.css` and `/app.js`).

## How this was checked
```
PORT=8123 docker compose -p tb-e2b-ns up -d --build
node scripts/seed.js 500 http://localhost:8123
BASE_URL=http://localhost:8123 tests/acceptance/run.sh     # whole regression suite
```
The load test drives 10 concurrent clients through the QE5 scenario ("open the
list, type a four-letter query, read the result", 15 ms think time), 200
searches each, and reports the latency percentiles. The A/B in the Summary ran
the same profile twice on the host against the same seeded data, swapping only
`matchesQuery()`.

## Tests added
- `tests/acceptance/002-find-a-task/search.test.js` – 13 black-box tests for
  S5.1–S5.5, S6.1–S6.3, R4, R5 and QE7. They encode the **requirements**, not
  the design's match rule, and stay in the regression suite after 002 closes.

## Not verified
- Ten *real* people on ten devices: simulated with 10 concurrent HTTP clients.
- The office machine itself: measured on the validation host inside the same
  256 MB container limit.

## Observations
- The implementation report marks S5.2, S5.3 and R4 "Passed as designed". A
  requirement is not satisfied by being built as designed; those rows should
  read "Failed – design contradicts the requirement". The implementer did spot
  the contradiction (§"Note on the match rule") — that belonged in a design gap
  to the architect before coding, not in a footnote after it.
- Every keystroke sends a request and re-renders the whole list. At 500 tasks
  that measures fine (p95 ≈ 34 ms end to end), so no change is needed now, but
  it is the first thing to look at if the list grows well past 500.

## Closed findings
None (first round).
