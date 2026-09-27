# 002 – Find a task: implementation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Status: Needs architect
- Branch: feat/002-find-a-task, commits c783bde..2375296
- Date: 2026-09-20
- Round: 1

## What was built

While walking the design's traceability table against the requirements (step 2 of the workflow), I found that the design's search rule contradicts the requirements. Filed as **G1** in `docs/architecture/.gaps/002-find-a-task.md`:

- The design (§Decisions, §Interfaces) specifies `title.startsWith(q)`: a **case-sensitive prefix match**.
- The requirements (R4, S5.2, S5.3) specify a **case-insensitive match anywhere in the title**, and the stakeholder's own worked example ("milk" should surface "Buy Milk", "Order milk crate" and "Milk bill") fails under the design's rule on all three examples.

Building the design as written would ship a feature that fails S5.2, S5.3 and R4. Deciding the algorithm myself instead of the design would overrule an explicit design decision, which isn't mine to make. So **S5 (find a task by typing) was not built** and is blocked on G1: `matchesQuery()`, the `q` query parameter, the search field, and the "no match" UI state.

**S6 (hide what is finished) does not depend on G1 and was built in full:**

1. **`src/search.js`** (new): `filterTasks(tasks, { open })` — keeps only tasks where `done` is `false` when `open` is true, otherwise returns the list unchanged. Unit tests in `test/search.test.js`.
2. **`GET /api/tasks`** (`src/app.js`): reads the `open` query parameter (`open=true`) and filters the list through `filterTasks()` before answering. The `q` parameter is intentionally not read (blocked by G1).
3. **UI** (`public/index.html`, `public/app.js`, `public/style.css`): an "Open only" checkbox above the list, 44 px row height / 18 px text per the 001 conventions and the design's UI section. Toggling it re-fetches `/api/tasks` with or without `open=true` and re-renders. No search field was added, since it would have nothing correct to call.

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (change `PORT` in `.env`). No seed data, no test users. Self-validation in this round used project name `tb-i2-e2-ws` and `PORT=8122`.

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1–S5.5 | Not built | – | Blocked by G1 |
| S6.1 | src/search.js `filterTasks()`, GET /api/tasks `open` param | test/search.test.js::"S6.1 keeps only the tasks that are not done when open-only is on", test/app.test.js::"S6.1 GET /api/tasks?open=true hides done tasks" | Passed |
| S6.2 | src/search.js `filterTasks()` (open half only; text half blocked) | – | Partially covered: open-only half passed (above); the "also search for text" half is blocked by G1 |
| S6.3 | GET /api/tasks (open omitted/false) | test/search.test.js::"S6.3 returns every task when open-only is off", test/app.test.js::"S6.3 GET /api/tasks without open shows done tasks again" | Passed |
| R4 | Not built | – | Blocked by G1 |
| R5 | `open`/`q` live in the request only, nothing stored | – | Passed by construction (unchanged from design) |
| QE5 | Not built (applies to the `q` search) | – | Blocked by G1 |
| QE6 | No new container, no new data kept | Self-validation 7 | Passed: 17 MiB / 256 MiB |
| QE7 | One row above the list (checkbox only; field pending G1) | Self-validation 5 (UI walkthrough) | Passed for what was built |
| Out of scope: fuzzy matching | Not built | – | – |
| Out of scope: searching other fields | Not built | – | – |
| Out of scope: sorting options | Not built | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax check | `node --check src/*.js public/*.js test/*.js tests/acceptance/*.js tests/acceptance/*/*.js` | Passed | No output = no errors |
| 2 | Unit tests | `npm test` | Passed: 16 passed, 0 failed, 0 skipped (before this round: 10 passed, 0 skipped) | |
| 3 | Traceability | See table above | Passed for built rows | |
| 4 | Image build | `PORT=8122 docker compose -p tb-i2-e2-ws build --no-cache` | Passed | Clean build, no cache |
| 4 | Stack starts | `PORT=8122 docker compose -p tb-i2-e2-ws up -d` | Passed: healthy in ~6 s | `docker compose ps` → `Up ... (healthy)`; logs: "Taskboard listening on port 8080, data in /data", no errors |
| 5 | API walkthrough | `curl` against `http://localhost:8122` | Passed | POST 2 tasks, PATCH one done, `GET /api/tasks` → both; `GET /api/tasks?open=true` → only the open one; `GET /api/tasks?open=false` → both again |
| 5 | Failure path | `curl -X DELETE .../api/tasks/999999` | Passed | 404 |
| 5 | UI walkthrough | Browser at http://localhost:8122 | Passed | Added "Buy milk" and "Order milk crate" through the form, ticked "Order milk crate" done, checked "Open only" → only "Buy milk" shown; unchecked → both shown again |
| 6 | Data survives | `docker compose -p tb-i2-e2-ws restart` | Passed | `GET /api/tasks` after restart still returned both tasks with the same `done` states |
| 7 | QE6 memory | `docker stats --no-stream` | Passed: 17.02 MiB / 256 MiB | |
| 8 | Own diff review | `git diff e107de5..HEAD` | Passed | No debug code, no TODOs, no secrets, no scope creep beyond G1; see below |
| 9 | Tear down | `PORT=8122 docker compose -p tb-i2-e2-ws down -v` | Passed | Container, network and volume removed |

### Not run
- **QE5 load test** (500 tasks / 10 concurrent searchers / p95 < 500 ms): not run. It verifies the `q` search path, which is blocked by G1 and not built. Once G1 is resolved and `matchesQuery()`/`q` are implemented, this must be run before the next handover.
- `tests/acceptance/` was left exactly as found (no folder exists yet for 002; per the workflow, that directory belongs to the validator and was not touched or added to). Ran `tests/acceptance/run.sh` against the started stack to confirm the existing 001 suite still passes: 11 passed, 0 failed.

## Implementation choices
- `filterTasks()` takes an options object (`{ open }`) rather than positional arguments, so a future `q` parameter can be added without changing the existing call sites' argument order.
- The "Open only" checkbox re-fetches on every `change` event (no debounce needed, matching the design's stated preference for simplicity over timer bookkeeping for `q`).
- No `query` field was added to the `GET /api/tasks` response (the design's Interfaces section adds one for `q`), since there is no `q` to echo yet; this will need to be added together with G1's resolution.

## Tests changed
None.

## Open gaps
- **G1** (`docs/architecture/.gaps/002-find-a-task.md`): the design's case-sensitive prefix match rule contradicts R4/S5.2/S5.3. Blocks S5.1–S5.5, R4, QE5, and the search half of S6.2.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings yet; this is the first implementation round, handed to the architect before the validator | |
