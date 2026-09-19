# 002 – Find a task: validation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Implementation report: docs/implementation/002-find-a-task.md
- Verdict: **Rejected – findings to fix**
- Round: 1
- Validated commit: 6616b98 on feature/002-find-a-task
- Date: 2026-09-19
- Stack under test: `docker compose -p tb-e2-ns up -d`, published on port 8121

## Summary
Rejected. The feature is built and the plumbing works — the `open only` filter,
the empty-search behaviour, the no-match message, the one-row UI and R5 all pass,
and the 001 regression suite is green. But the search itself does not do what the
requirements ask for: it matches the **start** of the title and it is **case-sensitive**.
The stakeholder's own example — type `milk`, see "Buy Milk", "Order milk crate",
"Milk bill" — returns **nothing**. That fails S5.2, S5.3 and R4, and drags S5.1
and S6.2 with it.

The design (docs/architecture/002-find-a-task.md, "Interfaces") specifies this
wrong rule and gives performance as the reason; the implementer followed the
design and said so in its report. The requirements are the product's contract, so
this is a finding against the delivered product, and the design has to be
corrected as well. The performance reason does not hold: measured on this stack,
the requirement-correct match costs **14.3 µs** per search over 500 tasks, which
is 0.003 % of the 500 ms budget of QE5.

Two more defects: the browser UI adds a fresh set of event listeners every time a
task is ticked, deleted or added, so a single keystroke ends up firing one request
per past action (measured: 4 requests per keystroke after 3 ticks), and
`scripts/seed.js` — the script the implementation report uses to produce the
QE5 load situation — crashes with a syntax error and cannot have been run.

## Open findings

### F1 – The search matches the start of the title and is case-sensitive (Blocker)
**Requirements violated:** S5.2, S5.3, R4; S5.1 and S6.2 in consequence.

Observed on the running stack with the stakeholder's own example:

```
POST /api/tasks  "Buy Milk" / "Order milk crate" / "Milk bill"
GET  /api/tasks?q=milk  ->  {"tasks":[],"query":"milk","openOnly":false}
GET  /api/tasks?q=Milk  ->  only "Milk bill"
```

R4 states: a search matches when the typed text occurs **anywhere** in the title,
compared **without regard to upper and lower case**, and names exactly these three
titles. `src/search.js` implements `task.title.startsWith(query)`.

The design specifies this rule in its "Interfaces" section and justifies it with
QE5; its "Requirement conflicts" section says "None", which is not the case. The
justification does not survive measurement (500 titles, 10 000 iterations,
Node 24, same machine):

| Match rule | Cost per search over 500 tasks | Share of the 500 ms QE5 budget |
|---|---|---|
| `title.startsWith(q)` (as designed) | 2.3 µs | 0.0005 % |
| `title.toLowerCase().includes(q.toLowerCase())` (as required) | 14.3 µs | 0.003 % |

Measured end to end, the current build answers at p95 5.2 ms with 10 concurrent
searchers over 500 tasks (see QE5 below) — there is roughly four orders of
magnitude of headroom. Nothing about QE5 requires giving up the required match.

**To fix:**
1. Architect: correct docs/architecture/002-find-a-task.md — the match is
   case-insensitive and matches anywhere in the title (`R4`), and the
   "Requirement conflicts" section must not claim there is no conflict.
2. Implementer: implement R4 in `matchesQuery()`, and update
   `test/search.test.js`, which currently asserts the wrong rule (see F4).

Out of scope stays out of scope: this is a plain substring comparison, not fuzzy
or typo-tolerant matching, and only the title is compared.

### F2 – Every tick, delete or add adds another set of event listeners (Blocker)
**Requirements affected:** QE5 (the product must stay instant in daily use); plain defect.

`public/app.js` contains, inside `toggle()`, `destroy()` and the submit handler,
a copy of the page's bottom block:

```js
  await searchInput.addEventListener('input', () => load());
openOnlyInput.addEventListener('change', () => load());

load();
```

`addEventListener` is not awaitable and returns nothing, so the `await` is
meaningless; worse, each call registers **another** listener, because each arrow
function is a new object. The listeners never come off. Measured in the browser on
the running stack:

| After | Requests fired by one keystroke |
|---|---|
| page load | 1 |
| 3 ticks of a checkbox | 4 |

A team member who ticks off twenty tasks during a shift makes every later
keystroke fire twenty-one identical requests, and the list re-renders that many
times. It grows without bound until the page is reloaded. Under an amplified load
test (10 clients, 10 requests per keystroke) the server still answered at p95
6.2 ms, so the stack survives it today — but this is a defect, it works directly
against QE5, and it is plainly not what the design describes ("the field fires a
request per input event").

**To fix:** register the two listeners once, at the bottom of the file, and let
`toggle()`, `destroy()` and the submit handler call `load()` only.

### F3 – `scripts/seed.js` does not run (Major)
**Requirements affected:** none directly; it invalidates the QE5 evidence in the implementation report.

```
$ node scripts/seed.js 500 http://localhost:8121
const baseUrl = process.argv[3] ?? process.env.BASE_URL || 'http://localhost:8080';
                                                        ^^
SyntaxError: Unexpected token '||'
```

`??` may not be mixed with `||` without parentheses. The script fails at parse
time, on every invocation, so the procedure the implementation report documents
under "How to run" and the QE5 evidence in self-validation 9 ("`scripts/seed.js 500`,
then 10 parallel clients") cannot have been executed as written. The QE5 and QE6
numbers in that report are therefore unsupported — this validation measured them
independently instead (both pass, see below).

**To fix:** parenthesise, e.g.
`process.argv[3] ?? process.env.BASE_URL ?? 'http://localhost:8080'`, and run the
script once before claiming it in a report.

### F4 – The unit tests lock in the wrong match rule (Minor)
`test/search.test.js` asserts `matchesQuery({title:'Buy milk'}, 'buy') === false`
("the query is compared case-sensitively") and that a query matches "the start of
the title". These tests pass today and will fail once F1 is fixed; they must be
replaced by tests for the required rule, including the stakeholder's three-title
example and a match in the middle of a title.

### F5 – The implementation report closes a known requirement conflict by itself (Minor)
The report's "Note on the match rule" records that the requirements ask for
something else than the design specifies, and then marks S5.2, S5.3 and R4 as
"Passed as designed". A conflict between requirements and design is a design gap
and belongs with the architect before the code is written; it is not something the
implementation stage can close, and no requirement may be reported as passed when
the delivered behaviour contradicts it. Please re-report these rows against the
requirements once F1 is fixed.

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance test "S5.1 the search shows only the tasks that contain the text" | Passed for prefixes only | Passes today because the probe is a prefix; the criterion is fully met only with F1 fixed |
| S5.2 | Acceptance test "S5.2 upper and lower case make no difference" | **Failed** | `q=milk` on "Buy Milk" → `{"tasks":[]}` (F1) |
| S5.3 | Acceptance tests "S5.3 the text may sit anywhere ...", "S5.3 the stakeholder example ..." | **Failed** | `q=milk` finds none of the three titles (F1) |
| S5.4 | Acceptance test "S5.4 clearing the search text shows the whole list again" | Passed | empty `q` returns all 500 tasks |
| S5.5 | Acceptance tests "S5.5 ... empty list, not an error" / "... no-match message"; browser at 375x812 | Passed | `No task matches "zzzz".` shown, the 001 empty state stays hidden |
| S6.1 | Acceptance test "S6.1 open only shows only tasks that are not done" | Passed | `open=true` |
| S6.2 | Acceptance test "S6.2 open only combines with the search text" | **Failed** | fails only because of the match rule (F1); the AND combination itself is correct |
| S6.3 | Acceptance test "S6.3 switching open only off ..." | Passed | done tasks reappear |
| R4 | Stakeholder example, the three "milk" titles | **Failed** | see F1 |
| R5 | Acceptance test "R5 searching stores nothing ..."; `md5sum /data/tasks.json` before and after a filtered GET | Passed | checksum unchanged, unfiltered list identical |
| QE5 | 500 tasks, 10 concurrent clients, 2000 searches, 4-letter queries, 20 ms think time | Passed | p50 3.1 ms, **p95 5.2 ms**, p99 10.8 ms, max 37.4 ms, 0 errors (budget 500 ms) |
| QE6 | `docker stats` during the load run | Passed | peak **26.5 MiB / 256 MiB** |
| QE7 | Browser at 375x812; acceptance test "QE7 the search field sits above the list" | Passed | one row above the list, search field 18 px text in a 44 px row, no separate page, no button |
| Out of scope: fuzzy matching | `src/search.js` | Passed | plain string comparison only |
| Out of scope: other fields | `src/search.js` | Passed | only `title` is compared |
| Out of scope: sorting options | `GET /api/tasks` | Passed | the 001 order is untouched |

Note on QE5/QE6: these were measured against the current, cheaper match rule.
They must be re-measured after F1 is fixed. On the evidence in F1 the margin is
overwhelming, so no regression is expected.

## Regression
- Unit tests (`npm test`): 15 passed, 0 failed, 0 skipped. (Note F4: 2 of them assert the wrong rule.)
- Acceptance tests, 001-task-list: **11 passed, 0 failed** — no regression from 002.
- Acceptance tests, 002-find-a-task: 8 passed, **4 failed** (S5.2, S5.3 ×2, S6.2 — all F1).
- Product-wide constraints re-checked: memory 26.5 MiB of 256 MiB under load; container healthy 6 s after start; `docker compose restart` keeps the data (R2 of 001) and the filtered list still answers.
- Robustness probes: `q=%`, `q=<script>`, a 3000-character `q`, `open=1`, `open=false` — all answer 200 and behave sanely; the no-match message is set via `textContent`, so a query cannot inject markup.

## Tests added
- `tests/acceptance/002-find-a-task/search.test.js` — 12 black-box tests covering
  S5.1–S5.5, S6.1–S6.3, R4 (the stakeholder example), R5 and QE7. They are written
  against the requirements, not against the design, and each cleans up after itself.
  They are part of the regression suite from now on:
  `BASE_URL=http://localhost:8121 tests/acceptance/run.sh`.

## Not verified
- Ten *real* browsers searching simultaneously: approximated with 10 concurrent HTTP clients and think time, which is what the design's test strategy describes.
- Long-term memory behaviour beyond the load run (no soak test).

## Observations
- The search field is 42.2 px tall inside a 44 px row, the same as the 001 add-task field. Consistent with 001, so not a finding, but a 44 px field would be a better one-handed target at the machine.
- One request per keystroke is the design's explicit decision and holds comfortably at this size. Worth revisiting only if the list grows far beyond the 500 tasks QE5 assumes.
- `q` is trimmed in the browser but not on the server; `?q=%20milk` therefore behaves differently from typing a leading space in the field. Harmless today, but the two should agree once F1 is fixed.

## Closed findings
None (round 1).
