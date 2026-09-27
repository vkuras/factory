# 002 – Due dates and overdue tasks: validation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Implementation report: docs/implementation/002-due-dates.md
- Verdict: **Rejected – findings to fix**
- Round: 1
- Validated commit: working tree on `main` (repo has no `feature/002-due-dates` branch)
- Date: 2026-09-19

## Summary
Rejected. The feature works for the plain cases – a day can be added, changed, rejected when invalid, past days are accepted, and the list orders by day – but five findings block it. The central business rule R4 is wrong (a task due **today** is reported as **overdue**, the exact boundary the stakeholder was asked about), 001's S3.2 has regressed (done tasks no longer sit below open ones), a feature that is explicitly out of scope (recurring tasks) has been shipped in the API and the UI, and both phone quality expectations fail (text is 14 px where at least 20 px is required, and the add form is no longer one row).

The acceptance suite for 002 was written during this validation: `tests/acceptance/002-due-dates/due-dates.test.js` (18 tests). The regression suite now covers 001 and 002.

## Open findings

### F1 – A task due today is marked overdue (blocker, S6.2, R4)
`dueState()` compares with `<=` instead of `<`, so the `due-today` branch below it can never be reached:

`src/dates.js`
```js
if (dueDate <= reference) return 'overdue';
if (dueDate === reference) return 'due-today';   // dead code
```
This is the boundary the stakeholder decided explicitly ("Something due today is not late. The day is still running.", L3): `overdue` only when the day lies **strictly before** today.

Evidence: `GET /api/tasks` with `X-Today: 2026-09-19` returns `dueState: "overdue"` for a task with `dueDate: "2026-09-19"`; the UI shows "Overdue 2026-09-19" in red. Failing acceptance tests: "S6.2 / R4 marks a task due today as due-today and not as overdue" and "R4 the boundary moves with the day, not with the data".

Also fix the unit test `test/dates.test.js::"R4 marks a task due today as overdue"` – it asserts the defect and is the reason the unit suite is green.

### F2 – Regression: done tasks are no longer below open ones (blocker, 001 S3.2)
`store.list()` was rewritten for the due-date order and lost the done/open grouping:

`src/store.js`
```js
return [...this.tasks].sort((a, b) => {
  const dueA = a.dueDate ?? '9999-12-31';
  ...
});
```
The design says the opposite (002 design, "Business rules"): *"open tasks first and done tasks last, exactly as 001 S3.2 requires; within each of those two groups, the soonest due date first"*. A done task with an early day now jumps above open tasks.

Evidence: the 001 acceptance test "S3.2 sorts done tasks below open ones" fails (`done task was not below the open one: to be done, still open`), and so does the new "S6.5 / S3.2 keeps done tasks below open ones while ordering by day".

The unit test that covered this was removed rather than adapted (implementation report, "Tests changed"). It has to come back as a grouped-order test, not disappear.

### F3 – Recurring tasks were built, although they are out of scope (blocker)
002 lists recurring tasks under **Out of scope** ("that is a different thing, it needs a whole discussion", L7), and the design has no `repeat` field. The implementation ships one anyway:
- `src/app.js` POST: `const repeat = body.repeat === 'weekly' ? 'weekly' : null;`, stored on the task.
- `public/index.html`: `<label class="repeat"><input id="repeat" type="checkbox" /> Repeat weekly</label>`, sent by `public/app.js`.
- `public/style.css`: `.repeat { ... }`.

Nothing acts on the flag, so the UI promises a behaviour the product does not have. Evidence: `POST {"title":"weekly thing","repeat":"weekly"}` returns `{"id":10,...,"repeat":"weekly"}`, and every task in `GET /api/tasks` now carries a `repeat` key. Failing acceptance test: "Out of scope: the product has no recurring tasks". Remove the field, the checkbox, its CSS and the stored value.

### F4 – Phone text is 14 px, not at least 20 px (blocker, QE5)
`public/style.css`, `@media (max-width: 480px)` sets `li .title { font-size: 14px; }` and `.due { font-size: 14px; }` – it makes the text *smaller* on a phone instead of raising it to the 20 px the design promised ("Title and marking are at least 20 px on a phone viewport (QE5), which raises the row text from the 18 px of 001"). The `.due` rule is 14 px on desktop too.

Evidence, 375x812 viewport, computed styles: title `14px`, marking `14px` for all three rows. QE5 requires at least 20 px for the title **and** the due-date marking.

### F5 – The add form is no longer one line of inputs and one button (blocker, QE7)
QE7: *"the add form stays one line of inputs and one button"*. The form now holds the title, the date input, the "Repeat weekly" checkbox and the button, and `form { flex-wrap: wrap }` breaks it into three rows on a phone (measured height 123.7 px at 375 px width, against one row before).

Removing the out-of-scope checkbox (F3) is most of the fix; the title + day + button row must still be one line on a phone viewport.

Failing acceptance test: "QE7 the add form is one line of inputs and one button".

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance "S5.1 creates a task with a due date ..." | Passed | 201, day in `GET` |
| S5.2 | Acceptance "S5.2 creates a task without a due date ..." | Passed | `dueDate: null`, `dueState: "none"` |
| S5.3 | Acceptance "S5.3 sets a due date on a task that had none" | Passed | PATCH 200 |
| S5.4 | Acceptance: wrong format, non-existent day, PATCH leaves the task unchanged | Passed | 400 + message about the date |
| S5.5 | Acceptance "S5.5 accepts a day that already passed" | Passed | 201 for 2026-01-02 |
| S6.1 | Acceptance "S6.1 / R4 marks a task due before today as overdue" | Passed | `overdue` for 2026-09-18 on 2026-09-19 |
| S6.2 | Acceptance "S6.2 / R4 ... not as overdue" | **Failed** | **F1** |
| S6.3 | Acceptance "S6.3 marks a task due after today as upcoming" | Passed | |
| S6.4 | Acceptance "S6.4 gives a task without a day no day and no marking" | Passed | `.due.none` is hidden |
| S6.5 | Acceptance "S6.5 orders tasks by day ..." | Passed | soonest, later, undated |
| S6.5 + 001 S3.2 | Acceptance "S6.5 / S3.2 keeps done tasks below open ones ..." | **Failed** | **F2** |
| R4 | Acceptance "R4 the boundary moves with the day ..." via `X-Today` | **Failed** | **F1**, the whole boundary is shifted by one day |
| R5 | Acceptance S5.4 pair + unit tests | Passed | `19.09.2026` and `2026-02-30` rejected |
| R6 | Acceptance "R6 a task stored without a due date keeps working" | Passed | done + list still fine |
| QE5 | Browser at 375x812, computed font sizes | **Failed** | **F4**, 14 px vs. ≥ 20 px |
| QE6 | Acceptance "QE6 the overdue marking carries a word ..." + screen | Passed | "Overdue 2026-09-18", word + colour |
| QE7 | Acceptance "QE7 the add form is one line ..." + measured form height | **Failed** | **F5** |
| Out of scope: recurring tasks | Acceptance "Out of scope: the product has no recurring tasks" | **Failed** | **F3** |
| Out of scope: reminders | Searched for mail/push/outbound calls | Passed | none present |
| Out of scope: times of day | The field is a day; the API rejects anything but YYYY-MM-DD | Passed | |

## Regression
- Unit tests (`npm test`): 19 passed, 0 failed – but one of them (`R4 marks a task due today as overdue`) asserts the defect of F1, so the green suite is not evidence.
- Acceptance suite, full run against the running stack: **001: 10 passed, 1 failed** (S3.2, F2); **002: 13 passed, 5 failed** (F1 x2, F2, F3, F5).
- R2 (persistence): `docker compose restart`, tasks and due dates still present.
- QE2 (memory): 25.5 MiB of the 256 MiB limit during the run.
- QE4 (speed): `GET /api/tasks`, 20 runs, slowest 3.0 ms.
- QE3 (English): unchanged, acceptance test green.

## Not verified
- Behaviour across an actual midnight roll-over (R4 without `X-Today`): checked only through the header, as the design intends.
- Two simultaneous browsers on the new field (R3 was validated for 001 and nothing in 002 changes the single shared list).

## Observations
- The implementation report claims things that do not hold: self-validation 5 says "Acceptance tests (001 + 002) ... 11 passed, 0 failed ... Regression of 001 is green", but no 002 acceptance tests existed in the repo and 001's S3.2 test fails against the delivered code; self-validation 7 claims QE5 passed. Please run the suite before the next hand-over.
- The traceability table in the implementation report names the test "R4 marks a task due today as overdue" for S6.2 – the test name itself states the opposite of the acceptance criterion.
- `tests/acceptance/helpers.js` gained an optional fourth argument for extra request headers, so acceptance tests can pin `X-Today`. Existing calls are unaffected.

## Closed findings
None (first round).
