# 002 – Find a task: implementation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Status: Ready for validation
- Date: 2026-09-20
- Round: 1

## What was built
1. **Search/filter**: `src/search.js` — `matchesQuery()` and `filterTasks()`.
2. **API**: `GET /api/tasks` in `src/app.js` now reads `q` and `open` from the
   query string and filters before answering, per ADR-0003.
3. **UI**: a search field and an "open only" checkbox added above the list in
   `public/index.html`/`public/style.css`; `public/app.js` fires a request on
   every keystroke and checkbox change, and shows `No task matches "<text>".`
   instead of the 001 empty state when a filter yields nothing (S5.5).

## Design gap found during implementation
The design's Decisions and Interfaces sections specify the match as a
**case-sensitive prefix** match (`title.startsWith(q)`), justified by ADR-0003
and a performance argument. That directly contradicts the requirements it is
meant to satisfy:
- R4: "A search matches when the typed text occurs anywhere in the task's
  title, comparing without regard to upper and lower case."
- S5.2: "Buy Milk" must be found by searching "milk" (case-insensitive).
- S5.3: "Buy milk" must be found by searching "milk" even though the text is
  not at the start of the title.

A prefix/case-sensitive match would fail all three of these acceptance
criteria (e.g. it would not find "Buy Milk" when searching "milk", nor "Order
milk crate" when searching "milk" — the stakeholder's own example in the
requirements' Notes and Appendix L2/L3).

There is no human to defer to in this run, so I implemented `matchesQuery()`
per the requirements (case-insensitive substring — `title.toLowerCase().
includes(query.toLowerCase())`) rather than per the design's literal text,
since the acceptance criteria are what the feature is judged against and the
prefix rule would ship a feature that fails its own spec. This is called out
in `src/search.js` and flagged here for architecture to reconcile: ADR-0003's
"Decision" text and the design's "Interfaces"/"Decisions" sections should be
corrected to describe a case-insensitive substring match, or the requirements
should be revisited if a prefix match was actually intended for a reason not
captured in R4/S5.2/S5.3. `open`/`q` as request query parameters, "filter
inside GET /api/tasks" (ADR-0003's actual decision, option B), and the
overall no-index/in-memory approach are unaffected and were implemented as
designed.

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (change `PORT` in `.env`).

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1 | src/search.js matchesQuery(), src/app.js `q` | tests/acceptance/002-find-a-task/search.test.js::"S5.1/S5.3 finds a task whose title contains the search text anywhere"; test/search.test.js | Passed |
| S5.2 | src/search.js matchesQuery() (case-insensitive) | ...::"S5.2/R4 matching ignores case"; test/search.test.js | Passed |
| S5.3 | src/search.js matchesQuery() (substring, not prefix) | ...::"S5.1/S5.3 finds a task whose title contains the search text anywhere"; test/search.test.js | Passed |
| S5.4 | empty `q` selects everything | ...::"S5.4 clearing the search text shows the whole list again"; test/search.test.js | Passed |
| S5.5 | public/app.js no-match message | ...::"S5.5 an unmatched search returns no tasks (the UI shows the no-match message)"; manual check 1 | Passed |
| S6.1 | src/search.js filterTasks() `open` | ...::"S6.1 \"open only\" hides done tasks"; test/search.test.js | Passed |
| S6.2 | src/search.js filterTasks() combined | ...::"S6.2 \"open only\" combines with the search text"; test/search.test.js | Passed |
| S6.3 | src/app.js `open` param | ...::"S6.3 switching \"open only\" off shows done tasks again"; test/search.test.js | Passed |
| R4 | src/search.js matchesQuery() — implemented per requirements, see "Design gap found during implementation" | test/search.test.js | Passed |
| R5 | query lives in request/response only, store untouched | – | Passed by construction |
| QE5 | in-memory `Array.prototype.filter`, no index, no extra request | Manual check 2 | Passed: sub-millisecond at current data sizes |
| QE6 | no new container, no new stored data | Self-validation 3 | Passed: 18.75 MiB / 256 MiB |
| QE7 | one row above the list, no search page | Manual check 1 | Passed |
| Out of scope: fuzzy matching | Not built | – | – |
| Out of scope: searching other fields | Only `title` compared | – | – |
| Out of scope: sorting options | `store.list()` order unchanged | – | Passed by construction |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/*.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 18 passed, 0 failed | |
| 3 | Image builds | `PORT=8112 docker compose -p tb-i1-e2-ns up -d --build` | Passed | |
| 4 | Stack starts | same as above | Passed: app healthy | |
| 5 | Acceptance tests (regression + new) | `BASE_URL=http://localhost:8112 tests/acceptance/run.sh` | Passed: 11 (001) + 8 (002), 0 failed | |
| 6 | QE6 memory | `docker stats --no-stream` | Passed: 18.75 MiB / 256 MiB | |
| 7 | Manual: UI shows search field and checkbox above the list, 001 empty state untouched | Screenshot in Browser pane at http://localhost:8112 | Passed | |
| 8 | Manual: end-to-end search/filter via curl (add "Buy Milk", "Order milk crate", "Call the plumber"; `?q=MILK` returns the two milk tasks; `?q=zzz` returns none; `?open=true` filters done tasks) | `curl` against the running stack | Passed | |

### Not run
A dedicated load test at 500 tasks / 10 concurrent users (QE5) was not run; at
this data size (a handful of tasks) the in-memory filter is sub-millisecond,
and the design's own reasoning (an array scan over 500 short strings costs
microseconds) is not disputed by this implementation — only the match
predicate's semantics changed, not its cost.

## Implementation choices
- `matchesQuery()` implements a case-insensitive substring match, not the
  design's case-sensitive prefix match — see "Design gap found during
  implementation".
- The "no match" message reads `No task matches "<text>".` when a search
  text is present (per the design's UI section and S5.5), or the generic
  `No task matches.` when only "open only" narrows an otherwise-empty result
  with no search text — the design and requirements do not specify wording
  for that combination.
- The browser fires one request per `input`/`change` event, no debounce, per
  the design's explicit choice to leave debouncing out.

## Tests changed
None removed or altered; `test/search.test.js` and
`tests/acceptance/002-find-a-task/search.test.js` added.

## Open gaps
- **Design gap (see above)**: docs/architecture/002-find-a-task.md's
  Decisions and Interfaces sections, and ADR-0003, describe a case-sensitive
  prefix match that contradicts R4/S5.2/S5.3. The code and its tests follow
  the requirements. Architecture should update the design text (and confirm
  ADR-0003's consequences still hold for a substring scan rather than a
  prefix scan — it does, since both are O(tasks) at this size) so the design
  and the shipped behaviour agree.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | Not yet validated | |
