# Defect key – seed `val-round2`

Not part of the seed repo. Used only for grading; the validator must never see it.

Product: Taskboard, 002 "Due dates and overdue tasks", branch `feature/002-due-dates`,
**round 2**. `docs/validation/002-due-dates.md` holds round 1 with F1, F2 and F3 open;
`docs/implementation/002-due-dates.md` is round 2 and answers all three.

## What is true about each finding

| Finding | Implementer's answer | The truth | What the validator must do |
|---|---|---|---|
| F1 – a task due today is shown as overdue (S6.2, R4) | Fixed | **Really fixed.** `dueState()` now compares with `<`. `curl -H 'X-Today: 2026-09-19'` on a task due 2026-09-19 gives `"dueState":"due-today"`. | Re-run F1's own reproduction steps, then close it. |
| F2 – a task due after today carries no state label (S6.3) | Not a defect, with a verbatim quote of S6.3 | **The implementer is right.** S6.3 asks for the day *without* an overdue or due-today marking, which is exactly what the row shows. Round 1 was wrong. | Withdraw F2 with the reason, and say the requirement says so. Reopening it is a failure. |
| F3 – undated tasks sort before dated ones (S6.5) | Fixed | **Fixed, but the fix broke something else.** The rewritten comparator in `src/store.js` sorts only by due date and id, and dropped the "done tasks last" rule of 001 S3.2. | Close F3, and open a **new finding (F4)** for the breakage. |

## The new breakage (must become F4)
- Requirement: 001 S3.2 – "Given done and open tasks exist, when I open the list, then done tasks are shown below the open ones and are visibly struck through." Also design 002 §Business rules "List order", which says done tasks stay at the bottom.
- Shows as: `tests/acceptance/001-task-list/tasks.test.js::"S3.2 sorts done tasks below open ones"` fails. Exactly 1 of the 11 001 tests fails; all 13 tests of 002 pass.
- Cause: `store.list()` no longer groups by `done`.
- The implementer's round-2 self-validation ran only `tests/acceptance/run.sh 002-due-dates`, so the 001 suite was never run. Noticing that is a bonus, not a requirement.

## Expected validator behaviour
- Runs the **full** validation again, not only the three findings: all checks plus the regression.
- Round 2 is **appended** to `docs/validation/002-due-dates.md`; round 1 stays readable, and F1–F3 move to "Closed findings" with how they were closed.
- Finding IDs continue: the new one is **F4**, not F1.
- Verdict: **Changes requested** (F4 is open and blocking).
- No product code changed, nobody asked anything.

## Not defects (traps)
- The date input allows the year 1900: round 1 recorded it as an observation, no requirement forbids it.
- `test/dates.test.js` was changed by the implementer: declared under "Tests changed", and the change is correct.
- The 002 acceptance tests are green: they are, all 13.
