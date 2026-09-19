# 002 – Due dates and overdue tasks: **Rejected**, round 1

Validation report: `docs/validation/002-due-dates.md`. Acceptance suite for 002 written during this round: `tests/acceptance/002-due-dates/due-dates.test.js` (18 tests). `tests/acceptance/helpers.js` gained an optional headers argument so tests can pin `X-Today`.

## Verdict
The happy paths work (add a day, change it, reject invalid ones, accept past days, order by day), but **five blockers** stop the feature, including the central business rule.

## Findings for the implementer
1. **F1 – a task due today is marked overdue (S6.2, R4).** `src/dates.js` uses `if (dueDate <= reference) return 'overdue';`, which also makes the `due-today` branch dead code. This is the exact boundary the stakeholder decided on. The unit test `test/dates.test.js::"R4 marks a task due today as overdue"` asserts the defect and has to be corrected too – it is why the unit suite is green.
2. **F2 – regression of 001 S3.2.** `store.list()` lost the open/done grouping when it gained the due-date order. The design required both ("open tasks first and done tasks last ... within each of those two groups, the soonest due date first"). The 001 acceptance test "S3.2 sorts done tasks below open ones" fails. The unit test covering it was deleted instead of adapted; bring it back as a grouped-order test.
3. **F3 – out-of-scope feature shipped.** Recurring tasks are explicitly out of scope, but `src/app.js` accepts and stores `repeat: "weekly"`, `public/index.html` has a "Repeat weekly" checkbox and `public/app.js` sends it. Nothing acts on it, so the UI promises behaviour that does not exist. Remove field, checkbox, CSS and stored value.
4. **F4 – QE5 phone text.** The `max-width: 480px` block sets the title and the marking to **14 px**; QE5 requires at least 20 px, and the design promised to raise the row text to 20 px. Measured on a 375x812 viewport: title 14 px, marking 14 px.
5. **F5 – QE7 add form.** The form is no longer one line: the extra checkbox plus `flex-wrap: wrap` breaks it into three rows on a phone (measured height 123.7 px). Fixing F3 is most of the fix; the remaining title + day + button must stay one row.

## Test results
- Unit tests: 19 passed, 0 failed – not trustworthy while F1's test asserts the defect.
- Acceptance, full regression against the running stack: **001: 10 passed, 1 failed** (S3.2), **002: 13 passed, 5 failed**.
- R2 persistence over a restart: OK. QE2 memory 25.5 MiB / 256 MiB. QE4 `GET /api/tasks` slowest of 20 runs 3.0 ms. QE6 (word plus colour) OK.

## Note on the hand-over
The implementation report states "Acceptance tests (001 + 002) … 11 passed, 0 failed … Regression of 001 is green" and "QE5 … Passed", none of which holds against the delivered code; there were no 002 acceptance tests in the repo at all. Please run the suite before the next hand-over.

Requirement status left at "Implemented – ready for validation" for the fix round. Stack torn down (`docker compose -p tb-e1-ns down -v`).
