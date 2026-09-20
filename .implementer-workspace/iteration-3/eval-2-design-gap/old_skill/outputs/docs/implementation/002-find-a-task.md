# 002 – Find a task: implementation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Status: Needs architect
- Branch: feat/002-find-a-task, commits e107de5..205c054
- Date: 2026-09-20
- Round: 1

## What was built
1. **S6 – Hide what is finished**: `src/search.js` (`filterTasks(tasks, { open })`), wired into `GET /api/tasks?open=true` in `src/app.js`. The UI (`public/index.html`, `public/app.js`, `public/style.css`) got an "Open only" checkbox above the list that toggles the `open` request parameter and re-renders.
2. **S5 – Find a task by typing: not built.** The design's match rule contradicts the requirements it implements (see "Open gaps", G1). Building it would mean guessing which of the two contradictory rules is right, so `q` is not wired into the API and no search field was added to the UI (an inert search input would be misleading). `matchesQuery()` from the design's Components table does not exist yet.
3. **R5** (nothing about a search is stored): true by construction — no state was added; `open` lives in the request only.

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (or `$PORT`). No seed data, no test users. Same as 001.

## Traceability
| Requirement | Design element | Implemented in | Test | Result |
|---|---|---|---|---|
| S5.1 | `q` in `GET /api/tasks`, `matchesQuery()` | Not built | – | Blocked by G1 |
| S5.2 | `matchesQuery()` | Not built | – | Blocked by G1 |
| S5.3 | `matchesQuery()` | Not built | – | Blocked by G1 |
| S5.4 | empty `q` selects everything | Not built | – | Blocked by G1 |
| S5.5 | no-match UI state | Not built | – | Blocked by G1 |
| S6.1 | open-only filter | `src/search.js` `filterTasks()`, `src/app.js` GET | test/search.test.js::"S6.1 keeps only the tasks that are not done when open is on" | Passed |
| S6.2 | open-only + search combined | Not built | – | Blocked by G1 (needs a working search first) |
| S6.3 | open-only filter | `src/search.js` `filterTasks()`, `public/app.js` | test/search.test.js::"S6.3 shows done tasks again when open is off" | Passed |
| R4 | `matchesQuery()` | Not built | – | Blocked by G1 |
| R5 | query in request only | No code added | – | Passed by construction |
| QE5 | filtering in memory | `filterTasks()` over the in-memory list | Self-validation 7 (500+3 tasks) | Passed for what's built: 15 ms for `GET /api/tasks?open=true` |
| QE6 | no new container | Unchanged compose stack | Self-validation 7 | Passed: 19 MiB / 256 MiB |
| QE7 | one row above the list | `public/index.html` `.filters` row | Manual/HTTP check (Self-validation 5) | Passed for the checkbox; the search field is part of the blocked slice |
| Out of scope: fuzzy matching | Not designed | Not built | – | – |
| Out of scope: searching other fields | Only `title` | Not built | – | – |
| Out of scope: sorting options | Order unchanged | Unchanged `store.list()` | – | Passed by construction |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/app.js src/search.js public/app.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 13 passed, 0 failed, 0 skipped (before: 10 passed, 0 skipped) | |
| 3 | Image builds | `PORT=8152 docker compose -p tb-i3-e2-os build` | Passed | |
| 4 | Stack starts | `PORT=8152 docker compose -p tb-i3-e2-os up -d` | Passed: app healthy after ~8 s | |
| 5 | Regression suite (001) | `BASE_URL=http://localhost:8152 tests/acceptance/run.sh` | Passed: 11 passed, 0 failed (unchanged; no acceptance tests exist yet for 002, directory left untouched) | |
| 5 | S6 main flow via API | `curl` create 3 tasks, mark one done, `GET /api/tasks` and `GET /api/tasks?open=true` | Passed: full list has 3, `open=true` has 2 (done task excluded) | see command output in session log |
| 5 | Validation failure path | `curl -X POST /api/tasks -d '{"title":"  "}'` | Passed: 400 | |
| 5 | UI served | `curl http://localhost:8152/`, `/app.js`, `/style.css` | Passed: page includes the "Open only" checkbox, `app.js` sends `open=true` when checked | Browser tool unavailable this round (shared pane at its tab cap) — see "Not run" |
| 6 | Data survives | `docker compose -p tb-i3-e2-os restart`, then `down` (no `-v`) + `up -d` | Passed: all 3 tasks (incl. the done one) still present both times | |
| 7 | QE5-adjacent timing at scale | 500 tasks created, then timed `GET /api/tasks` and `GET /api/tasks?open=true` | Passed for what's built: 8.7 ms / 15.2 ms, far under the 500 ms budget | |
| 7 | QE6 memory | `docker stats --no-stream` | Passed: 18.9 MiB / 256 MiB | |
| 8 | Own diff review | `git diff e107de5..HEAD` | Passed: no debug code, no TODOs, no secrets, no scope creep | |
| 9 | Tear down | `docker compose -p tb-i3-e2-os down -v` | Done | |

### Not run
- Clicking through the UI in a real browser: the shared Browser pane was at its tab cap for the whole session (other evaluation runs' tabs occupy it) and neither a new tab nor reusing an existing one was possible without touching another run's tab. Compensated with: unit tests for `filterTasks()`, an HTTP fetch of `/`, `/app.js` and `/style.css` confirming the checkbox and its wiring are served correctly, and `curl` end-to-end checks of the API path the checkbox drives.
- A full QE5 load test (10 concurrent users, p95 threshold) against the search: not applicable yet, since S5 (the thing QE5 is a budget for) isn't built. The single-request timings above cover what is built (`open`).
- `docker buildx build --platform ...` for a non-default architecture: not attempted, no target architecture is stated in the design beyond `node:22-alpine`, unchanged from 001.

## Implementation choices
- `filterTasks(tasks, { open })` takes an options object rather than a second positional argument, so a `q` option can be added later (once G1 is resolved) without changing the call sites' shape.
- The "Open only" checkbox lives in its own `.filters` row now, sized to the same 44 px / 18 px convention as the rest of the UI, so the search field can be dropped into the same row later without restyling it.
- `open` is read as the exact string `"true"` (`url.searchParams.get('open') === 'true'`), matching how the browser's `URLSearchParams` serializes a checked checkbox; anything else (missing, `"false"`, etc.) is treated as "off".

## Tests changed
None.

## Open gaps
- **G1** (docs/architecture/.gaps/002-find-a-task.md): the design's match rule (`title.startsWith(q)`, case-sensitive) contradicts the requirements (R4, S5.2, S5.3: case-insensitive, anywhere in the title), with no ADR covering the deviation. Blocks S5.1, S5.2, S5.3, S5.4, S5.5, R4, and S6.2. Everything else in the design's build order (S6, R5, the compose stack) is built and self-validated.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings yet (first round) | |
