Feature 002 (due dates and overdue tasks) is implemented per `docs/architecture/002-due-dates.md`, in build order.

What was built:
- `src/dates.js` (new): `today()` (Europe/Berlin, overridable via `X-Today` per ADR-0002), `validateDueDate()` (R5), `dueState()` (R4). Unit tests in `test/dates.test.js`.
- `src/app.js`: `GET /api/tasks` decorates every task with `dueState` using the resolved "today"; `POST`/`PATCH` accept an optional `dueDate`, validated the same way.
- `src/store.js`: `list()` now sorts within the open/done groups by due date (soonest first, no date last), keeping the newest-first tiebreak and the done-tasks-last rule from 001.
- UI (`public/index.html`, `app.js`, `style.css`): the add form gained a native date input and stayed one row (QE7); each row shows "Overdue YYYY-MM-DD" / "Due today YYYY-MM-DD" / the plain day / nothing, in a word plus colour at 20px (QE5/QE6); a per-row date input lets a bare task get a day or an existing day be changed (S5.3).
- `docs/implementation/002-due-dates.md` added with full traceability; `docs/requirements/002-due-dates.md` status set to "Implemented – ready for validation", `docs/architecture/002-due-dates.md` to "Implemented".

Testing:
- `npm test`: 25/25 unit tests pass (dates, store, validation).
- Built and ran the stack with `PORT=8111 docker compose -p tb-i1-e1-ns up -d --build`; `tests/acceptance/run.sh` against it: 001 regression 11/11, new 002 suite 13/13, all passing.
- Verified in the browser: add form stays a single row on a phone viewport; overdue/due-today/upcoming/none states render correctly; setting a due date on an existing task via its row updates the marking live; confirmed the R4 midnight boundary with `X-Today` (a task due "today" shows `due-today`, not `overdue`).
- Stack torn down afterwards with `docker compose -p tb-i1-e1-ns down -v`.

No design gaps were found; nothing was sent back to architecture. No commit was made (not requested); the repo has the changes in the working tree.

Key files: `src/dates.js`, `src/app.js`, `src/store.js`, `public/index.html`, `public/app.js`, `public/style.css`, `test/dates.test.js`, `test/store.test.js`, `tests/acceptance/002-due-dates/tasks.test.js`, `tests/acceptance/helpers.js`, `docs/implementation/002-due-dates.md`.
