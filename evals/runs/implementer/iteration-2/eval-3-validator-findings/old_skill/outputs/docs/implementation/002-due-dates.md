# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feature/002-due-dates, commits 9c1d2e3..7b8a9f0 (round 1), da811ae..HEAD (round 2)
- Date: 2026-09-20
- Round: 2

## What was built
1. **Dates module**: `src/dates.js` with `today()` in Europe/Berlin, `validateDueDate()` (R5) and `dueState()` (R4). The comparison in `dueState()` is strict, so a task whose day is today is `due-today` and not `overdue`. Unit tests in `test/dates.test.js` cover both sides of that boundary.
2. **API**: `POST` and `PATCH /api/tasks` take an optional `dueDate`; `GET /api/tasks` adds `dueState` to every task and honours the `X-Today` header of ADR-0002.
3. **List order**: `store.list()` keeps the open/done grouping of 001 S3.2 and orders by due date inside each group, undated tasks last (S6.5).
4. **UI**: a native date input in the add form and a marking per row ("Overdue 2026-09-18", "Due today 2026-09-19", or the plain day), red and bold when overdue. Title and marking are 20 px on a phone viewport (QE5).

### Round 2 – validator findings
5. **F1 fix**: `dueState()` compared with `<=` before checking equality, so a task due today fell into the `overdue` branch before the `due-today` branch was ever reached. Changed to a strict `<` (see `src/dates.js`). The existing unit test that asserted the wrong behaviour ("R4 marks a task due today as overdue") was itself wrong per R4/S6.2 and is fixed to expect `due-today`; the acceptance test `S6.2` (already written by the validator) now passes.
6. **F3 hardening**: `TaskStore.flush()` now writes to `tasks.json.tmp` and `renameSync`s it into place, instead of writing `tasks.json` directly. A rename on the same filesystem is atomic, so a write that is cut off (a hard kill, a full disk) can no longer leave `tasks.json` half written or a field reverted. See "Validator findings" below for why this is a hardening, not a confirmed fix: the reported symptom could not be reproduced.

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
| S6.2 | src/dates.js dueState | test/dates.test.js::"R4 marks a task due today as due-today, not overdue"; tests/acceptance/002-due-dates::"S6.2 marks a task due today as due today and not as overdue" | Passed |
| S6.3 | src/dates.js dueState | test/dates.test.js::"R4 marks a task due tomorrow as upcoming" | Passed |
| S6.4 | src/dates.js dueState, public/style.css .due.none | test/dates.test.js::"R4 marks a task without a due date as none" | Passed |
| S6.5 | src/store.js list() | test/store.test.js (3 tests, including the done/open grouping) | Passed |
| R4 | src/dates.js | test/dates.test.js | Passed |
| R5 | src/dates.js | test/dates.test.js | Passed |
| R6 | optional field, a missing key reads as null | test/store.test.js::"S6 puts tasks without a due date last" | Passed |
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

### Round 2 (re-run in full, per finding fixes)
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 13 | Syntax | `node --check src/*.js public/app.js` | Passed | |
| 14 | Unit tests | `npm test` | Passed: 20 passed, 0 failed, 0 skipped (before: 0 skipped) | |
| 15 | Image builds | `PORT=8133 docker compose -p tb-i2-e3-os build` | Passed | |
| 16 | Stack starts | `PORT=8133 docker compose -p tb-i2-e3-os up -d` | Passed: app healthy after 1 s | |
| 17 | Acceptance regression, 001 + 002 | `BASE_URL=http://localhost:8133 tests/acceptance/run.sh` | Passed: 24 passed (11 + 13), 0 failed | |
| 18 | F1 repro from the finding | `curl -X POST -d '{"title":"Due today","dueDate":"2026-09-19"}'` then `curl -H 'X-Today: 2026-09-19' .../api/tasks` | Passed | `dueState` is now `due-today`, was `overdue` |
| 19 | F3 stress: rapid concurrent creates + `docker compose restart` | 20 rounds x 5 concurrent `POST` with a due date, `restart` after every round, `dueDate` compared before/after | Passed: 100/100 tasks kept their exact `dueDate` across 20 restarts | |
| 20 | F3 stress: rapid concurrent creates + `docker kill` (hardest case, no grace period) | 8 rounds x 8 concurrent `POST`, `docker kill` fired while requests were in flight, `up -d` after each | Passed: every task that got a `201` before the kill (8 of 64 attempted; the rest were refused mid-flight, none half-written) kept its `dueDate` intact, and `tasks.json` stayed valid JSON throughout | |
| 21 | R2 restart (regression) | `docker compose -p tb-i2-e3-os restart` | Passed: task count and fields unchanged | |
| 22 | QE2 memory | `docker stats --no-stream` | Passed: 18.7 MiB / 256 MiB | |
| 23 | Own diff review | `git diff c277afe..HEAD` | Passed: 3 files changed (src/dates.js, src/store.js, test/dates.test.js), no debug code, no TODOs, no secrets, no scope creep | |
| 24 | Teardown | `docker compose -p tb-i2-e3-os down -v` | Passed | |

### Not run
None.

## Implementation choices
- `dueState` is computed in the GET handler rather than in the store, so the store stays about storage.
- The UI uses the browser's native date input instead of a custom picker: nothing to build and phones show their own picker (QE7).

## Tests changed
Round 1: none. `test/store.test.js` gained a test that the done/open grouping survives the new due-date order.

Round 2: `test/dates.test.js::"R4 marks a task due today as overdue"` was wrong — it asserted the exact behaviour F1 reports as a bug, contradicting R4/S6.2 ("a task whose day is today is due today and is not overdue"). Fixed to `test/dates.test.js::"R4 marks a task due today as due-today, not overdue"`, now asserting `due-today`.

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| F1 | Bug | Fixed in `src/dates.js` `dueState()`: the `overdue` check used `<=` and ran before the `due-today` check, so today's tasks never reached it. Changed to strict `<`. The unit test that had asserted the buggy behaviour was itself wrong and is fixed alongside it. | `test/dates.test.js::"R4 marks a task due today as due-today, not overdue"` and `tests/acceptance/002-due-dates::"S6.2 marks a task due today as due today and not as overdue"` both pass; manual repro from the finding now returns `due-today` |
| F2 | Not a defect | Not built: requirements 002 §Scope, Out of scope: "Reminders, notifications or e-mails about tasks that are due or late." The finding asks for exactly what the requirements exclude. If the team decides this is now needed, it is a new requirement for the groomer, not a gap in 002. | Quote above, `docs/requirements/002-due-dates.md` §Scope |
| F3 | Not reproducible, hardened defensively | Tried to reproduce with the finding's steps (create tasks with due dates in quick succession, `docker compose restart`, check `dueDate`) repeated 20 times (100 tasks) — 0 mismatches. Went further with the harshest case, `docker kill` while `POST` requests were still in flight, repeated 8 times (64 attempted creates) — every task that completed kept its `dueDate`, `tasks.json` never came back invalid. Code review found that `TaskStore.flush()` wrote `tasks.json` directly (no atomic rename), which is a real (if unproven here) risk for a write cut off mid-syscall, so it was hardened to write-to-temp-then-rename regardless. This is not reported as "fixed" because the reported symptom was never reproduced; it is a defensive improvement found while investigating. | `src/store.js` `flush()`; stress-test commands and results in Self-validation rows 19–20 |
