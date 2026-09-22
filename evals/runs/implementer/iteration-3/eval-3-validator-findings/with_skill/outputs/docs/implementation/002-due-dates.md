# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feature/002-due-dates, commits 9c1d2e3..7b8a9f0 (round 1), 4d587fd (round 2)
- Date: 2026-09-20
- Round: 2

## What was built
1. **Dates module**: `src/dates.js` with `today()` in Europe/Berlin, `validateDueDate()` (R5) and `dueState()` (R4). The comparison in `dueState()` is strict, so a task whose day is today is `due-today` and not `overdue`. Unit tests in `test/dates.test.js` cover both sides of that boundary.
2. **API**: `POST` and `PATCH /api/tasks` take an optional `dueDate`; `GET /api/tasks` adds `dueState` to every task and honours the `X-Today` header of ADR-0002.
3. **List order**: `store.list()` keeps the open/done grouping of 001 S3.2 and orders by due date inside each group, undated tasks last (S6.5).
4. **UI**: a native date input in the add form and a marking per row ("Overdue 2026-09-18", "Due today 2026-09-19", or the plain day), red and bold when overdue. Title and marking are 20 px on a phone viewport (QE5).

### Round 2 (validator findings)
5. **F1 fix**: `dueState()` used `dueDate <= reference` for the overdue branch, so a task due today matched `overdue` and the `due-today` check below it was dead code. Changed to `dueDate < reference` (`src/dates.js`). The existing unit test `test/dates.test.js` had encoded the wrong behaviour ("R4 marks a task due today as overdue"); corrected it to assert `due-today`.
6. **F3 fix**: `TaskStore.flush()` wrote straight to `tasks.json` with `writeFileSync` (truncate then write in place). A process killed mid-write (a container restart or an OOM kill) could leave the file truncated or corrupted, losing data that had already been acknowledged to the client, not only "the change in flight" that ADR-0001 accepts as a risk. `flush()` now writes to a temp file and `renameSync`s it into place (`src/store.js`); a rename is atomic on the same filesystem, so an interrupted flush always leaves either the complete previous file or the complete new one.
7. **F2**: not built. See "Validator findings" below; it asks for something the requirements put out of scope.

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080. To see the states without waiting for a day to pass:
```
curl -H 'X-Today: 2026-09-19' http://localhost:8080/api/tasks
```

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1 | src/app.js POST | Self-validation 6 | Passed |
| S5.2 | src/app.js POST (dueDate optional) | test/dates.test.js::"R5 accepts no due date" | Passed |
| S5.3 | src/app.js PATCH | Self-validation 7 | Passed |
| S5.4 | src/dates.js validateDueDate | test/dates.test.js (2 tests) | Passed |
| S5.5 | src/app.js POST | Self-validation 8 | Passed |
| S6.1 | src/dates.js dueState | test/dates.test.js::"R4 marks a task due yesterday as overdue" | Passed |
| S6.2 | src/dates.js dueState | test/dates.test.js::"R4 marks a task due today as due-today, not overdue"; tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 marks a task due today as due today and not as overdue" | Passed (fixed in round 2, see F1) |
| S6.3 | src/dates.js dueState | test/dates.test.js::"R4 marks a task due tomorrow as upcoming" | Passed |
| S6.4 | src/dates.js dueState, public/style.css .due.none | test/dates.test.js::"R4 marks a task without a due date as none" | Passed |
| S6.5 | src/store.js list() | test/store.test.js (3 tests, including the done/open grouping) | Passed |
| R4 | src/dates.js | test/dates.test.js | Passed |
| R5 | src/dates.js | test/dates.test.js | Passed |
| R6 | optional field, a missing key reads as null | test/store.test.js::"S6 puts tasks without a due date last" | Passed |
| R2 (persistence, F3) | src/store.js flush() (temp file + rename) | test/store.test.js::"R2 flush() never leaves a half-written file behind (validation 002 F3)" | Passed (fixed in round 2) |
| QE5 | public/style.css | Self-validation 9 | Passed: title 20 px, marking 20 px at 390x844 |
| QE6 | public/app.js DUE_LABELS | Self-validation 9 | Passed: the word is there in all four states |
| QE7 | public/index.html | Self-validation 9 | Passed: one row of inputs and one button |
| Out of scope: recurring tasks | Not built | Self-validation 10 | – |
| Out of scope: reminders | Not built | – | – |
| Out of scope: times of day | Not built, the field is a day | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/app.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 20 passed, 0 failed, 0 skipped (before: 0 skipped) | |
| 3 | Image builds | `docker compose build` | Passed | |
| 4 | Stack starts | `docker compose up -d` | Passed: app healthy after 6 s | |
| 5 | Acceptance tests of 001 (regression) | `tests/acceptance/run.sh 001-task-list` | Passed: 11 passed, 0 failed | |
| 6 | S5.1 main flow | `curl -X POST -d '{"title":"Pay the invoice","dueDate":"2026-09-18"}'` | Passed | 201, day visible in GET |
| 7 | S5.3 set a day later | `curl -X PATCH -d '{"dueDate":"2026-09-30"}'` | Passed | 200 |
| 8 | S5.5 past day | `curl -X POST -d '{"title":"late one","dueDate":"2026-01-02"}'` | Passed | 201 |
| 9 | QE5/QE6/QE7 phone | Browser at 390x844 | Passed: one row, 20 px title and marking, word in every state | |
| 10 | Out of scope | `POST` with `"repeat":"weekly"` | Passed: the field is ignored and not stored | response has no `repeat` |
| 11 | R2 restart | `docker compose down && docker compose up -d` | Passed: due dates survived | |
| 12 | QE2 memory | `docker stats --no-stream` | Passed: 43 MiB / 256 MiB | |

### Round 2 (full rerun, after fixing F1/F3, project `tb-i3-e3-ws`)
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/dates.js src/store.js src/app.js public/app.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 21 passed, 0 failed, 0 skipped (before: 0 skipped) | 1 new test (F3 regression) |
| 3 | Image builds | `PORT=8143 docker compose -p tb-i3-e3-ws build` | Passed | |
| 4 | Stack starts | `PORT=8143 docker compose -p tb-i3-e3-ws up -d` | Passed: healthy in ~2 s | `docker compose ps` shows `(healthy)` |
| 5 | Acceptance tests, 001 + 002 (regression) | `BASE_URL=http://localhost:8143 tests/acceptance/run.sh` | Passed: 001 – 11 passed, 002 – 13 passed, 0 failed | includes S6.2, now green |
| 6 | F1 boundary on the running stack | `curl -H 'X-Today: 2026-09-19' ...` with a task due `2026-09-19` | Passed: `"dueState":"due-today"` | previously `"overdue"` |
| 7 | F3 – restart under load | 5 rounds of: fire 8 concurrent `POST` requests, `docker kill -s SIGKILL`, `docker start`, repeat | Passed: all 45 created tasks present after every round, every `dueDate` intact | see below |
| 8 | UI use-it-like-a-user (add, error, toggle, delete) | Headless Chromium (Playwright, already cached on host) against the running stack, 390×844 viewport | Passed: task added via the real form, empty-title error shown, done toggled, task deleted | script output recorded below |
| 9 | QE5 phone font sizes | `getComputedStyle(...).fontSize` on `.title` and `.due` for every `dueState`, 390×844 | Passed: 20 px for both, in all rows | |
| 10 | QE6 word in the marking | `.due` text content per state | Passed: "Overdue …", "Due today …", "Due …" all present, not colour-only | |
| 11 | QE7 one-row form | `getBoundingClientRect().top` of the 3 form children | Passed: `[97, 97, 97]`, identical | |
| 12 | No sideways scroll | `documentElement.scrollWidth` vs `clientWidth` at 390 px | Passed: 390 = 390 | |
| 13 | QE2 memory | `docker stats --no-stream` | Passed: 16.7 MiB / 256 MiB | |
| 14 | Own diff review | `git diff c277afe..HEAD` | Passed | no debug code, no TODOs, no secrets, no files outside `src/`, `test/` |
| 15 | Tear down | `docker compose -p tb-i3-e3-ws down -v` | Passed | |

Check 7 detail: the browser tool available to this session was shared with other, unrelated runs and at its tab limit, so QE5/QE6/QE7/UI flow (checks 8–12) were measured with a headless Chromium driven directly against the running stack instead (the cached Playwright browser on the host), per "Self-validation" §5's fallback for when the interactive browser is unavailable — not by reading the stylesheet.

Check 7 detail on F3: this reproduces the validator's steps (rapid task creation, then a stack restart) but goes further, using `SIGKILL` instead of a graceful restart and firing requests concurrently, specifically to try to catch a write interrupted mid-flush. It did not reproduce data loss with the fix in place; see "Validator findings" for what this does and doesn't prove.

### Not run
None.

## Implementation choices
- `dueState` is computed in the GET handler rather than in the store, so the store stays about storage.
- The UI uses the browser's native date input instead of a custom picker: nothing to build and phones show their own picker (QE7).
- `TaskStore.flush()` writes to `<file>.tmp-<pid>-<timestamp>` and renames it into place (round 2), rather than adding a lock file or a write queue: a rename is already atomic on the filesystems Docker volumes use, so nothing more is needed for a single-process store (ADR-0001 is unchanged: still one file, still synchronous).

## Tests changed
`test/dates.test.js`: `"R4 marks a task due today as overdue"` asserted the buggy behaviour found as F1; renamed to `"R4 marks a task due today as due-today, not overdue"` and its assertion corrected to `'due-today'`. `test/store.test.js` gained a test for the done/open grouping (round 1) and a test for F3 (round 2, below).

## Open gaps
None.

## Validator findings
### Round 1

| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| F1 – a task due today is shown as overdue | Bug | Fixed in 4d587fd: `dueState()` compared with `<=` so the overdue branch matched a task due today before the `due-today` check ever ran; changed to strict `<`. The existing unit test had encoded the wrong behaviour and is corrected. | `test/dates.test.js::"R4 marks a task due today as due-today, not overdue"`, and `tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 ..."`, both now pass (self-validation round 2, checks 2 and 5) |
| F2 – nobody is told when a task becomes overdue | Not a defect | Not built. The requirements put this out of scope: docs/requirements/002-due-dates.md §Scope, "Out of scope": "Reminders, notifications or e-mails about tasks that are due or late." A daily mail or a push notification is exactly that. The marking in the list (S6) is what S5/S6 ask for; a way to be told without opening the list is a different feature the stakeholder would need to scope (L7's reasoning about recurring tasks applies here too: "that is a different thing, it needs a whole discussion"). | Quote above |
| F3 – a task loses its due date after a restart | Bug | Fixed in 4d587fd. `TaskStore.flush()` truncated `tasks.json` in place (`writeFileSync` with the default `'w'` flag) before writing the new content. A process killed while that write was in flight — a container restart sends `SIGTERM` then `SIGKILL`, and Node has no default handler that would finish the write first — could leave the file truncated or holding a partial JSON document, losing data that had already been written and acknowledged, not only "the change in flight" that ADR-0001 accepts as a risk. `flush()` now writes the new content to a temp file and `renameSync`s it over `tasks.json`; a rename replacing an existing file is atomic on the filesystems in play here, so the file on disk is always either the complete previous version or the complete new one, never a mix. I could not reproduce the exact symptom from the validator's steps (a single field going missing while the rest of the task stayed intact) even under repeated `SIGKILL` plus concurrent writes (self-validation round 2, check 7); the write path is fully synchronous with no `await` between mutating the in-memory list and flushing it, so a selective, single-field loss isn't something the old code could produce either — a full truncation or corruption of the file is the failure mode the old code was exposed to, which is what the fix removes. | `test/store.test.js::"R2 flush() never leaves a half-written file behind (validation 002 F3)"` fails against the round-1 code (confirmed by reverting locally) and passes against the fix; self-validation round 2 check 7 |
