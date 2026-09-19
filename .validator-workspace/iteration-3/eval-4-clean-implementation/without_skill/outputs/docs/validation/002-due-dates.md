# 002 – Due dates and overdue tasks: validation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Implementation report: docs/implementation/002-due-dates.md
- Verdict: Validated
- Round: 1
- Date: 2026-09-19

## Summary
Validated. Every acceptance criterion, business rule and quality expectation of 002 was
checked against the running stack, and the regression suite of 001 is green. There are no
open findings.

The feature was validated black-box against a container built from the repo
(`docker compose up -d --build`, published on port 8145). 16 new acceptance tests were
added in `tests/acceptance/002-due-dates/`; the full acceptance suite is now 27 tests,
all passing. The R4 boundary is driven through the `X-Today` header of ADR-0002, and once
without it so the server's own day is exercised too.

## Open findings
None.

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance "S5.1 creates a task with a day and shows the day in the list" | Passed | 201 with `dueDate`, day present in `GET /api/tasks` |
| S5.2 | Acceptance "S5.2 creates a task without a day, exactly as before this feature" | Passed | `dueDate` null, `dueState` `none`, row unchanged |
| S5.3 | Acceptance "S5.3 sets a day on a task that had none" | Passed | PATCH 200, day in the list |
| S5.4 | Acceptance "S5.4 rejects a day that is not a real date" (2026-02-30, 2026-13-01, 2026-09-31) and "… not in the form 2026-09-19" (19.09.2026, 2026/09/19, tomorrow, 2026-9-1, 2026-09-19T10:00:00Z) | Passed | 400 with a message about the date in all 8 cases |
| S5.4 (not changed) | Acceptance "S5.4 does not change a task when the new day is invalid" | Passed | PATCH 400, the old day survives |
| S5.5 | Acceptance "S5.5 accepts a day that already passed" | Passed | 201, `dueState` `overdue` |
| S6.1 / R4 | Acceptance "S6.1 / R4 marks a task whose day is before today as overdue" | Passed | `X-Today: 2026-09-19`, day 2026-09-18 → `overdue` |
| S6.2 / R4 | Acceptance "S6.2 / R4 marks a task due today as due today and not overdue" | Passed | day 2026-09-19 → `due-today` |
| S6.3 / R4 | Acceptance "S6.3 / R4 leaves a task due after today unmarked" | Passed | day 2026-09-20 → `upcoming`, day still shown |
| S6.4 | Acceptance "S6.4 shows no day and no marking"; browser at 390x844 | Passed | `dueState` `none`, the marking element is `display: none` |
| S6.5 | Acceptance "S6.5 orders tasks by day, soonest first, undated last" | Passed | order 2026-09-18, 2026-09-20, undated |
| S6.5 + 001 S3.2 | Acceptance "keeps done tasks below open ones whatever their day" | Passed | a done task due 2026-09-18 stays below an open task due 2026-12-31 |
| R4 (real clock) | Acceptance "R4 without a pinned day the server decides, and the boundary still holds" | Passed | no `X-Today`: today → `due-today`, yesterday → `overdue`, Europe/Berlin |
| R5 | Covered by the S5.4 checks above plus `test/dates.test.js` | Passed | format and calendar-existence both enforced |
| R6 (old records) | Wrote a `tasks.json` with records that have **no** `dueDate` key into the volume, restarted the container | Passed | both records read back, `dueState` `none`, PATCH could add a day afterwards |
| R6 (day removable) | Acceptance "R6 a day can be removed again" | Passed | PATCH `{"dueDate":null}` → 200, `dueState` `none` |
| R6 (old flows) | Acceptance "R6 a task from before this feature stays valid and works without a day" | Passed | toggle 200, delete 204 |
| QE5 | Headless Chromium at 390x844, computed styles | Passed | title 20 px and marking 20 px in every row | docs/validation/002-due-dates/list-phone-390x844.png |
| QE6 | Same run: text and colour of every state | Passed | "Overdue 2026-09-18" (rgb(161,42,42), weight 600), "Due today 2026-09-19", "Due 2026-09-26" — the word carries the meaning without the colour |
| QE7 | Same run: the add form's geometry | Passed | 3 children all at y=97, one row, 44 px high, one button; no horizontal page scroll (scrollWidth 390 = viewport) |
| Out of scope: recurring tasks | `POST` with `"repeat":"weekly"`; grep over src/ and public/ | Passed | the field is dropped, no recurrence code |
| Out of scope: reminders/notifications | grep for mail/push/notification/smtp | Passed | no hits, no outbound calls |
| Out of scope: times of day | `POST` with `dueDate: "2026-09-19T10:00:00Z"` and with `"dueTime":"15:00"` | Passed | the timestamp is rejected 400, `dueTime` is dropped |

## Regression
- Full acceptance suite against the running stack: **27 passed, 0 failed, 0 skipped**
  (001-task-list 11, 002-due-dates 16).
- Unit tests (`npm test`): **20 passed, 0 failed, 0 skipped**.
- Product-wide constraints from 001 re-checked:
  - R2 persistence: `docker compose down` + `up` (no `-v`) — tasks and their due dates survived.
  - R3 shared list: unchanged, one store, no per-client state.
  - QE2 memory: peak 28.4 MiB of the 256 MiB limit during the 203-task performance run.
  - QE3 English: all new labels and error messages are English ("Overdue", "Due today",
    "Due", "A due date must look like 2026-09-19.", "A due date must be a real date.").
  - QE4 performance: `GET /api/tasks` with 203 tasks, 20 runs — p50 0.8 ms, p95 1.4 ms.
    The new sort does not regress the read path.

## Not verified
- Behaviour across a real midnight rollover in the team's time zone. The boundary is
  verified through `X-Today` and once against the server's own Europe/Berlin day, which is
  the mechanism ADR-0002 chose precisely so this does not have to be waited out.
- The native date picker's own UI on a physical phone. The input is the browser's
  `type="date"`, so its picker is the platform's, not the product's.

## Observations
- `X-Today` is not validated: a nonsense value is compared as a string and silently
  produces a state. It cannot write anything and only relabels one response, so it is not
  a defect against any requirement, but a 400 on a malformed header would be tidier.
- On a 390 px viewport the title field of the add form is 109 px wide, so a long title
  scrolls inside it while typing. That is the direct cost of QE7's one-row rule and the
  stakeholder chose speed of adding over a wide field; worth watching if the team complains.
- The 20 px rule lives behind a `max-width: 480px` media query. Phones in portrait are all
  below that; a phone turned to landscape falls back to 18 px title and 14 px marking.
  QE5 speaks of "a phone screen" read standing, which is the portrait case, so this passes,
  but it is the one place the rule has an edge.
- `tests/acceptance/helpers.js` gained an optional fourth argument for request headers so
  the acceptance tests can pin the day. Existing calls are unaffected.

## Closed findings
None.
