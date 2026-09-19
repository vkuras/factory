# 002 – Due dates and overdue tasks: validation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Implementation report: docs/implementation/002-due-dates.md
- Verdict: Validated
- Round: 1
- Validated commit: d417a32 on feature/002-due-dates
- Date: 2026-09-19

## Summary
Validated. Every acceptance criterion, business rule and quality expectation of 002 was checked against a freshly built stack through its real interfaces (HTTP API and the browser UI), and all of them passed. There are no open findings. The regression is green: 20 unit tests, the 11 acceptance tests of 001 and the 26 new acceptance tests of 002, plus the product-wide constraints of 001 (memory, restart persistence, response times) re-measured with the feature in place. Nothing is unverified.

## Open findings
None.

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance test "S5.1 creates a task with a day and shows the day in the list"; plus the real UI: title + day typed into the add form | Passed | 201 with `dueDate`; UI row "UI task with a day / Overdue 2026-09-17" |
| S5.2 | Acceptance tests "S5.2 creates a task without a day" and "… with an explicitly empty day"; UI add with the date field left empty | Passed | `dueDate: null`, `dueState: none`, row identical to 001 |
| S5.3 | Acceptance tests "S5.3 sets a day on a task that has none" and "S5.3 changes and clears a day again" | Passed | PATCH 200, the list shows the new day |
| S5.4 | Acceptance tests for 8 malformed days (2026-02-30, 2026-13-01, 2026-09-31, 19.09.2026, 2026-9-1, 09/19/2026, "tomorrow", 2026-09-19T10:00:00Z) on POST, plus one on PATCH; UI check that the message is shown | Passed | 400 `{"error":"A due date must be a real date."}` / `"… must look like 2026-09-19."`; nothing created, the existing day unchanged; UI shows the message |
| S5.5 | Acceptance test "S5.5 accepts a day that already passed" | Passed | 201 with dueDate 2026-01-02, listed and marked overdue |
| S6.1 | Acceptance test "S6.1 marks a task whose day is before today as overdue"; UI screenshot | Passed | `dueState: overdue`; UI "Overdue 2026-09-18" |
| S6.2 | Acceptance test "S6.2 marks a task due today as due today and not as overdue"; UI screenshot | Passed | `dueState: due-today`, never `overdue`; UI "Due today 2026-09-19" |
| S6.3 | Acceptance test "S6.3 marks a task due after today as neither overdue nor due today" | Passed | `dueState: upcoming`; UI "Due 2026-09-25", no overdue/due-today wording |
| S6.4 | Acceptance test "S6.4 gives a task without a day no day and no marking"; UI screenshot | Passed | `dueState: none`; UI row "Order new filters" with no day element |
| S6.5 | Acceptance test "S6.5 orders open tasks by day, the soonest first, undated last" and "S6.5 with 001 S3.2: done tasks stay below open ones" | Passed | Order past → near → far → undated; done tasks remain at the bottom (see note below) |
| R4 (boundary, Europe/Berlin) | Acceptance test "R4 boundary: yesterday, today and tomorrow relative to a pinned today"; plus the real server clock with no `X-Today`, and `today()` run inside the container under `TZ=Pacific/Auckland` and `TZ=America/Los_Angeles` | Passed | overdue / due-today / upcoming as required; at 21:47 UTC the server returns the Berlin day 2026-09-19 under every process time zone |
| R5 (YYYY-MM-DD, day must exist) | The 8 malformed days above, plus "R5 accepts a leap day that exists and rejects one that does not" | Passed | 2024-02-29 → 201, 2026-02-29 → 400 |
| R6 (day optional, old tasks keep working) | Pre-002 `tasks.json` (records without a `dueDate` key) written into the data volume, container restarted, then GET / PATCH / DELETE on those tasks; acceptance test "R6 a task created without a day keeps working" | Passed | Old records read back with `dueState: none`, a day can be set on them afterwards, done and delete still work |
| QE5 (title and marking ≥ 20 px on a phone) | Rendered page measured with `getComputedStyle` in headless Chromium at 390x844, mobile emulation | Passed: title 20 px, marking 20 px in all states | docs/validation/002-due-dates/list-phone.json, list-phone.png |
| QE6 (not colour alone) | Rendered row text in all four states | Passed: "Overdue 2026-09-18", "Due today 2026-09-19", "Due 2026-09-25", and no text without a day — the word carries the meaning, red only reinforces it | list-phone.png |
| QE7 (add form stays one row of inputs and one button) | Bounding boxes of every form control at 390 px width | Passed: title, date input and button all at top 97 px, height 44 px, form height 44 px, exactly one submit button | list-phone.json, list-phone.png |
| Out of scope: recurring tasks | Acceptance test with a `repeat` field; `git grep` over src/ and public/ for recurrence wording | Passed: the field is ignored and not stored, no recurrence code or UI | |
| Out of scope: reminders/notifications | `git grep` for mail/push/webhook/cron; no outbound HTTP in src/ | Passed | |
| Out of scope: times of day | Acceptance test "a time of day is not accepted on a due date"; the stored field holds a day only | Passed: "2026-09-19 14:30" → 400 | |
| 001 QE1 (phone, tap targets) | 390x844: single column, no horizontal scroll (scrollWidth 390 = innerWidth), delete button 68x44, checkbox 24x24 (unchanged from 001), rows 100/67 px | Passed | list-phone.png |
| 001 QE2 (4 GB machine, one command) | `PORT=8144 docker compose up -d --build`, then `docker stats` during the load run | Passed: 34.5 MiB of the 256 MiB limit, no OOM kill, 0 restarts | |
| 001 QE3 (English) | Every visible text in the UI and every API error message | Passed: `<html lang="en">`, "Add task", "Overdue", "Due today", "Due", "Delete", "A title is required.", "A due date must be a real date." | |
| 001 QE4 (well under a second) | 50 GETs and 20 POSTs against 200+ tasks with due dates, plus 10 concurrent clients doing list/add/delete, 400 requests | Passed: GET p95 0.9 ms, POST p95 0.7 ms, 10 concurrent users p95 4.3 ms, max 8.3 ms, 0 errors | |
| 001 R2 (survives a restart) | `docker compose down` + `up` without `-v`, with 207 tasks of which 138 have a day | Passed: 207 tasks and all 138 days back, healthy again after 1 s | |
| 001 R3 (one shared list) | The API client and the browser UI against the same stack | Passed: same list, changes made through one interface visible in the other | |

Note on S6.5 and 001 S3.2: 002 S6.5 ("ordered by day, the soonest first, tasks without a day last") and 001 S3.2 ("done tasks are shown below the open ones") both apply to the same list. The implementation sorts by day inside the open group and inside the done group, so both requirements hold; this is also what the design states. Validated against that reading, which is the only one that satisfies both requirements.

## Regression
- Full unit test suite (`npm test`): 20 passed, 0 failed, 0 skipped.
- Acceptance tests of earlier documents: 001-task-list 11 passed, 0 failed.
- Acceptance tests of 002: 26 passed, 0 failed.
- Product-wide constraints re-checked with the feature in place: memory 34.5 MiB of 256 MiB (limit 256 MB, machine budget 4 GB), no OOM kill, 0 restarts; start to responding 1 s; GET p95 0.9 ms with 200+ tasks; data survived `down` + `up`.
- Robustness around the requirements: PATCH on an unknown id → 404 with an English message, malformed JSON → 400, a non-string `dueDate` → 400, a 5000-character `dueDate` → 400, 10 concurrent PATCHes on one task → one consistent value and no lost or corrupted records, an unparsable `X-Today` → falls back to the server's day and answers 200. The stack stayed healthy throughout.

## Not verified
None.

## Observations
Non-blocking, no requirement covers them:
- A **done** task whose day is in the past still carries the red "Overdue" marking (see the last row of list-phone.png). No requirement says a finished task loses the marking, and R4 defines overdue purely by the day, so this is correct as specified — but the team may find a struck-through task that is also shown as late confusing.
- The native date input renders its placeholder in the **browser's** locale (here "dd.mm.yyyy"), not in the page language. This comes from the user agent, not from the product, and the value the product sends and shows is always YYYY-MM-DD.
- On a 390 px phone the title field is only 109 px wide, so its placeholder "What needs doing?" is visually cut off. Typing works normally. This is the cost of QE7's single row and is within what the requirement asks for.
- The implementation report names commits `9c1d2e3..7b8a9f0` on `feature/002-due-dates`; the repository's history at validation time is `4b3f75b`, `0dddaf4`, `d417a32`. The validated code is `d417a32`. Worth aligning the report's commit range in future rounds.

## Closed findings
None.
