# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feat/002-due-dates, commits be0e950..HEAD
- Date: 2026-09-20
- Round: 1

## What was built
1. **Dates module**: `src/dates.js` — `today()` (Europe/Berlin, overridable via the `X-Today` header per ADR-0002; a malformed override is ignored and the real day is used instead, since the header only ever relabels a response), `validateDueDate()` (R5: format plus a round-trip check that the day exists) and `dueState()` (R4: strict boundary, `due today` is not `overdue`). Unit tests in `test/dates.test.js`.
2. **API**: `src/app.js` — `POST /api/tasks` and `PATCH /api/tasks/:id` accept an optional `dueDate` (validated with `validateDueDate()`); `PATCH` now applies whichever of `done`/`dueDate` is present instead of requiring `done`, and rejects a body with neither. `GET /api/tasks` decorates every task with `dueState`, computed from `X-Today` or the server's day.
3. **List order**: `src/store.js` — `list()` keeps 001's open-before-done grouping and, within each group, orders by due date ascending, no due date last, newest task first on a tie (S6.5). Tasks loaded from a file written before this feature (no `dueDate` key) are normalized to `dueDate: null` on load (R6).
4. **UI**: `public/index.html` gains a native date input between the title and the button. `public/app.js` sends `dueDate` on add and renders the marking after the title: "Overdue `<day>`" (red, bold), "Due today `<day>`" (bold), or the plain day for an upcoming one; nothing for a task without a day. `public/style.css` sets the title and the marking to 20 px on a phone and keeps the add form to one line at 375 px width.

No slice was skipped; no design element was left unbuilt.

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (change `PORT` in `.env`). No seed data, no test users. Existing `tasks.json` data from before 002 keeps working unchanged (R6).

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1 | `src/app.js` POST with `dueDate` | `tests/acceptance` smoke below + `test/dates.test.js` "R5 accepts a real day..." | Passed |
| S5.2 | `src/app.js` POST, `dueDate` optional | `test/dates.test.js` "R5 accepts no day at all as valid and optional (R6)" | Passed |
| S5.3 | `src/app.js` PATCH with `dueDate` | Self-validation 5 (curl) below | Passed |
| S5.4 | `src/dates.js` `validateDueDate()` | `test/dates.test.js` "R5 rejects a day that is not a real date" / "...not in the form YYYY-MM-DD" | Passed |
| S5.5 | `src/dates.js` `validateDueDate()` (no past-date restriction) | `test/dates.test.js` "S5.5 accepts a day that already passed" | Passed |
| S6.1 | `src/dates.js` `dueState()`, `public/app.js` marking | `test/dates.test.js` "R4 marks a day before the reference as overdue" | Passed |
| S6.2 | `src/dates.js` `dueState()` | `test/dates.test.js` "R4 marks the reference day itself as due-today, not overdue" | Passed |
| S6.3 | `src/dates.js` `dueState()`, `public/app.js` marking | `test/dates.test.js` "R4 marks a day after the reference as upcoming" | Passed |
| S6.4 | `public/app.js` `dueMarking()` returns nothing for `dueState: none` | `test/dates.test.js` "R6 a task without a day has no due state" | Passed |
| S6.5 | `src/store.js` `list()` | `test/store.test.js` "S6.5 sorts open tasks by due date, soonest first" / "...come after tasks with one" / "...newest task first when two share a day" | Passed |
| R4 | `src/dates.js` `dueState()` | `test/dates.test.js` (4 tests) | Passed |
| R5 | `src/dates.js` `validateDueDate()` | `test/dates.test.js` (6 tests) | Passed |
| R6 | optional field; `src/store.js` normalizes a missing key to `null` on load | `test/store.test.js` "R6 a task added without a due date has dueDate null" / "R6 a task written before 002 (no dueDate key) reads as null" | Passed |
| QE5 | `public/style.css` `li .title`, `li .due` at 20 px | Self-validation 7 (browser at 375×812) | Passed |
| QE6 | `public/app.js` marking text; colour only on top of it | Self-validation 7 | Passed |
| QE7 | one date input added to the existing one-row form | Self-validation 7 | Passed, after a fix (see Implementation choices) |
| Out of scope: recurring tasks | Not built | – | – |
| Out of scope: reminders | Not built | – | – |
| Out of scope: times of day | `dueDate` is a day (`YYYY-MM-DD`), never a timestamp | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/app.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 28 passed, 0 failed, 0 skipped (before this feature: 15 passed, 0 skipped) | |
| 3 | Image builds | `docker compose -p tb-i3-e1-os build` (clean, no cache reused for `src`/`public`) | Passed | |
| 4 | Stack starts | `docker compose -p tb-i3-e1-os up -d` from an empty volume | Passed: healthy after ~6 s, `docker compose ... logs` shows only the startup line, no errors | |
| 5 | Use it like a user – API | `curl` against every endpoint | Passed: POST with a day, POST without a day, POST with a past day, POST with an invalid day (400 + message), PATCH setting a day on a dateless task (S5.3), PATCH with an invalid day (400), PATCH clearing a day with `null`, PATCH with neither field (400 "Nothing to update."), PATCH on an unknown id (404), GET with `X-Today` pinned to before/on/after a task's day (`overdue`/`due-today`/`upcoming`), DELETE (204) |
| 5 | Use it like a user – UI | Browser at 375×812 and desktop width | Passed: added a task with a title and a day through the form; list showed it with the plain day (upcoming, no marking word); an existing overdue task showed "Overdue 2026-09-18" in red and bold; toggling done moved both tasks below the open one, sorted by day within the done group too; delete removed a task down to the empty state ("No tasks yet."); an empty-title submit showed "A title is required." |
| 6 | Data survives | Added a task with a day, `docker compose -p tb-i3-e1-os restart`, `GET /api/tasks` | Passed: task still present; `dueState` was `overdue` against the real server day (2026-09-20), confirming `today()` without an override also works, not only through `X-Today` |
| 7 | Hard constraints – memory | `docker stats --no-stream` | Passed: 18 MiB / 256 MiB |
| 7 | Hard constraints – regression suite | `BASE_URL=http://localhost:8151 tests/acceptance/run.sh` (001's suite, unmodified) | Passed: 11 passed, 0 failed |
| 8 | Own diff review | `git diff d276ada..HEAD` | Passed: no debug output, no commented-out code, no TODOs, no secrets, no files outside the design's scope. Found and fixed two CSS layout bugs during review (see below) |
| 9 | Tear down | `docker compose -p tb-i3-e1-os down -v` | Passed | |

### Not run
None.

## Implementation choices
- `PATCH /api/tasks/:id` now accepts `done` and/or `dueDate` independently and rejects a body with neither (`400 "Nothing to update."`), instead of the old hard requirement for `done`. The design's interface table lists both fields as optional on `PATCH`; requiring at least one is an implementation-level guard, not a new rule.
- `today()` treats a malformed `X-Today` header the same as a missing one (falls back to the real day) rather than returning `400`. The header is described only as a test aid that relabels a response (ADR-0002); the design does not define an error response for it, and it is never sent by the shipped UI.
- **S5.3 has no dedicated UI control.** The design's component table lists exactly two changes to `public/`: the date input in the add form, and the marking per row (docs/architecture/002-due-dates.md, "Components"). Its traceability table maps S5.3 only to `PATCH /api/tasks/:id`, not to any UI element. I read this as intentional rather than a silent gap — the table is specific about what `public/` gains, not merely silent about editing — so I did not add an edit control for an existing task's due date. S5.3 is covered by the API and exercised in self-validation via `curl`; the browser walk-through covers S5.1, S5.2 and S6 through the real UI.
- Sort order compares `dueDate` strings directly (`YYYY-MM-DD` sorts correctly as text); no date parsing needed for S6.5.
- Found during self-validation step 5 (browser, 375 px): the date input's `box-sizing: content-box` padding/border, plus a browser-enforced automatic minimum width on `input[type=date]`, made it wider than intended and squeezed the title input to a few pixels; and the due-date marking competed with the title for room on the same flex line, collapsing the title into an unreadable single vertical column of letters. Fixed with `box-sizing: border-box` + `min-width: 0` on the date input, and by giving the marking its own full-width line under the title (`flex: 1 1 100%`). Re-verified at 375 px and on desktop after the fix; both QE5 and QE7 hold.

## Tests changed
None. `tests/acceptance/` was not touched.

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings yet (first round) | |
