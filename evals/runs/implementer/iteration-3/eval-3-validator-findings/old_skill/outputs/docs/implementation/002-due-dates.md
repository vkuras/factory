# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feature/002-due-dates, commits 9c1d2e3..HEAD (round 2: fix(002): F1 strict overdue boundary)
- Date: 2026-09-20
- Round: 2

## What was built
1. **Dates module**: `src/dates.js` with `today()` in Europe/Berlin, `validateDueDate()` (R5) and `dueState()` (R4). Unit tests in `test/dates.test.js` cover both sides of the boundary. Round 1 shipped this comparison non-strict (`dueDate <= reference`), which made a task due today count as overdue; round 2 fixes it to the strict comparison the design specifies (F1, see "Validator findings").
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
| S6.2 | src/dates.js dueState | test/dates.test.js::"R4 marks a task due today as due-today, not overdue"; tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 marks a task due today as due today and not as overdue" | Passed (round 2; failed in round 1, see F1) |
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
Round 2, re-run in full against a clean checkout after fixing F1 (compose project `tb-i3-e3-os`, port 8153).

| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/app.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 20 passed, 0 failed, 0 skipped (before: 0 skipped) | |
| 3 | Image builds | `docker compose -p tb-i3-e3-os build` (clean, `down -v` first) | Passed | |
| 4 | Stack starts | `docker compose -p tb-i3-e3-os up -d` | Passed: app healthy after 5 s | `docker compose ps` → healthy; `logs` show only the startup line, no errors |
| 5 | Acceptance tests (regression, both documents) | `tests/acceptance/run.sh` | Passed: 001 – 11 passed, 0 failed; 002 – 13 passed, 0 failed | includes "S6.2 marks a task due today as due today and not as overdue" now passing |
| 6 | S5.1/S5.2/S5.5 main flow | `curl -X POST` with a due date, without one, and with a past date | Passed | 201 each time, `dueDate` echoed correctly |
| 7 | S5.4 validation | `curl -X POST` with `"19.09.2026"` and `"2026-02-30"` | Passed | 400 both times, message mentions "date" |
| 8 | F1 fix, boundary | `curl -X POST -d '{"dueDate":"2026-09-19"}'` then `curl -H 'X-Today: 2026-09-19'` | Passed | `dueState` is `due-today`, not `overdue` |
| 9 | UI served | `curl` `/`, `/app.js`, `/style.css` | Passed: 200, correct content types; `index.html` has the `type="date"` input | The shared browser pane had no free tab slot in this environment (used by other runs); UI wasn't clicked through, only fetched. QE5/QE6/QE7 (layout, phone size, one-row form) were not re-verified visually this round — round 1's evidence stands, nothing in this round's diff touches the UI. |
| 10 | Out of scope | `curl -X POST` with `"repeat":"weekly"` | Passed: field ignored, not stored | response has no `repeat` |
| 11 | Data survives restart | `docker compose -p tb-i3-e3-os restart` | Passed: due dates and undated tasks intact, healthy again after 5 s | |
| 12 | F3 reproduction attempt | See "Validator findings" F3 | Not reproduced | |
| 13 | Memory | `docker stats --no-stream` | Passed: 16.4 MiB / 256 MiB | |
| 14 | Own diff review | `git diff da811ae..HEAD -- src test` | Passed: only `src/dates.js` (comparison operator + comment) and `test/dates.test.js` (one corrected assertion) changed; no debug code, no TODOs, no scope creep | |
| 15 | Teardown | `docker compose -p tb-i3-e3-os down -v` | Passed | |

### Not run
- QE5/QE6/QE7 visual re-check in a real browser: the shared Browser pane had reached its tab cap with other evaluation runs' tabs open, and closing another run's tab was avoided. Nothing in this round's diff touches the UI, so round 1's visual evidence (row 9 there) is unchanged, but it wasn't re-confirmed live this round.

## Implementation choices
- `dueState` is computed in the GET handler rather than in the store, so the store stays about storage.
- The UI uses the browser's native date input instead of a custom picker: nothing to build and phones show their own picker (QE7).

## Tests changed
- Round 2: `test/dates.test.js` – the test `"R4 marks a task due today as overdue"` asserted the wrong result (it encoded the F1 bug rather than R4). Renamed to `"R4 marks a task due today as due-today, not overdue"` and corrected the expected value to `'due-today'`, matching R4 and S6.2. This is a correction of a test that contradicted the requirement, not a weakening.
- Round 1: `test/store.test.js` gained a test that the done/open grouping survives the new due-date order.

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| F1 – A task due today is shown as overdue | Bug | Fixed. `dueState()` in `src/dates.js` used `dueDate <= reference` for "overdue", so an equal (today) date matched before the `due-today` branch was ever reached. Changed to the strict `dueDate < reference` the design specifies. The existing unit test `"R4 marks a task due today as overdue"` had in fact been written to match the buggy behaviour rather than R4; corrected it to `"R4 marks a task due today as due-today, not overdue"` asserting `'due-today'` (see "Tests changed"). | `test/dates.test.js` and `tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 marks a task due today as due today and not as overdue"` now pass; full suite re-run in self-validation round 2 |
| F2 – Nobody is told when a task becomes overdue | Not a defect | Not built. The requirements explicitly put this out of scope: "Reminders, notifications or e-mails about tasks that are due or late." (docs/requirements/002-due-dates.md, Scope → Out of scope). S6 asks for late tasks to "stand out" when the list is opened, which is what the marking in the list does; a push notification or daily mail is a different feature the stakeholder considered and did not ask for here. If the team wants it, it needs its own requirements round. | Quote above |
| F3 – A task loses its due date after a restart | Not reproducible | Tried to reproduce with several approaches against a fresh stack (compose project `tb-i3-e3-os`): (1) the exact steps in the finding — create 2–3 tasks with due dates in sequence, then `docker compose restart`, then `GET /api/tasks`, repeated several times; (2) the same but with the creates fired concurrently; (3) 20–30 concurrent creates with a `docker compose restart` issued while they were still in flight; (4) five rounds of ~150–300 concurrent creates each with the container killed with `docker kill` (SIGKILL, no graceful shutdown) partway through the burst, then restarted. In every attempt, every task that had received a 201 response came back with its `dueDate` intact after the restart; none came back `null`. `store.flush()` writes the whole in-memory task list with a single synchronous `writeFileSync` per request, and Node's single-threaded event loop means no two requests' handler bodies (and so no two flushes) can interleave, which is consistent with not finding a window where a due date is dropped. Since it could not be reproduced and the code path found no plausible mechanism for it, no fix was made. If it recurs, the next report needs the exact commands run and, ideally, the container logs and `docker inspect` of the exit reason from that session, since "seen once" without those is not enough to locate it. | Reproduction attempts and their results above; `src/store.js` `flush()`/`add()`/`update()` reviewed for the write path |
