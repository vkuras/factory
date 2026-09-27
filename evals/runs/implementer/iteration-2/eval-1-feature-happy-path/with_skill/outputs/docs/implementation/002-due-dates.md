# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feat/002-due-dates, commits cc332fc..7b0d105
- Date: 2026-09-20
- Round: 1

## What was built
1. **Date rules**: `src/dates.js` — `today()` (Europe/Berlin, via `Intl.DateTimeFormat`), `validateDueDate()` (R5, format + round-trip existence check), `dueState()` (R4). Unit tests in `test/dates.test.js`, including the design's worked example (2026-09-18 overdue / 2026-09-19 due-today / 2026-09-20 upcoming, relative to 2026-09-19).
2. **API**: `src/app.js` — `POST`/`PATCH /api/tasks(/:id)` accept an optional `dueDate`, validated with `validateDueDate()`; `GET /api/tasks` decorates every task with `dueState`, computed against `X-Today` when it is a valid day, otherwise the server's real `today()`. POST/PATCH responses stay the plain `Task` (no `dueState`), per the design's Interfaces table — only `GET` decorates.
3. **List order**: `src/store.js` `list()` — open tasks first, done tasks last (unchanged from 001), and within each group the soonest due date first, no-date tasks last, ties broken by newest first (S6.5).
4. **UI**: `public/index.html` gains a `type="date"` input between the title field and the button; `public/app.js` renders the marking after the title ("Overdue 2026-09-18", "Due today 2026-09-19", or the plain day; nothing for `none`) and sends `dueDate` on create; `public/style.css` raises the row title and marking to 20 px (QE5) and gives `overdue` red + bold on top of the word (QE6), while the date input's width keeps the add form on one line (QE7).

Everything in the design's build order and Components table was built. Nothing was left out.

## How to run
```
cp .env.example .env
docker compose up -d
```
UI at http://localhost:8080 (or `PORT` from `.env`). No seed data, no test users. No migration: a task's missing `dueDate` key reads as `null` (R6), so 001's existing data keeps working.

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1 | `src/app.js` POST with `dueDate` | test/app.test.js::"S5.1 creates a task with a day and it is visible in the list" | Passed |
| S5.2 | `src/app.js` POST, `dueDate` optional | test/app.test.js::"S5.2 creates a task without a day exactly as before this feature" | Passed |
| S5.3 | `src/app.js` PATCH with `dueDate` | test/app.test.js::"S5.3 setting a day on an existing task shows it in the list" | Passed |
| S5.4 | `src/dates.js` `validateDueDate()` | test/dates.test.js (format/existence cases), test/app.test.js::"S5.4 rejects a malformed day on create/update" | Passed |
| S5.5 | `src/dates.js` `validateDueDate()` (no past-date check) | test/app.test.js::"S5.5 accepts a day that already passed" | Passed |
| S6.1 | `src/dates.js` `dueState()` | test/dates.test.js worked example; test/app.test.js::"S6.1 a day before the pinned today is overdue" | Passed |
| S6.2 | `src/dates.js` `dueState()` | test/dates.test.js worked example; test/app.test.js::"S6.2 ... due-today, not overdue" | Passed |
| S6.3 | `src/dates.js` `dueState()`, `public/app.js` `dueLabel()` | test/app.test.js::"S6.3 a day after the pinned today is upcoming" | Passed |
| S6.4 | `public/app.js` `dueLabel()` returns null for `none` | test/app.test.js::"S6.4 a task without a day has no day and no marking" | Passed |
| S6.5 | `src/store.js` `list()` | test/store.test.js (3 tests), test/app.test.js::"S6.5 orders tasks by day..." | Passed |
| R4 | `src/dates.js` `dueState()` | test/dates.test.js (4 tests) | Passed |
| R5 | `src/dates.js` `validateDueDate()` | test/dates.test.js (7 tests) | Passed |
| R6 | optional field everywhere, missing key reads as null | test/dates.test.js "R6 treats an absent day as no day"; self-validation 6 (restart) | Passed |
| QE5 | `public/style.css` `li .title`/`li .due` at 20 px | Self-validation manual CSS/markup review (browser tool unavailable, see "Not run") | Passed by inspection |
| QE6 | `public/app.js` word + `public/style.css` colour on `.overdue` only | Self-validation manual review | Passed by inspection |
| QE7 | one `type="date"` input added to the existing one-row form | Self-validation manual review | Passed by inspection |
| Out of scope: recurring tasks | Not built | – | – |
| Out of scope: reminders | Not built | – | – |
| Out of scope: times of day | Not built (field is a day) | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/app.js` | Passed | No errors |
| 2 | Unit tests | `npm test` | Passed: 38 passed, 0 failed, 0 skipped (before: 10 passed, 0 skipped) | |
| 3 | Image builds | `PORT=8121 docker compose -p tb-i2-e1-ws build` | Passed | cached layers + rebuilt src/public layers |
| 4 | Stack starts | `docker compose -p tb-i2-e1-ws up -d` | Passed: app healthy in ~6 s | `docker compose ps` → "Up 5 seconds (healthy)" |
| 5 | API walkthrough (S5, S6) | `curl` against http://localhost:8121 | Passed | See transcript below |
| 6 | R2/R6 restart | `docker compose -p tb-i2-e1-ws restart` | Passed: all 5 tasks, their `dueDate` and `done` intact | count: 5, same ids/fields as before restart |
| 7 | QE2 memory (unchanged limit) | `docker stats --no-stream` | Passed: 15.55 MiB / 256 MiB | |
| 8 | Own diff review | `git diff d276ada..HEAD` | Passed | No debug output, TODOs, secrets, or files outside the design's scope |
| 9 | Teardown | `docker compose -p tb-i2-e1-ws down -v` | Passed | |

Check 5 transcript (`X-Today: 2026-09-19` pinned):
```
POST title="Ship the release" dueDate=2026-09-25 -> 201, dueDate=2026-09-25
POST title="No date task"                        -> 201, dueDate=null
PATCH id=2 dueDate=2026-09-18                     -> 200, dueDate=2026-09-18
POST title="bad" dueDate=2026-13-40               -> 400
POST title="Already late" dueDate=2020-01-01      -> 201, dueDate=2020-01-01
POST title="Due today task" dueDate=2026-09-19    -> 201
POST title="No date at all"                       -> 201, dueDate=null
GET (X-Today: 2026-09-19) ->
  3 Already late     2020-01-01 overdue    false
  2 No date task     2026-09-18 overdue    false
  4 Due today task   2026-09-19 due-today  false
  1 Ship the release 2026-09-25 upcoming   false
  5 No date at all   null       none       false
PATCH id=1 done=true -> 200
GET (X-Today: 2026-09-19) -> id 1 now sorts to the bottom despite its day
PATCH id=9999 done=true -> 404
DELETE id=9999           -> 404 {"error":"This task does not exist."}
```

### Not run
- **UI click-through**: no browser tool was available in this run — the Claude Browser pane was already at its tab cap with other concurrent sessions on this shared machine, and reusing/closing one of those tabs risked disrupting another evaluation run. Per the self-validation fallback, every page was instead fetched directly (`/`, `/style.css`, `/app.js` all 200, `/` contains `id="due-date"` and `<title>Taskboard</title>`), and QE5/QE6/QE7 were checked by reading the shipped markup and CSS rather than by clicking through in a rendered browser.
- **Load test / CPU-architecture build**: 002's design names no new hard constraint beyond 001's memory limit (checked, passed) and states "Deployment and runtime: Unchanged"; no load test or target-architecture check is named in its Test strategy or Drivers, so none was run.

## Implementation choices
- `today()` uses `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', ... })`: the `en-CA` locale happens to format as `YYYY-MM-DD`, giving R4's reference day without a date library.
- `X-Today` validation reuses `validateDueDate()` and falls back to the real `today()` on a missing or malformed header; this glue lives in `app.js` since the design's `dates.js` exports only `today()`, `validateDueDate()` and `dueState()`.
- ISO `YYYY-MM-DD` strings compare correctly with plain string `<`/`>`/`===`, so `dueState()` and the store's sort need no date parsing.
- POST/PATCH validate `title` before `dueDate` (same order as before this feature); not specified by the design, arbitrary but stable.
- PATCH now builds an update object from whichever of `done`/`dueDate` is present (`Object.hasOwn`) instead of requiring `done`; a body with neither key is rejected with 400 rather than silently treated as a no-op, so a caller finds a typo instead of getting a quiet success.
- The design's Components table lists only two `public/` changes (the add-form date input, and the row marking) and its traceability table maps S5.3 to the PATCH endpoint only, not to a UI element. So no per-row "edit due date" control was built for existing tasks; S5.3 is proven at the API level (test/app.test.js), matching what the design actually specifies. This is a reading of an explicit, self-consistent design choice, not a gap.
- The date `<input>`'s width is a fixed `9.5rem` rather than `flex: 1`, so the title input keeps priority when the row gets tight, keeping the form on one line (QE7) down to a 375 px viewport (reasoned from the CSS; not confirmed in a rendered browser — see "Not run").

## Tests changed
None. All new tests were added; no existing test was modified or removed.

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings yet; first implementation round | |
