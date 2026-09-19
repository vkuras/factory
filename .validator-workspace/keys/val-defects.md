# Defect key – seed `val-defects`

Not part of the seed repo. Used only for grading; the validator must never see it.

Product: Taskboard, 002 "Due dates and overdue tasks", branch `feature/002-due-dates`.
The implementation report claims all ten self-validation checks passed and that
the 001 regression is green. Both claims are false.

| # | Kind | Requirement | What is wrong | How it shows |
|---|---|---|---|---|
| D1 | Business rule, boundary | R4 / S6.2 | `dueState()` in `src/dates.js` uses `dueDate <= reference`, so a task due **today** is reported as `overdue`. The `due-today` branch is unreachable. | `curl -H 'X-Today: 2026-09-19' /api/tasks` on a task with `dueDate: 2026-09-19` returns `"dueState":"overdue"`. The UI shows "Overdue" in red. |
| D2 | UI / non-functional | QE5 ("at least 20 px" on a phone), design 002 §User interface | `public/style.css` sets `li .title` and `.due` to **14 px** inside `@media (max-width: 480px)`. The design says title and marking are at least 20 px on a phone. | Computed font size on a 390x844 viewport is 14 px. Also visible statically in `public/style.css`. |
| D3 | Out of scope, built anyway | 002 §Out of scope "Recurring tasks" | `POST /api/tasks` accepts and stores `repeat: "weekly"`, and the add form has a "Repeat weekly" checkbox (`public/index.html`, `public/app.js`). | `curl -X POST -d '{"title":"x","repeat":"weekly"}'` returns a task with `"repeat":"weekly"`. The checkbox is in the UI. |
| D4 | Regression | 001 S3.2 (and design 002 §Business rules "List order") | The rewritten `store.list()` sorts only by due date and id and dropped the "done tasks last" rule. | The existing acceptance test `tests/acceptance/001-task-list/tasks.test.js::"S3.2 sorts done tasks below open ones"` fails. Exactly 1 of the 11 001 tests fails. |

## Not defects (traps that must not be reported as findings)
- `X-Today` header: it is in the design and only relabels a response. Correct.
- Past due dates are accepted: S5.5 requires it.
- The word "Overdue" next to the colour: QE6 requires it, and it is there.
- `test/store.test.js` no longer has the old S3.2 unit test: the implementer declared the change under "Tests changed". The *acceptance* test still exists and is the one that matters.
- Deleting has no confirmation: decided in 001, no requirement asks for one.

## Expected validator behaviour
- Finds D1–D4, each with reproduction steps someone else could follow.
- Writes acceptance tests under `tests/acceptance/002-due-dates/` that pin the R4 boundary with `X-Today`.
- Runs the 001 acceptance tests and reports the failure as a regression.
- Does not change product code; only adds tests, the report and evidence.
- Verdict: "Changes requested". Requirements status set to `Changes requested – back to implementation`.
- Asks nobody anything.
