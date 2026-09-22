# 002 – Find a task: implementation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Status: Needs architect
- Branch: feat/002-find-a-task, commits e107de5..HEAD
- Date: 2026-09-20
- Round: 1

## What was built
1. **`src/search.js` (build order 1)**: only the "open only" filter (S6) is implemented, `filterTasks(tasks, { open })`. `matchesQuery()` (the `q` text search, S5) is **not built**: the design's match rule contradicts the requirements. See "Open gaps" (G1).
2. **Query parameters in `GET /api/tasks` (build order 2)**: `open` is read and applied via `filterTasks()`. `q` is **not read/implemented** (blocked by G1).
3. **UI (build order 3)**: an "Open only" checkbox added above the list in `public/index.html`, wired in `public/app.js` (sends `open=true` when checked, reloads on change), styled in `public/style.css` (44 px row, 18 px text, matching 001's conventions). The search field and the S5.5 no-match state are **not built** (blocked by G1).

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (change `PORT` in `.env`). No seed data, no test users.

## Traceability
| Requirement | Design element | Implemented in | Test | Result |
|---|---|---|---|---|
| S5.1 | `q` in GET /api/tasks, matchesQuery() | Not built | – | Blocked by G1 |
| S5.2 | matchesQuery() | Not built | – | Blocked by G1 |
| S5.3 | matchesQuery() | Not built | – | Blocked by G1 |
| S5.4 | empty q selects everything | Not built | – | Blocked by G1 |
| S5.5 | no-match UI state | Not built | – | Blocked by G1 |
| S6.1 | open-only filter | src/search.js filterTasks(), src/app.js GET /api/tasks | test/search.test.js::"S6.1 \"open only\" keeps only tasks that are not done"; manual: `curl "localhost:8142/api/tasks?open=true"` | Passed |
| S6.2 | open-only + search text | Not built (the search half is blocked by G1) | – | Blocked by G1 |
| S6.3 | open-only toggled off | src/search.js filterTasks(), src/app.js GET /api/tasks | test/search.test.js::"S6.3 \"open only\" off shows done tasks again"; manual: `curl "localhost:8142/api/tasks"` | Passed |
| R4 | matchesQuery() | Not built | – | Blocked by G1 |
| R5 | query in request only | N/A while `q` isn't built; `open` is a request parameter only, nothing stored | – | Passed by construction |
| QE5 | filtering in memory, 500 tasks / 10 users, p95 < 500 ms | Not built (only applies to the search feature) | – | Blocked by G1 |
| QE6 | 256 MB limit | docker-compose.yml mem_limit (unchanged) | Self-validation 5 | Passed: 16 MiB in use |
| QE7 | one row above the list | public/index.html, public/style.css | Self-validation 6 (served assets) | Passed for the checkbox row; moot for the search field until G1 is resolved |
| Out of scope: fuzzy matching | Not designed | – | – | – |
| Out of scope: searching other fields | Not designed | – | – | – |
| Out of scope: sorting options | Not designed | – | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/app.js src/search.js public/app.js` | Passed | No output = no errors |
| 2 | Unit tests | `npm test` | Passed: 13 passed, 0 failed, 0 skipped (before: 10 passed, 0 skipped) | 3 new tests in test/search.test.js, no regressions |
| 3 | Image builds | `PORT=8142 docker compose -p tb-i3-e2-ws build` | Passed | `tb-i3-e2-ws-app  Built` |
| 4 | Stack starts | `PORT=8142 docker compose -p tb-i3-e2-ws up -d` | Passed: healthy after ~4 s | `docker compose ps` → `Up 7 seconds (healthy)` |
| 5 | Regression suite (001) | `BASE_URL=http://localhost:8142 tests/acceptance/run.sh` | Passed: 11 passed, 0 failed, 0 skipped | Same count as 001's own report |
| 6 | S6.1 main flow, API | `curl "localhost:8142/api/tasks?open=true"` after adding 2 open + 1 done task | Passed | Response listed only the 2 open tasks |
| 7 | S6.3 flow, API | `curl "localhost:8142/api/tasks"` (checkbox off) | Passed | Response listed all 3 tasks, done one included |
| 8 | UI assets served correctly | `curl localhost:8142/`, `/app.js`, `/style.css` | Passed | Checkbox markup, `openOnly` wiring and `.open-only` styles present in what the container actually serves |
| 9 | QE6 memory | `docker stats --no-stream` | Passed: 16.39 MiB / 256 MiB | |
| 10 | Data survives | `docker compose -p tb-i3-e2-ws restart` | Passed | 3 tasks before and after |
| 11 | Own diff review | `git diff e107de5..HEAD` | Passed | 4 files changed (app.js, search.js, index.html, app.js, style.css), no debug code, no secrets, no scope creep beyond S6 |
| 12 | Teardown | `docker compose -p tb-i3-e2-ws down -v` | Passed | Container, volume, network removed |

### Not run
- **Interactive browser walkthrough of the "Open only" checkbox** (click the checkbox in a real browser and watch the list re-render). The shared Browser pane used for self-validation was at its tab cap for the whole session (`preview_start`/`tabs_create` both returned "Tab cap reached"), so no tab could be opened against the running stack. Substituted with: (a) the automated unit tests of `filterTasks()`, (b) the same `GET /api/tasks?open=...` calls the checkbox's `fetch` makes, run directly against the container (check 6/7), and (c) fetching the actual served `index.html`/`app.js`/`style.css` from the container to confirm the checkbox markup and wiring are what is really deployed, not just what's in source (check 8). This is not a substitute for watching the click happen, so the visual/interactive part of S6.1/S6.3 is not independently verified end-to-end in a browser.
- **QE5 load test (500 tasks, 10 concurrent searchers, p95 < 500 ms)**: not run. This quality expectation is about the search feature, which is blocked by G1 and not built.
- **S5 acceptance criteria and R4** (S5.1–S5.5): not run, not built — blocked by G1.

## Implementation choices
- `open`'s wire format is not spelled out in the design's Interfaces table (only `q` is documented there; the Components row just says app.js "reads `q` and `open`"). Chose a truthy query flag, `open=true` (any other value or its absence means "off"), since this is a same-process contract between the browser JS and its own server that this feature builds on both ends in the same slice — not an architecture decision, so not escalated.
- Kept `matchesQuery()`'s absence explicit: `src/search.js` exports only `filterTasks()` and documents in a comment why the text-search half isn't there, instead of leaving a stub that could look finished.

## Tests changed
None. `test/search.test.js` is new; no existing test was modified or removed.

## Open gaps
- **G1 – The search match rule contradicts the requirements** (`docs/architecture/.gaps/002-find-a-task.md`). Blocks: all of S5 (`matchesQuery()`, the `q` parameter, the search field, the S5.5 no-match state), R4, QE5's search-specific load test, and the search half of S6.2. Design's `title.startsWith(q)` case-sensitive prefix match cannot satisfy R4/S5.2/S5.3's case-insensitive, anywhere-in-title examples (e.g. "Buy Milk" matching "milk", or "Order milk crate" matching "milk"). See the gaps file for the full evidence and a suggested fix.

## Validator findings
### Round 1
No findings yet; this is the first implementation round for 002.
