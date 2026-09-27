# 002 – Find a task: implementation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Status: Needs architect
- Branch: feat/002-find-a-task, commit 7513900
- Date: 2026-09-20
- Round: 1

## What was built
1. **S6 – Hide what is finished**: `src/search.js` exports `filterTasks({ tasks, open })`, which drops done tasks when `open` is true (S6.1, S6.3). `src/app.js`'s `GET /api/tasks` reads an `open=true` query parameter and applies it (R5: the flag lives in the request only, nothing is stored). `public/index.html` gained an "Open only" checkbox above the list, and `public/app.js` re-fetches with `open=true` when it is checked.
2. **S5 – Find a task by typing**: **not built.** The design's match algorithm contradicts the requirement it implements (see "Open gaps", G1). Building it would mean guessing a business rule, so `matchesQuery()`, the `q` query parameter, the search input field and the "no match" UI state (S5.5) do not exist yet.
3. **S6.2 (the combined case)**: only half built. "Open only" filters correctly on its own, but "open only + a search text" can't be finished or tested without S5.

## How to run
```
cp .env.example .env
docker compose up -d
```
UI at http://localhost:8080 (or `$PORT`). Open-only toggle is the checkbox above the list; nothing about the search field is visible yet.

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1 | Not built | – | Blocked by G1 |
| S5.2 | Not built | – | Blocked by G1 |
| S5.3 | Not built | – | Blocked by G1 |
| S5.4 | Not built | – | Blocked by G1 |
| S5.5 | Not built | – | Blocked by G1 |
| S6.1 | src/search.js filterTasks(), src/app.js GET /api/tasks | test/search.test.js::"S6.1 keeps only the tasks that are not done when open is on" | Passed |
| S6.2 | src/search.js filterTasks() (open half only) | Manual check (Self-validation 5) confirms the open half; the search half is blocked by G1 | Partially passed |
| S6.3 | src/search.js filterTasks() | test/search.test.js::"S6.3 keeps every task when open is off" | Passed |
| R4 | Not built | – | Blocked by G1 |
| R5 | `open` lives in the query string only, never in store.js | Self-validation 5 (curl) | Passed by construction |
| QE5 | Not built (needs a real search) | – | Not run: blocked by G1 |
| QE6 | No new container; same 256 MB limit | Self-validation 7 | Passed: 17 MiB in use |
| QE7 | Not built (needs the search field) | – | Blocked by G1 |
| Out of scope: fuzzy matching | Not built | – | – |
| Out of scope: searching other fields | Not built | – | – |
| Out of scope: sorting options | Not built | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/app.js src/search.js public/app.js` | Passed | No errors |
| 2 | Unit tests | `npm test` | Passed: 13 passed, 0 failed, 0 skipped (before: 10 passed, 0 skipped) | |
| 3 | Image builds | `PORT=8132 docker compose -p tb-i2-e2-os build` | Passed | |
| 4 | Stack starts | `PORT=8132 docker compose -p tb-i2-e2-os up -d` | Passed: app healthy after ~2 s | `docker compose ps` Health: healthy |
| 5 | S6.1/S6.3 via API | `curl` GET /api/tasks and GET /api/tasks?open=true, with one open and one done task | Passed | all tasks: 2 returned; `open=true`: 1 returned (the open one) |
| 6 | Regression: 001 acceptance suite | `BASE_URL=http://localhost:8132 tests/acceptance/run.sh` | Passed: 11 passed, 0 failed | |
| 7 | R2/data survives | `docker compose -p tb-i2-e2-os restart`, then GET /api/tasks | Passed: the task created before restart was still there | |
| 8 | QE6 memory | `docker stats --no-stream tb-i2-e2-os-app-1` | Passed: 17 MiB / 256 MiB | |
| 9 | Own diff review | `git diff e107de5..HEAD -- src public test` | Passed | No debug output, no TODOs, no files outside the S6 scope |
| 10 | Tear down | `docker compose -p tb-i2-e2-os down -v` | Passed | |

### Not run
- **QE5 (500-task / 10-concurrent-user load test)**: needs a real search query to exercise; the match algorithm is blocked by G1. Cannot be run against a feature that doesn't exist.
- **UI click-through of the checkbox in a browser**: the browser tool available in this environment is shared with other, concurrent evaluation runs on this machine and its open tabs belong to those runs, so it was not used to avoid touching them. S6 was instead verified end-to-end against the running Docker stack over HTTP (Self-validation 5), which exercises the same code path `public/app.js` calls.

## Implementation choices
- `open=true` (string) is the query parameter contract for the open-only filter; any other value or its absence means "off". The design's components table names `open` as a parameter but its Interfaces table only specifies `q`'s contract, not `open`'s; this is exactly the kind of parameter encoding the design leaves to implementation, unlike the match algorithm below, so it was decided rather than escalated.
- The "Open only" checkbox sits in its own `.toolbar` row above the list, sized to the 001 conventions (18 px text, 44 px row height, 24 px checkbox) so the row is ready to hold the search field once G1 is resolved.

## Tests changed
None.

## Open gaps
- **G1 – The designed match algorithm contradicts R4 and its worked examples** (docs/architecture/.gaps/002-find-a-task.md). Blocks S5.1–S5.5, R4, the `q` parameter, the search input field, the S5.5 no-match state, the search half of S6.2, and the QE5 load test.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings yet: first round, sent to the architect before validation | |
