# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feature/002-due-dates, commits 9c1d2e3..7b8a9f0 (round 1), plus the round-2 fix commit
- Date: 2026-09-20
- Round: 2

## What was built
1. **Dates module**: `src/dates.js` with `today()` in Europe/Berlin, `validateDueDate()` (R5) and `dueState()` (R4). The comparison in `dueState()` is strict, so a task whose day is today is `due-today` and not `overdue` (fixed in round 2, see F1 below). Unit tests in `test/dates.test.js` cover both sides of that boundary.
2. **API**: `POST` and `PATCH /api/tasks` take an optional `dueDate`; `GET /api/tasks` adds `dueState` to every task and honours the `X-Today` header of ADR-0002.
3. **List order**: `store.list()` keeps the open/done grouping of 001 S3.2 and orders by due date inside each group, undated tasks last (S6.5).
4. **UI**: a native date input in the add form and a marking per row ("Overdue 2026-09-18", "Due today 2026-09-19", or the plain day), red and bold when overdue. Title and marking are 20 px on a phone viewport (QE5).

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
| S6.2 | src/dates.js dueState | test/dates.test.js::"R4 marks a task due today as due today, not overdue"; tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 marks a task due today as due today and not as overdue" | Passed (fixed round 2, see F1) |
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

### Not run
None.

## Self-validation, round 2 (validator findings fix)
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/app.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 20 passed, 0 failed, 0 skipped (before: 0 skipped) | |
| 3 | Image builds | `PORT=8123 docker compose -p tb-i2-e3-ws build` | Passed | |
| 4 | Stack starts (fresh `down -v`/`up -d`) | `PORT=8123 docker compose -p tb-i2-e3-ws up -d` | Passed: app healthy after 6 s, no errors in logs | |
| 5 | Acceptance tests, full regression | `BASE_URL=http://localhost:8123 tests/acceptance/run.sh` | Passed: 001 – 11 passed, 002 – 13 passed, 0 failed | |
| 6 | F1 regression, main flow | `curl -X POST -d '{"title":"Due today","dueDate":"2026-09-19"}'` then `curl -H 'X-Today: 2026-09-19' .../api/tasks` | Passed | `dueState` now `due-today`, was `overdue` |
| 7 | S5.1/S5.2/S5.5 main flow | `curl -X POST` with a future day, no day, a past day | Passed | 201 each time |
| 8 | S5.4 failure paths | `curl -X POST` with `01.10.2026` and `2026-02-30` | Passed | 400 both times |
| 9 | 404 failure path | `curl -X PATCH /api/tasks/999` | Passed | 404 |
| 10 | UI files served | `curl / /app.js /style.css` | Passed | 200 each; QE5/QE6/QE7 unchanged from round 1 (no UI code touched this round), re-checked via the passing QE6 acceptance test |
| 11 | F3 repro attempt: data survives restart | `docker compose restart` after creating tasks with due dates, plus 5 rounds of concurrent POSTs immediately followed by `restart` | No data loss reproduced in any run: every task kept its title, done state and `dueDate` (see F3 below) | |
| 12 | QE2 memory | `docker stats --no-stream` | Passed: 18.6 MiB / 256 MiB | |
| 13 | Own diff review | `git diff -- src/dates.js test/dates.test.js` | Passed: only the boundary fix and its test, no debug code, no scope creep | |
| 14 | Teardown | `PORT=8123 docker compose -p tb-i2-e3-ws down -v` | Passed | |

### Not run
None.

## Implementation choices
- `dueState` is computed in the GET handler rather than in the store, so the store stays about storage.
- The UI uses the browser's native date input instead of a custom picker: nothing to build and phones show their own picker (QE7).

## Tests changed
- Round 2: `test/dates.test.js` – the test "R4 marks a task due today as overdue" asserted the buggy behaviour (it contradicted R4/S6.2). Renamed to "R4 marks a task due today as due today, not overdue" and its assertion changed from `'overdue'` to `'due-today'`. `tests/acceptance/002-due-dates/due-dates.test.js` was not touched (it already asserted the correct behaviour and belongs to the validator).

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| F1 | Bug | Fixed in the round-2 commit: `dueState()` in `src/dates.js` used `dueDate <= reference` for `overdue`, so a task due today was classified `overdue` before the `due-today` branch could ever run. Changed to `dueDate < reference` for `overdue`, `===` for `due-today`. The unit test that encoded the same bug ("R4 marks a task due today as overdue") was wrong per R4/S6.2 and is now fixed to assert `due-today`. | test/dates.test.js::"R4 marks a task due today as due today, not overdue" and tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 marks a task due today as due today and not as overdue" both pass; full regression (24 acceptance tests, 20 unit tests) green |
| F2 | Not a defect | Notifications/e-mails about due or late tasks are explicitly out of scope for 002: "Reminders, notifications or e-mails about tasks that are due or late." (docs/requirements/002-due-dates.md, Scope → Out of scope). The requirement S6 itself only asks that late tasks "stand out" in the list, which S6.1–S6.5 and QE5/QE6 already cover and were not challenged by this finding. Not built. | Quote above; requirements Scope section |
| F3 | Not reproducible | Tried: (a) the exact repro steps (create 2-3 tasks with due dates, `docker compose restart`, re-fetch) against a fresh stack; (b) five rounds of 5 concurrent `POST`s immediately followed by `restart` with no settle time, to stress any write/restart race; (c) read through `store.js`/`app.js`: every mutation (`add`/`update`) calls `flush()` (`writeFileSync` of the whole array) synchronously in the same tick as the mutation, with no `await` in between, so there is no in-process window where a task exists in memory without being written, and no interleaving between two requests' synchronous portions (Node is single-threaded). A truncated/partial `writeFileSync` would corrupt the whole JSON array (a parse error on the next read), not selectively null out one field while leaving title/done intact, which doesn't match the symptom described. In every attempt, all tasks kept their exact `title`, `done` and `dueDate` across the restart. Could not reproduce the finding; happy to re-open if the validator can supply a reliable repro (e.g. exact timing, concurrent client count, or `docker compose down`+`up` vs `restart`). | Self-validation round 2, check 11 |
