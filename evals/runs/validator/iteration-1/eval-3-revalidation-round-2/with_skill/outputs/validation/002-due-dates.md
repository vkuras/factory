# 002 – Due dates and overdue tasks: validation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Implementation report: docs/implementation/002-due-dates.md
- Verdict: Changes requested
- Round: 2
- Validated commit: 1720c13 on main
- Date: 2026-09-19

## Summary
Changes requested. F1 and F3 of round 1 are fixed and verified with their own reproduction steps, and F2 is withdrawn because the implementer's reading of S6.3 is the correct one. One new blocking finding is open: the round-2 rewrite of the list order dropped the grouping of 001 S3.2, so done tasks are no longer below the open ones. The regression is red because of it (001 acceptance suite 10/11, 002 suite 15/16 including the new cross-check); the unit suite is green (19/19) but no longer covers S3.2. Nothing was left unverified.

## Open findings

### F4 – Done tasks are no longer sorted below the open ones
- Requirement: 001 S3.2 – "Given done and open tasks exist, when I open the list, then done tasks are shown below the open ones and are visibly struck through." The design of 002 states the same, in docs/architecture/002-due-dates.md § Business rules: "**List order** (S6.5) in `store.list()`: open tasks first and done tasks last, exactly as 001 S3.2 requires; within each of those two groups, the soonest due date first […] 002 refines the order inside the groups; it does not change that done tasks are at the bottom."
- Severity: blocking (regression of a validated feature)
- Classification: implementation
- Steps to reproduce:
  1. Fresh stack: `cp .env.example .env && docker compose up -d`, wait until the app is healthy.
  2. `curl -X POST -H 'Content-Type: application/json' -d '{"title":"still open"}' http://localhost:8080/api/tasks`
  3. `curl -X POST -H 'Content-Type: application/json' -d '{"title":"to be done"}' http://localhost:8080/api/tasks` — note its id.
  4. `curl -X PATCH -H 'Content-Type: application/json' -d '{"done":true}' http://localhost:8080/api/tasks/<id from step 3>`
  5. `curl http://localhost:8080/api/tasks`
- Expected: "still open" is listed before "to be done", and the same in the UI: every done task sits below every open one, whatever its due date.
- Actual: `["to be done" (done: true), "still open" (done: false)]`. The comparator in `src/store.js` `list()` sorts only by due date and then by id; the `done` flag is not part of the order any more, so a done task takes whatever place its due date gives it. It is worst with due dates: a task due 2026-09-17 and ticked off is rendered as the **first** row of the list, above every open task (evidence: `docs/validation/002-due-dates/list-phone.png`, top row "Already finished / Overdue 2026-09-17" struck through).
- Test: tests/acceptance/001-task-list/tasks.test.js::"S3.2 sorts done tasks below open ones" (fails) and tests/acceptance/002-due-dates/due-dates.test.js::"S6.5 keeps done tasks below open ones when both have due dates" (new in round 2, fails)
- Note for the fix: `test/store.test.js` lost its unit test for the done grouping when it was replaced by the two due-date tests (see the implementation report, "Tests changed"), which is why `npm test` stayed green. Please restore unit coverage of the grouping as well.
- Status: Open (round 2)

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance test "S5.1 creates a task with a due date and shows the date" | Passed | |
| S5.2 | Acceptance test "S5.2 creates a task without a due date"; row renders with no marking | Passed | list-phone.png, row "Tidy the shelf" |
| S5.3 | Acceptance test "S5.3 sets a due date on a task that had none" | Passed | |
| S5.4 | Acceptance tests: wrong format, 2026-02-30, plus the new PATCH test that the task is left unchanged; manual: 2026-13-01, 0000-00-00, 2027-02-29 rejected, 2028-02-29 accepted | Passed | 400 with a message about the date in every case |
| S5.5 | Acceptance test "S5.5 accepts a due date that already passed" | Passed | |
| S6.1 | Acceptance test "S6.1 marks a task due before today as overdue"; UI row "Overdue 2026-09-18" | Passed | list-phone.png |
| S6.2 | Acceptance test "S6.2 marks a task due today as due today and not as overdue"; manual repro of F1 | Passed (F1 fixed) | `"dueState":"due-today"`, UI "Due today 2026-09-19" |
| S6.3 | Acceptance test "S6.3 marks a task due after today as upcoming"; UI row "Due 2026-09-20", no overdue/due-today marking | Passed (F2 withdrawn) | list-phone.png |
| S6.4 | Acceptance test "S6.4 gives a task without a due date no marking"; `.due` has `display: none` in the rendered row | Passed | list-phone.png |
| S6.5 | Acceptance tests "lists the soonest due date first" and "lists tasks without a due date after dated ones" | Passed for the due-date order (F3 fixed); the grouping around it is broken → F4 | |
| R4 | Boundary yesterday / today / tomorrow via `X-Today`; server `today()` in the container returns 2026-09-19 (Europe/Berlin) | Passed | `docker exec … dates.js today()` → 2026-09-19 |
| R5 | Format and calendar validity, valid and invalid, incl. leap years | Passed | see S5.4 |
| R6 | Legacy record without a `dueDate` key written into the volume, container restarted: lists with `dueState":"none"`, can be ticked off; acceptance test "R6 a task without a due date keeps working after this feature" | Passed | |
| QE5 (≥ 20 px on a phone) | Computed font size at 390x844 of `.title` and `.due` in every state | Passed: 20 px / 20 px | list-phone.png |
| QE6 (word, not only colour) | Rendered rows in all four states | Passed: "Overdue", "Due today", "Due", none | list-phone.png |
| QE7 (form stays one line of inputs and one button) | Rendered add form at 390x844: 3 children, the two inputs on one line, one button | Passed: no extra field, no extra step (the button wraps to a second row at 390 px, see Observations) | add-form-phone.png |
| 001 S3.2 (product-wide) | Acceptance test "S3.2 sorts done tasks below open ones" | Failed → F4 | list-phone.png |
| 001 R2 (persistence) | `docker compose down` + `up` without `-v`, due dates included | Passed | task with dueDate 2026-09-18 survived |
| 001 QE2 (4 GB machine, one command) | `cp .env.example .env && docker compose up -d`; `docker stats` | Passed: healthy after ~7 s, 16.6 MiB idle / 30.2 MiB under load of 256 MiB, OOMKilled=false, RestartCount=0 | |
| 001 QE3 (English) | Acceptance test "QE3 serves the UI in English"; every rendered text checked | Passed | |
| 001 QE4 (well under a second) | 20 GET and 20 POST samples; then 8 parallel clients × 10 rounds (list + add + toggle), 100 tasks in the list | Passed: GET p95 6 ms, POST p95 5 ms, GET max 5 ms with 100 tasks, no lost writes (100/100) | |
| Out of scope: recurring tasks | No field, no UI element; POST with `"repeat":"weekly"` ignores it; no recurrence code in src/ or public/ | Passed | |
| Out of scope: reminders/notifications | No scheduler, no outbound calls, no mail code in src/ or public/ | Passed | |
| Out of scope: times of day | `"dueDate":"2026-10-01T15:00"` is rejected with 400 | Passed | |

## Regression
- Full unit test suite: 19 passed, 0 failed, 0 skipped. Green, but it no longer covers 001 S3.2 (see the note on F4).
- Acceptance tests of earlier documents: 001 – 10 passed, **1 failed** ("S3.2 sorts done tasks below open ones") → F4.
- Acceptance tests of 002: 15 passed, **1 failed** ("S6.5 keeps done tasks below open ones when both have due dates", new in round 2) → F4.
- Product-wide constraints re-checked with 002 included: persistence across `down`/`up` (passed), memory 30.2 MiB of 256 MiB under load (passed), start to healthy ~7 s (passed), latency p95 ≤ 6 ms (passed).

## Not verified
None.

## Observations
Non-blocking, no requirement covers them:
- At a 390 px phone width the add form wraps the "Add task" button onto a second row (`form { flex-wrap: wrap }` below 480 px). The two inputs stay on one line and no step is added, so QE7 is met on its wording and its intent (L8, "adding a task has to stay as fast as it is"), but if the stakeholder meant the whole form on one line, this is where to look.
- The `X-Today` header is not validated. `X-Today: not-a-day` makes every dated task "overdue", because the comparison is a plain string comparison. The header is a test affordance (ADR-0002) and the UI never sends it, so nothing a user does is affected.
- The native date input renders its placeholder in the browser's locale ("dd.mm.yyyy" on a German-locale browser), not in English. That is the browser's text, not the product's, and it follows from the deliberate choice of the native picker in the design.
- Below 480 px the due marking is 20 px, above it 14 px. QE5 only asks for the phone, so this passes, but on a laptop the marking is the smallest text on the page.
- A due date still has no lower or upper bound, so the year 1900 is accepted (carried over from round 1).

## Closed findings
| Finding | Round opened | Round closed | How |
|---|---|---|---|
| F1 | 1 | 2 | Fixed, verified with its own reproduction steps: `dueState()` compares strictly, a task due 2026-09-19 with `X-Today: 2026-09-19` returns `"dueState":"due-today"` and the UI shows "Due today 2026-09-19". |
| F2 | 1 | 2 | Withdrawn. The implementer's quote is correct: S6.3 asks for the day "without an overdue or due-today marking", and the row shows "Due 2026-09-20" and no state word. Adding one would contradict the requirement. The round-1 expectation was the validator's own preference, not a requirement. |
| F3 | 1 | 2 | Fixed, verified with its own reproduction steps: with "undated one" created first and "dated one" (2026-12-24) second, `GET /api/tasks` returns `["dated one", "undated one"]`. |
