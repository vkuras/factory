# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feat/002-due-dates, commits 0ca0d3d..b0bddd4 (plus this report's commit)
- Date: 2026-09-20
- Round: 1

## What was built
1. **`src/dates.js`** (new): `validateDueDate()` (R5: format + round-trip day-exists check), `today()` (ADR-0002: Europe/Berlin day, overridable per request with a validated `X-Today`, invalid overrides fall back to the real day), `dueState()` (R4: `overdue`/`due-today`/`upcoming`/`none`, strict boundary). Unit tests in `test/dates.test.js`.
2. **`src/app.js`**: `POST`/`PATCH /api/tasks` accept an optional `dueDate`, validated with `validateDueDate()`; `PATCH` now accepts `done` and/or `dueDate` independently (previously `done` only). `GET /api/tasks` reads the `X-Today` header and decorates every task with `dueState`.
3. **`src/store.js`**: `list()` now orders by due date within the open/done groups — soonest first, no-date tasks last, newest first on a tie — without changing that done tasks stay at the bottom (S6.5).
4. **UI** (`public/`): the add form gained a native date input between the title and the button (QE7). Each row shows the day's marking after the title — "Overdue 2026-09-18" in red and bold, "Due today 2026-09-19", or the plain day, nothing when there is no day (QE5/QE6) — and a per-row native date input so a day can be set or changed on an existing task (S5.3; not explicitly laid out by the design, see "Implementation choices").

All four build-order steps are complete.

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (or `$PORT`). No seed data, no test users. `X-Today: YYYY-MM-DD` on `GET /api/tasks` pins "today" for testing; it never changes stored data.

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1 | `POST /api/tasks` with `dueDate` | test/app.test.js::"S5.1 creates a task with a day and shows it in the list" | Passed |
| S5.2 | `POST /api/tasks` without `dueDate` | test/app.test.js::"S5.2 creates a task without a day exactly as before this feature" | Passed |
| S5.3 | `PATCH /api/tasks/:id` with `dueDate`, row date input | test/app.test.js::"S5.3 sets a day on a task that had none"; manual UI check (Self-validation 5) | Passed |
| S5.4 | `validateDueDate()` | test/dates.test.js (R5 tests); test/app.test.js::"S5.4 rejects a day that is not a real date, on create and on update" | Passed |
| S5.5 | `validateDueDate()` allows any real day, past or future | test/app.test.js::"S5.5 accepts a day that has already passed" | Passed |
| S6.1–S6.4 | `dueState()`, row marking | test/dates.test.js (R4 tests); test/app.test.js::"S6.1/S6.2/S6.3/S6.4 mark overdue, due-today, upcoming and no-day tasks"; manual UI check | Passed |
| S6.5 | `store.list()` order | test/store.test.js (4 ordering tests); test/app.test.js::"S6.5 orders tasks by day, soonest first, no-day tasks last" | Passed |
| R4 | `dueState()` | test/dates.test.js: "R4 the reference day itself is due today, not overdue" and 3 more | Passed |
| R5 | `validateDueDate()` | test/dates.test.js (6 tests, incl. leap years) | Passed |
| R6 | optional field, `task.dueDate ?? null` | test/store.test.js, test/app.test.js::S5.2 | Passed |
| QE5 | `li .title`/`li .due` at 20 px | Self-validation 5: measured `getComputedStyle` at 375×812 | Passed: 20px / 20px |
| QE6 | word + colour, word alone carries "overdue" | Self-validation 5: measured colour + fontWeight of `.due.overdue` and `.due` (due-today) | Passed: overdue rgb(161,42,42)/700, due-today default colour, both say the word |
| QE7 | one native date input added to the single-row add form | Self-validation 5: measured the 3 form children's `top` (all equal) at 375 px | Passed: one line, no wrap |
| Out of scope: recurring tasks | Not built | – | – |
| Out of scope: reminders | Not built | – | – |
| Out of scope: times of day | Not built (day only) | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js public/app.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 34 passed, 0 failed, 0 skipped (before this feature: 10 passed, 0 skipped) | |
| 3 | Traceability | every row above maps to a passing test | Passed | see table |
| 4 | Stack starts | `PORT=8141 docker compose -p tb-i3-e1-ws up -d --build` | Passed | healthy in ~9s, `docker compose ... logs` clean |
| 5 | Use it like a user | curl for every endpoint + real browser at 375×812 | Passed | S5.1 created via the actual add form ("Add with date via form", due 2026-11-11, sorted correctly); S5.3 via the row date input ("No date task" → 2026-09-19 → became "Overdue 2026-09-19" and re-sorted); measured `title` and `.due` font-size = 20px; `.due.overdue` colour rgb(161,42,42), font-weight 700; add form's 3 children share the same `top` (96.58px) at 375 px width → one line; `scrollWidth`(375) = `clientWidth`(375), no horizontal scroll |
| 6 | Data survives | `docker compose -p tb-i3-e1-ws restart` | Passed: all 6 tasks (incl. due dates) present after restart, healthy in 5s | |
| 7 | Memory | `docker stats --no-stream` | Passed: 16.52 MiB / 256 MiB | |
| 8 | Regression | `tests/acceptance/run.sh` (001's suite, untouched) | Passed: 11 passed, 0 failed | |
| 9 | Own diff review | `git diff d276ada..HEAD` | Passed: no debug code, no TODOs, no secrets, changes confined to `src/dates.js`, `src/app.js`, `src/store.js`, `public/`, `test/` | |
| 10 | Tear down | `docker compose -p tb-i3-e1-ws down -v` | Passed | |

### Not run
None. Docker, Node and a browser were all available in this environment.

## Implementation choices
- **Per-row date input to edit an existing task's day (S5.3)**: the design's "User interface" section only describes the add form and the read-only marking; it doesn't lay out how a team member changes the day on a task that already exists. `PATCH /api/tasks/:id` already accepts `dueDate` (Interfaces table), so this is a UI-affordance choice, not an API or data-model one. I added a native `<input type="date">` per row, styled small, mirroring how the existing checkbox already edits a field in place — no new screen, no dialog, one native control. Noted here rather than sent to the architect because it doesn't change any contract, business rule, or out-of-scope item; it only picks the interaction for something the design left to implementation.
- **Row layout wraps on narrow screens**: adding the per-row date input and the marking text to the existing single flex row caused the title to be squeezed to near-zero width on a 375 px viewport, which broke it into one letter per line (caught during the actual browser check, not by reading the CSS). Fixed by giving `li` `flex-wrap: wrap` and the title a `min-width: 8rem`, so extra controls wrap to their own line below the title instead of shrinking it. This only affects existing-task rows; the add form itself is unaffected and still QE7-compliant (verified, see Self-validation 5).
- **`PATCH` accepts `done` and/or `dueDate` independently**: needed so a day can be set without also touching `done`, and vice versa (backward compatible with the pre-002 "done only" PATCH).
- **X-Today with an invalid value**: falls back to the real server day rather than erroring, since `X-Today` only exists to help tests and the design doesn't specify error behaviour for a malformed one.

## Tests changed
None. `test/store.test.js` gained new tests but no existing test was modified or removed. `tests/acceptance/` was not touched.

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings in round 1 | |
