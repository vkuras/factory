# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feat/002-due-dates, commits 769ef51..eb42194
- Date: 2026-09-20
- Round: 1

## What was built
1. **`src/dates.js`** (new): `today()` (Europe/Berlin, ADR-0002), `validateDueDate()` (R5, format + calendar round-trip), `dueState()` (R4 boundary). Unit tests in `test/dates.test.js`.
2. **API**: `src/app.js` — `POST`/`PATCH /api/tasks(/:id)` accept an optional `dueDate`, validated with `validateDueDate()`; `GET /api/tasks` decorates every task with `dueState`, using the optional `X-Today` header or the server's real today (ADR-0002). `src/store.js` defaults a new task's `dueDate` to `null` (R6).
3. **List order (S6.5)**: `src/store.js` `list()` now orders open/done groups (unchanged, 001 S3.2) by due date ascending inside each group, tasks without a date last, newest first as the tie-break. Unit tests added to `test/store.test.js`.
4. **UI**: `public/index.html` gained a native `<input type="date">` between the title and the button (QE7). `public/app.js` sends `dueDate` on submit and renders the marking ("Overdue YYYY-MM-DD" bold red, "Due today YYYY-MM-DD", or the plain day; nothing for `none`) next to the title. `public/style.css` raises title/marking to 20px (QE5) and carries the meaning in the word, colour only reinforcing it (QE6).

All four build-order slices are done; nothing from the design was left out.

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (change `PORT` in `.env`). No seed data, no test users. `GET /api/tasks` accepts an optional `X-Today: YYYY-MM-DD` header to pin "today" for testing (ADR-0002); it never changes stored data.

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1 | `POST /api/tasks` with `dueDate` | tests/acceptance/002-due-dates/tasks.test.js::"S5.1 creates a task with a day and shows it in the list" | Passed |
| S5.2 | `POST /api/tasks` without `dueDate` | ...::"S5.2 creates a task without a day exactly as before this feature" | Passed |
| S5.3 | `PATCH /api/tasks/:id` with `dueDate` | ...::"S5.3 sets a day on a task that had none" | Passed |
| S5.4 | `src/dates.js` `validateDueDate()` | ...::"S5.4 rejects a day that is not a real date on create", "...on update and leaves the task unchanged", test/dates.test.js (R5 tests) | Passed |
| S5.5 | `validateDueDate()` allows past dates | ...::"S5.5 allows a day that already passed" | Passed |
| S6.1 | `src/dates.js` `dueState()` | ...::"S6.1 marks a task whose day is before today as overdue" | Passed |
| S6.2 | `dueState()` | ...::"S6.2 marks a task whose day is today as due-today, not overdue" | Passed |
| S6.3 | `dueState()` | ...::"S6.3 marks a task whose day is after today with neither overdue nor due-today" | Passed |
| S6.4 | `GET /api/tasks` decoration | ...::"S6.4 a task without a day shows no marking" | Passed |
| S6.5 | `src/store.js` `list()` order | ...::"S6.5 orders open tasks by day, soonest first, no day last", test/store.test.js (3 S6.5 tests) | Passed |
| R4 | `dueState()` | test/dates.test.js (4 R4 tests), acceptance "R4 boundary example from the requirements holds" | Passed |
| R5 | `validateDueDate()` | test/dates.test.js (7 R5 tests) | Passed |
| R6 | optional field, `store.add()` defaults to `null` | test/store.test.js::"R6 a task added without a due date has dueDate null" | Passed |
| QE5 | `public/style.css` title/marking 20px | Self-validation 5 (phone viewport) | Passed: 20px, see evidence below |
| QE6 | word + colour in `public/app.js`/`style.css` | Self-validation 5 (phone/desktop screenshots) | Passed: "Overdue"/"Due today" always present |
| QE7 | one date input, same row | Self-validation 5 (phone viewport, form height) | Passed: single 44px-tall row |
| Out of scope: recurring tasks | Not built | – | – |
| Out of scope: reminders | Not built | – | – |
| Out of scope: times of day | Not built (day only) | – | – |

## Self-validation
Run against `docker compose -p tb-i2-e1-os`, published on port 8131 as assigned for this run.

| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/*.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 26 passed, 0 failed, 0 skipped (before this feature: 22 skipped 0) | |
| 3 | Image builds | `docker compose -p tb-i2-e1-os build` | Passed | |
| 4 | Stack starts | `docker compose -p tb-i2-e1-os up -d` | Passed: healthy within 1 s | `docker compose ps` → "Up ... (healthy)" |
| 5 | Acceptance tests (regression + new) | `BASE_URL=http://localhost:8131 tests/acceptance/run.sh` | Passed: 24 passed (11 from 001, 13 from 002), 0 failed | |
| 6 | Use it like a user – API | `curl` POST/PATCH/GET incl. `X-Today`, invalid date, unknown id | Passed | 201/200/400 "The date must be in the form YYYY-MM-DD.", 404 "This task does not exist.", `dueState` correct for overdue/due-today/upcoming/none |
| 7 | Use it like a user – UI | Browser at 375×812 and desktop width | Passed, with one fix (see below): added a task with title+date through the real form, toggled done, saw "Overdue 2020-05-05" in bold red, "Due today 2026-09-20" plain, ordering soonest-first with no-date tasks last |
| 8 | Data survives | `docker compose -p tb-i2-e1-os restart` | Passed: all 6 tasks, their `done` state and `dueDate` intact after restart | |
| 9 | Memory (QE2, unchanged constraint) | `docker stats --no-stream` | Passed: 17.67 MiB / 256 MiB | |
| 10 | Own diff review | `git diff d276ada..HEAD` | Passed: no debug code, no TODOs, no secrets, no files outside the design's scope | |
| 11 | Teardown | `docker compose -p tb-i2-e1-os down -v` | Passed | |

During check 7, the first render at 375px width showed the due-date marking pushing the task title into an unreadably narrow column (character-by-character wrapping), which would have failed QE5. Fixed by giving the title and the marking their own wrapping container with a floor width for the title (`fix(002)`, commit eb42194); rebuilt and re-checked at both widths, screenshots confirm a readable single-line title with the marking wrapping to its own line when needed.

### Not run
- Cross-time-zone or load testing: not named in this design's drivers/test strategy, so nothing new to run beyond 001's QE2/QE4, which are unaffected by this feature and were re-checked (memory, above).

## Implementation choices
- `dueState` comparison uses plain string comparison on `YYYY-MM-DD`, which sorts identically to chronological order; avoids a `Date` round-trip in the hot path and keeps `dueState()`/`list()` trivial to test.
- `X-Today` falls back silently to the real `today()` when absent or malformed, since ADR-0002 scopes it to tests only; it is never surfaced as a user-facing error.
- The overdue marking is greyed out (not bold red) once a task is done, consistent with 001's existing "done tasks are muted" treatment; the design does not specify this, but it follows the existing convention rather than contradicting the red/bold rule for open tasks.
- Acceptance tests for 002 pin "today" via `X-Today` per the design's test strategy, in their own `tests/acceptance/002-due-dates/` folder; `tests/acceptance/helpers.js` gained an optional fourth `headers` argument to `api()` to support that, without changing its existing signature or behaviour for 001's tests.

## Tests changed
None removed or weakened. `tests/acceptance/helpers.js` gained an additive, backward-compatible parameter (see above).

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings yet; this is the first round | |
