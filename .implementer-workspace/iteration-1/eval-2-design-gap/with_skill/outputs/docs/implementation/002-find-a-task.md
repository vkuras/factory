# 002 – Find a task: implementation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Status: Needs architect
- Branch: feat/002-find-a-task, commit 3f47832
- Date: 2026-09-20
- Round: 1

## What was built
The design's build order has three steps; only the parts that do not depend
on the text-match rule are built. The rest is blocked by G1 (see "Open
gaps").

1. **`src/search.js`**: `filterTasks(tasks, { open })`, the "open only"
   filter (S6.1, S6.3). `matchesQuery()` (S5, R4) is **not built** — it is
   blocked by G1.
2. **`GET /api/tasks`** in `src/app.js` now reads `open` (`open=true` hides
   done tasks) and applies `filterTasks`. The `q` parameter and the
   `query` response field from the design's Interfaces table are **not
   built** — also blocked by G1.
3. **UI**: an "Open only" checkbox above the list in `public/index.html`,
   wired in `public/app.js` to reload the list with `?open=true` when
   checked. The search field and the `No task matches "<text>".` state are
   **not built** — blocked by G1.

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (change `PORT` in `.env`), same as 001.

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1–S5.5 | Not built | – | Blocked by G1 |
| S6.1 | src/search.js filterTasks, src/app.js GET /api/tasks?open=true | test/search.test.js::"S6.1 keeps only the tasks that are not done when open is true"; tests/acceptance/002-find-a-task/tasks.test.js::"S6.1 open=true hides done tasks" | Passed |
| S6.2 | Not built | – | Blocked by G1 (needs a working `matchesQuery()`) |
| S6.3 | src/app.js GET /api/tasks (default) | test/search.test.js::"S6.3 returns every task again when open is false"; tests/acceptance/002-find-a-task/tasks.test.js::"S6.3 switching open=true off shows done tasks again" | Passed |
| R4 | Not built | – | Blocked by G1 |
| R5 | No code needed | – | Passed by construction: `open`/`q` live in the request/response only |
| QE5 | Not applicable yet | – | No search built to load-test |
| QE6 | docker-compose.yml mem_limit (unchanged from 001) | Self-validation 7 | Passed: 19 MiB in use |
| QE7 | public/index.html toolbar row | Self-validation 6 | Passed: one row above the list, no separate page (search field itself still missing, see G1) |
| Out of scope: fuzzy matching | Not built | – | – |
| Out of scope: searching other fields | Not built | – | – |
| Out of scope: sorting options | Not built | – | – |

## Self-validation
Project name `tb-i1-e2-ws`, published on port 8102.

| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/app.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 14 passed, 0 failed, 0 skipped (before: 0 skipped) | |
| 3 | Traceability | see table above | Passed | every built row has a green test |
| 4 | Image builds | `PORT=8102 docker compose -p tb-i1-e2-ws build` | Passed | |
| 5 | Stack starts | `PORT=8102 docker compose -p tb-i1-e2-ws up -d` | Passed: app healthy after 6 s | |
| 6 | Acceptance tests (regression + new) | `BASE_URL=http://localhost:8102 tests/acceptance/run.sh` | Passed: 13 passed, 0 failed (11 from 001, 2 from 002) | |
| 7 | Use it like a user – API | `curl` POST/PATCH/GET with and without `open=true` | Passed: `GET /api/tasks?open=true` returns only the not-done task; `open=false`/omitted returns both | |
| 8 | Use it like a user – UI | Browser at http://localhost:8102 | Passed: added "Buy milk" (open) and "Water plants" (done); checking "Open only" hid "Water plants"; unchecking showed it again | |
| 9 | Data survives | `docker compose -p tb-i1-e2-ws restart` | Passed: both tasks still present after restart | |
| 10 | QE6 memory | `docker stats --no-stream` | Passed: 19.06 MiB / 256 MiB | |
| 11 | Own diff review | `git diff e107de5..HEAD` | Passed: no debug code, no TODOs, no secrets; scope matches the unblocked slice only | |
| 12 | Teardown | `docker compose -p tb-i1-e2-ws down -v` | Passed | |

### Not run
- **QE5 load test** (500 tasks, 10 concurrent searchers, p95 < 500 ms): not
  run, because the thing it measures — the search endpoint — is not built
  yet (blocked by G1). Will run once `q`/`matchesQuery()` exist.
- S5.1–S5.5, S6.2 acceptance tests: not written, same reason.

## Implementation choices
- `filterTasks(tasks, { open })` takes an options object rather than a
  positional boolean, so `matchesQuery`/`q` can be added as a second option
  later without changing the call sites again.
- The `open` query parameter is read as the literal string `"true"`
  (`url.searchParams.get('open') === 'true'`); any other value, including
  absence, means "show everything". The design names the parameter but not
  its value encoding, so this was mine to decide, consistent with how the
  UI's own checkbox produces it.
- The "Open only" checkbox lives in its own `.toolbar` row (`public/`),
  matching QE7's "one row above the list" even though the search field
  itself isn't in that row yet.

## Tests changed
None.

## Open gaps
- **G1** (docs/architecture/.gaps/002-find-a-task.md): the design's match
  rule (`title.startsWith(q)`, case-sensitive) contradicts R4/S5.2/S5.3
  (case-insensitive, anywhere in the title). Blocks S5.1–S5.5, S6.2, the
  `q` parameter and `query` response field, the search field and the
  no-match UI state, and the QE5 load test. Suggested fix in the gap: a
  case-insensitive substring match, which keeps ADR-0003 and the rest of
  the design unchanged.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings yet; first round is needs-architect, not ready for validation | |
