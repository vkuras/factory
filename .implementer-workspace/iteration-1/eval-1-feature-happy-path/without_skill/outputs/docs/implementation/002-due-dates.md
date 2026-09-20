# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Date: 2026-09-20
- Round: 1

## What was built
1. **Date rules**: new `src/dates.js` with `today()` (Europe/Berlin, overridable per request via `X-Today`, ADR-0002), `validateDueDate()` (R5) and `dueState()` (R4). Unit tests in `test/dates.test.js`.
2. **API**: `src/app.js` — `GET /api/tasks` reads the `X-Today` header and decorates every task with `dueState`; `POST /api/tasks` and `PATCH /api/tasks/:id` accept an optional `dueDate`, validated with `validateDueDate()`.
3. **List order**: `src/store.js` `list()` now sorts within the open/done groups by due date (soonest first, no date last), falling back to newest-first exactly as before (S6.5).
4. **UI**: `public/index.html` gained a `type="date"` input in the add form (still one row, QE7). `public/app.js` renders the marking ("Overdue YYYY-MM-DD", "Due today YYYY-MM-DD", or the plain day) plus a per-row date input so an existing task can get or change a day (S5.3). `public/style.css` raises the title and marking to 20 px on the row (QE5) and gives the overdue/due-today marking a word plus colour (QE6).

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (change `PORT` in `.env`). Existing tasks from 001 have no `dueDate` key and are read as having none (R6).

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1 | src/app.js POST /api/tasks | tests/acceptance/002-due-dates/tasks.test.js::"S5.1 creates a task with a due date and shows it in the list" | Passed |
| S5.2 | src/app.js POST /api/tasks, src/dates.js validateDueDate | ...::"S5.2 creates a task without a due date exactly as before this feature" | Passed |
| S5.3 | src/app.js PATCH /api/tasks/:id, public/app.js per-row date input | ...::"S5.3 sets a due date on a task that had none" | Passed |
| S5.4 | src/dates.js validateDueDate | ...::"S5.4 rejects a due date that is not a real date, on create", "...on update, and the task is unchanged" | Passed |
| S5.5 | src/dates.js validateDueDate | ...::"S5.5 accepts a due date that already passed" | Passed |
| S6.1 | src/dates.js dueState | ...::"S6.1 marks a task whose day is before today as overdue" | Passed |
| S6.2 | src/dates.js dueState | ...::"S6.2 marks a task whose day is today as due-today, not overdue" | Passed |
| S6.3 | src/dates.js dueState | ...::"S6.3 shows a future day without an overdue or due-today marking" | Passed |
| S6.4 | src/app.js GET decoration | ...::"S6.4 shows no day and no marking for a task without one" | Passed |
| S6.5 | src/store.js list() | ...::"S6.5 orders open tasks by day, soonest first, no-day tasks last"; test/store.test.js (2 tests) | Passed |
| R4 | src/dates.js dueState | test/dates.test.js (4 tests) | Passed |
| R5 | src/dates.js validateDueDate | test/dates.test.js (6 tests) | Passed |
| R6 | optional `dueDate`, missing key reads as null | ...::"R6 an existing 001-style task (no dueDate field sent) stays valid"; test/store.test.js::"R6 a task added without a due date reads back as null" | Passed |
| QE5 | public/style.css (20 px title and marking) | Self-validation 7 | Passed |
| QE6 | public/app.js dueLabel() word + public/style.css colour | Self-validation 7 | Passed |
| QE7 | public/index.html, public/style.css (form stays one row) | Self-validation 7 | Passed |
| Out of scope: recurring tasks | Not built | – | – |
| Out of scope: reminders/notifications | Not built | – | – |
| Out of scope: time of day | `dueDate` is a day string, no time component | – | Passed by construction |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/dates.js src/app.js src/store.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 25 passed, 0 failed | |
| 3 | Image builds | `PORT=8111 docker compose -p tb-i1-e1-ns up -d --build` | Passed | |
| 4 | Stack starts and is healthy | `curl http://localhost:8111/health` | Passed: `{"status":"ok"}` | |
| 5 | Acceptance tests (regression + new) | `BASE_URL=http://localhost:8111 tests/acceptance/run.sh` | Passed: 001 11/11, 002 13/13 | |
| 6 | R4 boundary via X-Today | `curl -H "X-Today: 2026-09-19" .../api/tasks` on a task due 2026-09-19 | Passed: `dueState: "due-today"`, not "overdue" | |
| 7 | UI check | Browser at 390x844 (phone) | Passed: add form stays one row with the date input (QE7); title and marking render at 20 px; an overdue row shows "Overdue 2020-01-01" in bold red (QE5/QE6); setting a date on a bare task via its row input updates the marking live (S5.3) | |
| 8 | QE2 memory (still within the 001 budget) | `docker stats --no-stream` | Passed: ~25 MiB / 256 MiB | |

### Not run
None.

## Implementation choices
- `dueState` is derived on every `GET`, never stored, matching the design decision that it must reflect the current day without any write happening at midnight.
- The per-row date input (to satisfy S5.3, changing/setting a day on an existing task) is an addition beyond the exact wording of the design's "User interface" section, which specified the marking text but left the edit affordance open; a native date input keeps it a one-control change with no new dependency.
- `X-Today` is ignored (falls back to the real day) when malformed, so a bad header cannot crash a request; it can only relabel, never write, per ADR-0002.

## Tests changed
- `tests/acceptance/helpers.js`: `api()` now accepts optional extra headers, and a new `listOn(today)` helper sends `X-Today` so 002's boundary tests are independent of the day the suite runs.

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings in round 1 | |
