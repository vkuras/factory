# 002 – Due dates and overdue tasks: validation round 2

**Verdict: Changes requested.** Back to the implementer.

Report: `docs/validation/002-due-dates.md`, evidence in `docs/validation/002-due-dates/README.md`.

## Round-1 findings
- **F1 (blocking) – fixed.** `dueState()` now compares strictly; a task due today is `due-today`, not overdue. Verified with the original reproduction steps and the acceptance test.
- **F2 (minor) – closed, not a defect.** The implementer's rebuttal is correct: S6.3 explicitly asks for the day *without* an overdue or due-today marking, and the row shows "Due 2026-12-24". Finding withdrawn.
- **F3 (minor) – fixed**, but the fix caused F4 below.

## New findings
- **F4 (blocking, regression) – done tasks are no longer sorted below the open ones.** The round-2 rewrite of the comparator in `src/store.js` `list()` sorts on the due date alone and never looks at `done`. A finished, crossed-out task now sits at the top of the list. This breaks 001 S3.2 (a validated requirement) and contradicts the 002 design's own list-order rule ("open tasks first and done tasks last ... within each of those two groups, the soonest due date first"). Fix: group by `done` first, then apply the due-date order inside each group.
- **F5 (minor) – QE7 violated.** The `flex-wrap: wrap` added for 002 makes the add form two lines on a phone (measured at 401 px and 375 px). QE7 requires one line of inputs and one button. Round 1 passed this by eye; it is corrected here.
- **F6 (minor) – phone row overflows, Delete is clipped.** The 20 px `white-space: nowrap` marking pushes long rows past the viewport (`scrollWidth` 385 vs `clientWidth` 358) and the page does not scroll sideways, so Delete cannot be hit. Breaks 001 QE1.
- **F7 (minor) – `X-Today` is not validated.** Any non-date value goes straight into the string comparison, so `X-Today: not-a-date` returns every dated task as `overdue`. Run it through `validateDueDate()` and fall back to `today()`.

## Test results
- Acceptance suite against the running stack: **23 passed, 2 failed** — 001 "S3.2 sorts done tasks below open ones" and the new 002 interaction test, both F4.
- Unit tests: 19 passed, 0 failed.
- Non-functional re-checks: memory 26 MiB / 256 MiB, healthy 6 s after start, data survived `down` + `up -d`.

## Test I added
`tests/acceptance/002-due-dates/due-dates.test.js::"S6.5 + S3.2 keeps a done task below the open ones even with an earlier due date"`. Nothing covered how the two ordering requirements interact once tasks have dates, which is exactly the hole F4 fell through.

## Process note for the implementer
The implementation report records that `test/store.test.js`'s "S3.2 sorts done tasks to the bottom" was *replaced* by the due-date tests. Removing the only unit-level guard on a validated requirement is why the self-validation reported green while the 001 suite was red. The report also claims the full acceptance suite passed in round 2; it does not.

## Stack
Validated commit 1720c13 on `main`. Stack was run as `docker compose -p tb-e3-ns` on port 8131 and has been torn down with `down -v`. `.env` could not be written in this environment, so `PORT` was passed as a shell variable — no product issue.
