# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feature/002-due-dates, commits 9c1d2e3..7b8a9f0
- Date: 2026-09-20
- Round: 2

## What was built
1. **Dates module**: `src/dates.js` with `today()` in Europe/Berlin, `validateDueDate()` (R5) and `dueState()` (R4). The comparison in `dueState()` is strict, so a task whose day is today is `due-today` and not `overdue` (round 1 shipped this the wrong way round; see F1 below). Unit tests in `test/dates.test.js` cover both sides of that boundary.
2. **API**: `POST` and `PATCH /api/tasks` take an optional `dueDate`; `GET /api/tasks` adds `dueState` to every task and honours the `X-Today` header of ADR-0002.
3. **List order**: `store.list()` keeps the open/done grouping of 001 S3.2 and orders by due date inside each group, undated tasks last (S6.5).
4. **UI**: a native date input in the add form and a marking per row ("Overdue 2026-09-18", "Due today 2026-09-19", or the plain day), red and bold when overdue. Title and marking are 20 px on a phone viewport (QE5).
5. **Durable writes** (round 2, F3): `store.flush()` now writes atomically (temp file, fsync, rename, fsync directory) instead of a single `writeFileSync`, so a field written right before a restart cannot come back empty.

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
| S6.2 | src/dates.js dueState | test/dates.test.js::"R4 marks a task due today as due today, not overdue" | Passed |
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
| 13 (round 2) | Unit tests after F1/F3 fixes | `npm test` | Passed: 21 passed, 0 failed, 0 skipped | |
| 14 (round 2) | Full acceptance suite (001 + 002) | `tests/acceptance/run.sh` | Passed: 11 + 13 = 24 passed, 0 failed | includes F1's regression test S6.2 |
| 15 (round 2) | F1 boundary | `curl -H 'X-Today: 2026-09-19'` on a task due 2026-09-19 | Passed | `"dueState":"due-today"` |
| 16 (round 2) | F3 restart under concurrency | 3 tasks with due dates created concurrently, then `docker compose restart` | Passed: all 3 due dates intact | |
| 17 (round 2) | QE2 memory (unchanged) | `docker stats --no-stream` | Passed: 19 MiB / 256 MiB | |

### Not run
None.

## Implementation choices
- `dueState` is computed in the GET handler rather than in the store, so the store stays about storage.
- The UI uses the browser's native date input instead of a custom picker: nothing to build and phones show their own picker (QE7).

## Tests changed
None. `test/store.test.js` gained a test that the done/open grouping survives the new due-date order.

## Open gaps
- F2 (round 1) was not built: it asks for a proactive notification about overdue tasks, which requirements 002 explicitly places out of scope, consistent with 001's validated "no mail or push code, no outbound calls". This needs a requirements decision, not an implementation guess, before any notification mechanism is designed or built.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| F1 – a task due today is shown as overdue | implementation | Fixed. `dueState()` compared with `dueDate <= reference` first, so the equal (today) case fell into `overdue` and the later `dueDate === reference` check was unreachable dead code. Reordered to check equality first. The regression unit test `test/dates.test.js::"R4 marks a task due today as overdue"` had encoded the same bug and was corrected to assert `due-today`. | `npm test` (21 passed); acceptance test "S6.2 marks a task due today as due today and not as overdue" now passes |
| F2 – nobody is told when a task becomes overdue | requirements conflict | Not implemented. Requirements 002, section "Scope > Out of scope", explicitly excludes "Reminders, notifications or e-mails about tasks that are due or late", and 001's validation confirmed "no mail or push code, no outbound calls" as in-scope-conformant. Building a proactive notification channel (mail, push, or a background job) would reverse a decision the stakeholder already made deliberately, and would add a third-party dependency (e.g. SMTP) the project's conventions rule out ("no third-party runtime dependencies"). S6 as written (S6.1–S6.5) is fully met by the in-list marking, which is what was built and is covered by acceptance tests. Recommendation: send this back to requirements grooming so the stakeholder can decide, with L1 in hand, whether the scope decision should change — the implementer should not make that product call unilaterally. | docs/requirements/002-due-dates.md "Out of scope"; docs/validation/001-task-list.md "Out of scope: notifications" |
| F3 – a task loses its due date after a restart | implementation | Fixed defensively. `TaskStore.flush()` used a single `writeFileSync` straight to `tasks.json`, which neither guarantees the write reaches disk (no fsync) nor protects against a restart landing mid-write. Rewrote `flush()` to write to a temp file, `fsync` its contents, `renameSync` it over the real file (atomic on the same filesystem), and `fsync` the containing directory so the rename itself is durable. This removes the window the validator's symptom points at ("the write of the day had not reached the file before the restart"). Added `test/store.test.js::"F3 keeps a due date across a reload and leaves no leftover temp file"`. Manually verified: 3 tasks with due dates created concurrently, `docker compose restart`, all 3 due dates intact afterwards. | `npm test` (21 passed); manual restart check on the running stack |
