# 002 – Due dates and overdue tasks: validation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Implementation report: docs/implementation/002-due-dates.md
- Verdict: Changes requested
- Round: 2
- Validated commit: 1720c13 on main
- Date: 2026-09-19

## Summary
Changes requested. The two code findings of round 1 (F1, F3) are fixed and verified,
and F2 is closed: the implementer's reading of S6.3 is the correct one.

But the F3 fix introduced a blocking regression: the rewritten comparator in
`store.list()` dropped the open/done grouping, so a done task can now sit at the
top of the list. That breaks 001 S3.2 — a validated requirement — and it also
contradicts the list order that the 002 design itself specifies. The 001
regression suite is therefore red for the first time.

Three further findings, all minor, come from a closer look at the phone view and
at the `X-Today` affordance; two of them were wrongly passed in round 1 and are
corrected here.

## Open findings

### F4 – Done tasks are no longer sorted below the open ones
- Requirement: 001 S3.2 – "Given done and open tasks exist, when I open the list, then done tasks are shown below the open ones and are visibly struck through." Also design 002, "Business rules / List order": "open tasks first and done tasks last, exactly as 001 S3.2 requires; within each of those two groups, the soonest due date first".
- Severity: blocking
- Classification: implementation
- Regression: yes. Introduced by the round-2 rewrite of the comparator in `store.list()` (F3 fix). `list()` now sorts on the due date alone and never looks at `done`.
- Steps to reproduce:
  1. Fresh stack: `PORT=8131 docker compose up -d`
  2. `curl -X POST -H 'Content-Type: application/json' -d '{"title":"open later","dueDate":"2026-12-24"}' http://localhost:8131/api/tasks`
  3. `curl -X POST -H 'Content-Type: application/json' -d '{"title":"done sooner","dueDate":"2026-01-01"}' http://localhost:8131/api/tasks`
  4. `curl -X PATCH -H 'Content-Type: application/json' -d '{"done":true}' http://localhost:8131/api/tasks/<id of "done sooner">`
  5. `curl http://localhost:8131/api/tasks`
- Expected: "open later" before "done sooner". The due-date order of S6.5 orders tasks *inside* the open group and inside the done group; it does not lift a finished task above an unfinished one.
- Actual: "done sooner" is first, in the API and in the UI. The crossed-out row is the first thing on the screen, which is the opposite of what the standup in front of the list needs.
- Note: the plain 001 case (two undated tasks, one ticked off) fails as well, because undated tasks then fall back to `b.id - a.id` and the ticked-off one is usually the newer.
- Test: tests/acceptance/001-task-list/tasks.test.js::"S3.2 sorts done tasks below open ones" (failing) and the new tests/acceptance/002-due-dates/due-dates.test.js::"S6.5 + S3.2 keeps a done task below the open ones even with an earlier due date" (failing)
- Status: Open (round 2)

### F5 – On a phone the add form is two lines, not one
- Requirement: QE7 – "Adding a day must not make adding a task slower to do: the add form stays one line of inputs and one button."
- Severity: minor
- Classification: implementation
- Regression: no, but round 1 recorded QE7 as passed. That was wrong; this round measured it instead of eyeballing it.
- Steps to reproduce:
  1. Open the UI in a viewport narrower than 480 px (measured at 401 px and at 375 px).
  2. Read the top offsets of the three form children.
- Expected: title input, date input and button on one line.
- Actual: `public/style.css` adds `@media (max-width: 480px) { form { flex-wrap: wrap; } }` for 002, and the form wraps. At 401 px the button drops to a second line (children at y = 97, 97, 147); at 375 px the date input and the button both drop (y = 97, 147, 147). The date input of 002 is what pushes it over, so this is a 002 defect, not an inherited one.
- Test: – (viewport-dependent, measured in the browser)
- Status: Open (round 2)

### F6 – On a phone a long row overflows and the Delete button is cut off
- Requirement: 001 QE1 – "the list and the form work in portrait on a phone screen, and the things you tap are big enough to hit without aiming."
- Severity: minor
- Classification: implementation
- Regression: yes, against 001 QE1, caused by the 002 marking.
- Steps to reproduce:
  1. Create a task with a title of roughly 20 characters and an overdue due date, e.g. `{"title":"open overdue 2026-09-18","dueDate":"2026-09-18"}`.
  2. Open the UI at a phone viewport and look at that row.
- Expected: the whole row, including Delete, fits in the viewport.
- Actual: the marking is `white-space: nowrap` and 20 px on a phone (QE5), so the row overflows: `li.scrollWidth` 385 px against `li.clientWidth` 358 px. The Delete button is pushed to the edge of the screen and is visibly clipped; the page itself does not scroll sideways, so there is nothing the user can do about it.
- Suggestion: let the row wrap or let the marking shrink; the requirement to keep is the 20 px minimum, not a single line.
- Test: –
- Status: Open (round 2)

### F7 – An invalid X-Today header silently marks every dated task overdue
- Requirement: none directly. Design 002 / ADR-0002 introduces the header; R4 says what the states mean.
- Severity: minor
- Classification: implementation
- Steps to reproduce:
  1. `curl -H 'X-Today: not-a-date' http://localhost:8131/api/tasks`
- Expected: an unusable value is rejected (400) or ignored, so the answer still describes reality.
- Actual: the value goes straight into the string comparison in `dueState()`. `"2026-12-24" < "not-a-date"` is true, so a task due in three months comes back as `overdue`. Any client can trigger it, and nothing in the response says the day was not understood.
- Suggestion: run the header through `validateDueDate()` and fall back to `today()` (or answer 400).
- Test: –
- Status: Open (round 2)

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance test "S5.1 creates a task with a due date and shows the date" | Passed | |
| S5.2 | Acceptance test "S5.2 creates a task without a due date" | Passed | |
| S5.3 | Acceptance test "S5.3 sets a due date on a task that had none" | Passed | |
| S5.4 | Acceptance tests for the format and for 2026-02-30 | Passed | 400 both times |
| S5.5 | Acceptance test "S5.5 accepts a due date that already passed" | Passed | |
| S6.1 | Acceptance test "S6.1 marks a task due before today as overdue" | Passed | |
| S6.2 | Acceptance test with X-Today at the boundary | Passed (F1 fixed) | `"dueState":"due-today"` for the day itself |
| S6.3 | Acceptance test + the row of a task due in the future | Passed (F2 closed) | row reads "Due 2026-12-24", no state word |
| S6.4 | Acceptance test "S6.4 gives a task without a due date no marking" | Passed | `.due.none` is `display:none` |
| S6.5 | Acceptance tests for the order | Partly passed | date order and undated-last are right; the interaction with done tasks is wrong → F4 |
| R4 | Boundary yesterday / today / tomorrow via X-Today | Passed (F1 fixed) | |
| R5 | Format and calendar validity, valid and invalid | Passed | |
| R6 | A task with no `dueDate` key still lists, can be ticked off and deleted | Passed | `dueState` "none" |
| QE5 | Phone viewport, computed font size of title and marking | Passed | both 20 px |
| QE6 | The word is present in every state, colour only reinforces it | Passed | "Overdue", "Due today", "Due" |
| QE7 | Top offsets of the three form children on a phone | Failed → F5 | form wraps to two lines |
| Out of scope: recurring tasks | No field, no UI element | Passed | |
| Out of scope: reminders | No outbound calls, no scheduler | Passed | |
| Out of scope: times of day | The field is a day only | Passed | |

## Regression
- Full acceptance suite against the running stack: **23 passed, 2 failed**.
  - 001 – 10 passed, 1 failed ("S3.2 sorts done tasks below open ones") → F4.
  - 002 – 13 passed, 1 failed (the new S6.5 + S3.2 interaction test) → F4.
- Unit tests (`npm test`): 19 passed, 0 failed, 0 skipped.
  - Note: `test/store.test.js` no longer has any test for S3.2. The implementation
    report says the S3.2 test "was replaced" by the due-date order tests. Replacing
    it removed the only unit-level guard on a validated requirement, which is why
    F4 got through the implementer's own self-validation.
- Product-wide constraints re-checked: memory 26 MiB of 256 MiB (QE2), start to
  healthy 6 s, data survived `docker compose down` + `up -d` (R2).

## Not verified
None.

## Observations
- The date input still has no minimum or maximum, so the year 1900 is accepted. No requirement forbids it (carried over from round 1).
- `store.list()` sorts a missing due date as the literal `9999-12-31`. It works, but a task genuinely due on 9999-12-31 would tie with the undated ones. Not worth a finding.

## Closed findings
| Finding | Round | Resolution | Evidence |
|---|---|---|---|
| F1 – A task that is due today is shown as overdue | 1 | **Fixed.** `dueState()` compares strictly (`dueDate < reference`), so the day itself is `due-today`. | Acceptance test "S6.2 marks a task due today as due today and not as overdue" passes; the round-1 reproduction steps now return `"dueState":"due-today"`. |
| F2 – A task due after today carries no state label | 1 | **Closed, not a defect.** The implementer is right. S6.3 asks for the day "without an overdue or due-today marking", and the row shows exactly that: "Due 2026-12-24". Adding a state word would go against the requirement. The finding was mine to withdraw, and it is withdrawn. | docs/requirements/002-due-dates.md S6.3; the row rendered in the browser. |
| F3 – Tasks without a due date are listed before dated tasks | 1 | **Fixed**, but the fix caused F4. A missing due date sorts as `9999-12-31` and undated tasks come last. | Acceptance test "S6.5 lists tasks without a due date after dated ones" passes. |

## Tests changed
- `tests/acceptance/002-due-dates/due-dates.test.js`: added "S6.5 + S3.2 keeps a
  done task below the open ones even with an earlier due date". The two
  requirements only interact once tasks have dates, and nothing covered that
  interaction, which is how F4 slipped through.
