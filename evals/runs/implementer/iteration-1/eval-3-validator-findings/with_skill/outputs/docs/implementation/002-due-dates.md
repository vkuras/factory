# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feature/002-due-dates, commits 9c1d2e3..b3c2606
- Date: 2026-09-20
- Round: 2

## What was built
1. **Dates module**: `src/dates.js` with `today()` in Europe/Berlin, `validateDueDate()` (R5) and `dueState()` (R4). The comparison in `dueState()` is now strict (round 2 fix for F1, see below), so a task whose day is today is `due-today` and not `overdue`. Unit tests in `test/dates.test.js` cover both sides of that boundary.
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
| S6.2 | src/dates.js dueState | test/dates.test.js::"R4 marks a task due today as due today, not overdue"; tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 marks a task due today as due today and not as overdue" | Passed |
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
Round 2, run against a fresh `docker compose -p tb-i1-e3-ws-check` style stack (project `tb-i1-e3-ws`, port 8103) after fixing F1 and investigating F2/F3.

| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/app.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 20 passed, 0 failed, 0 skipped (before: 0 skipped) | |
| 3 | Image builds (clean) | `docker compose -p tb-i1-e3-ws down -v && PORT=8103 docker compose -p tb-i1-e3-ws up -d --build` | Passed | |
| 4 | Stack starts | as above, then poll `/health` | Passed: healthy after 6 s | `docker inspect` State.Health = "healthy" |
| 5a | Acceptance tests, full regression | `BASE_URL=http://localhost:8103 tests/acceptance/run.sh` (both 001 and 002) | Passed: 001 – 11 passed, 0 failed; 002 – 13 passed, 0 failed | includes S6.2, which failed before the fix |
| 5b | F1 exact repro from the finding | `curl -X POST ... '{"title":"Due today","dueDate":"2026-09-19"}'` then `curl -H 'X-Today: 2026-09-19' /api/tasks` | Passed | `"dueState":"due-today"` (was `"overdue"`) |
| 6 | S5.1 main flow | `curl -X POST -d '{"title":"Pay the invoice","dueDate":"2026-09-18"}'` | Passed | 201, day visible in GET |
| 7 | S5.3 set a day later | `curl -X PATCH -d '{"dueDate":"2026-09-30"}'` | Passed | 200 |
| 8 | S5.5 past day | `curl -X POST -d '{"title":"late one","dueDate":"2026-01-02"}'` | Passed | 201 |
| 9 | QE5/QE6/QE7 phone, real browser | Browser tool at 375x812, added a task through the UI with a due date of the real today (2026-09-20) | Passed: title and marking both `20px` (computed style); "Ship the release" showed grey "Due today 2026-09-20", the older task due 2026-09-19 showed red bold "Overdue 2026-09-19"; one row of inputs and one button | screenshot + computed styles |
| 10 | Out of scope | `POST` with `"repeat":"weekly"` | Passed: the field is ignored and not stored | response has no `repeat` |
| 11 | R2 restart, once | `docker compose -p tb-i1-e3-ws restart` | Passed: due dates survived | |
| 11b | F3 repro attempt 1: 10 concurrent POSTs with due dates, then restart | 10 parallel `curl` + `docker compose restart` | Passed: all 10 tasks kept their due date | |
| 11c | F3 repro attempt 2: 5 rounds of 5 concurrent POSTs each, `docker compose restart app` issued immediately without waiting for the creates to finish | shell loop, see report body | Passed: all 35 tasks created across the 5 rounds kept the due date they were sent with; none came back `null` | |
| 11d | F3 repro attempt 3: 5 rounds of 5 concurrent POSTs, `docker kill` (SIGKILL, harsher than a graceful restart) racing the creates, then `docker start` | shell loop | 18 of 25 tasks in this round were created (7 requests never got a response because the process was killed mid-request, which is expected for a plain SIGKILL); of the 18 that were created, all 18 kept the exact due date they were sent, none came back `null` | |
| 12 | QE2 memory | `docker stats --no-stream` | Passed: 18.5 MiB / 256 MiB | |
| 13 | Own diff review | `git diff c277afe..HEAD -- src test tests public` | Passed: 2 files changed (src/dates.js, test/dates.test.js), no debug code, no TODOs, no scope creep | |

### Not run
None.

## Implementation choices
- `dueState` is computed in the GET handler rather than in the store, so the store stays about storage.
- The UI uses the browser's native date input instead of a custom picker: nothing to build and phones show their own picker (QE7).

## Tests changed
Round 2: `test/dates.test.js` had a wrong test, `'R4 marks a task due today as overdue'`, asserting the pre-fix (buggy) behaviour, i.e. it contradicted R4 and the design. Renamed to `'R4 marks a task due today as due today, not overdue'` and fixed its expectation to `'due-today'`. This is the same test that reproduces F1: it failed against the old `src/dates.js` and passes against the fix.

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| F1 | Bug | Fixed in commit b3c2606. `dueState()` compared `dueDate <= reference` before checking equality, so the `due-today` branch was unreachable and a task due today fell into `overdue`. Changed to a strict `<` for overdue. The unit test that had asserted the buggy behaviour was corrected in the same commit. | `test/dates.test.js::"R4 marks a task due today as due today, not overdue"` now passes; `tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 marks a task due today as due today and not as overdue"` now passes; exact repro from the finding re-run manually returns `"dueState":"due-today"`; verified again through the real UI in a browser (see Self-validation 9) |
| F2 | Not a defect | Not built. Requirements 002, "Out of scope": "Reminders, notifications or e-mails about tasks that are due or late." A daily mail or a notification is exactly what is excluded there; S6 ("I want late tasks to stand out, so that I see in one look what the team has to catch up on") is satisfied by the in-list marking that F2 itself confirms exists ("the marking exists ... in the list"). If the team needs to be told about lateness while the list is closed, that is a new requirement and belongs with the groomer, not a fix to 002 as designed. | Quote above; docs/requirements/002-due-dates.md, "Scope" § "Out of scope" |
| F3 | Not reproducible | Investigated `src/store.js`: every mutation (`add`/`update`/`remove`) calls `flush()` synchronously and inline, with `writeFileSync` on the full in-memory array; there is no debounce and no `await` between validating a due date and writing it, so there is no window in the request handler where a concurrent request could interleave and overwrite a due date with a stale copy. Tried three genuinely different repros against the real Docker stack (project `tb-i1-e3-ws`, see Self-validation 11b–11d): (1) 10 concurrent creates with due dates followed by a graceful `docker compose restart`; (2) 5 rounds of 5 concurrent creates with a restart fired immediately, not waiting for the creates to finish, to race the restart against in-flight writes; (3) the same, but with `docker kill` (SIGKILL) instead of a graceful restart, which is a harsher interruption than what the finding describes. In all three, every task that received a `201` kept the exact due date it was sent; under SIGKILL, some in-flight requests never completed at all (no `201`, so no task and no lost field), which is expected for a killed process, not a defect. No task was observed with an intact title/done state and a `dueDate` that had reverted to `null`. Could not reproduce the finding; if it recurs, the exact request timing and container logs around the moment would help narrow it down further. | Self-validation 11b, 11c, 11d |
