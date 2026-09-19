**002 – Due dates and overdue tasks: Changes requested.** 5 open findings (4 blocking, 1 minor).

- **F1 (blocking, S6.2/R4)** – a task due *today* is reported as `overdue` and rendered "Overdue 2026-09-19". `src/dates.js:33` compares with `<=`, so the `due-today` state is unreachable. The unit test asserting it is named "R4 marks a task due today as overdue", which is why the implementer's report claims S6.2 passed.
- **F2 (blocking, regression 001 S3.2)** – done tasks no longer sort below open ones: `src/store.js` sorts by due date only and dropped the done grouping the 002 design explicitly keeps. The 001 acceptance suite fails (10/11). The implementer's self-validation "11 passed, 0 failed" does not reproduce.
- **F3 (blocking, out of scope)** – recurring tasks are built: a "Repeat weekly" checkbox in the add form, a `repeat` field accepted by `POST /api/tasks`, stored in `tasks.json` and surviving restarts. Nothing acts on it.
- **F4 (blocking, QE5)** – phone text is 14 px for both title and due marking (measured with `getComputedStyle` at 390x844), where QE5 and the design demand ≥ 20 px; it is even smaller than 001's 18 px.
- **F5 (minor, QE7)** – the add form wraps to two rows on a phone (the extra recurrence control); re-measure after F3 is fixed.

Passed: S5.1–S5.5, S6.1, S6.3–S6.5 (within the open group), R5, R6, QE6, the other out-of-scope items, restart persistence, one-command start, English UI. Non-functional measured: 33 MiB of the 256 MiB limit under load, no OOM, 10 concurrent users p50 2.1 ms / p95 6.5 ms / 0 errors, healthy 1 s after `up`, only the app port published, no secrets tracked, no outbound calls. Nothing is unverified: the UI was measured in a real Chromium (locally cached browser driven by Playwright, no download needed) against the running stack, not from the stylesheet alone.

No design gap and no change request: the design states the strict boundary, the done-last order, ≥ 20 px and "no recurrence" correctly, so all five are implementation defects.

Acceptance suite now covers 002 (`tests/acceptance/002-due-dates/`: API/black-box tests, dependency-free UI checks, the browser measurement `ui-browser.mjs` and the load scenario `perf/load.mjs`); 001 + 002 run with `tests/acceptance/run.sh`. Report: `docs/validation/002-due-dates.md`, evidence in `docs/validation/002-due-dates/`. Requirements status set to "Changes requested – back to implementation"; committed as b8237b6 on feature/002-due-dates, no product code touched. Stack torn down (`docker compose -p tb-e1-ws down -v`).
