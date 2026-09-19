# 002 – Due dates and overdue tasks: validation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Implementation report: docs/implementation/002-due-dates.md
- Verdict: Changes requested
- Round: 1
- Validated commit: 04fd712 on feature/002-due-dates
- Date: 2026-09-19

## Summary
Changes requested: five findings are open, four of them blocking. The core boundary rule R4 is
inverted (a task due today is reported as overdue, S6.2), an out-of-scope feature (recurring tasks)
is built into the UI, the API and the stored data, the phone text is 14 px where QE5 demands at
least 20 px, and 001 S3.2 has regressed – done tasks now sort above open ones. Everything else
passed: the stack starts with one command, the data survives a restart, memory stays at 33 MiB of
the 256 MiB limit, and 10 concurrent users see a p95 of 6.5 ms. Nothing is unverified.

## Open findings

### F1 – A task due today is marked as overdue
- Requirement: S6.2 – "Given a task whose day is today, when I open the list, then the task is marked as due today and is **not** marked as overdue. The day is not over yet."; R4 – "A task is **overdue** when its day lies **before** today … Example, with today being 2026-09-19: a task for 2026-09-18 is overdue, a task for 2026-09-19 is due today, a task for 2026-09-20 is neither."
- Severity: blocking
- Classification: implementation (the design is correct: §Business rules says "`overdue` when the day is strictly before the reference day")
- Steps to reproduce:
  1. Fresh stack: `cp .env.example .env && docker compose up -d`
  2. `curl -X POST -H 'Content-Type: application/json' -d '{"title":"today task","dueDate":"2026-09-19"}' http://localhost:8110/api/tasks`
  3. `curl -H 'X-Today: 2026-09-19' http://localhost:8110/api/tasks`
- Expected: the task is returned with `"dueState":"due-today"` and the row reads "Due today 2026-09-19".
- Actual: `{"id":2,"title":"today task","dueDate":"2026-09-19","dueState":"overdue"}` – the row reads
  "Overdue 2026-09-19" in red (screenshot `docs/validation/002-due-dates/screens-phone.png`, second row,
  measured in `ui-measurements.json`). `src/dates.js:33` compares with `<=`, which also makes the
  `due-today` branch on line 34 unreachable, so the state never occurs. The unit test
  `test/dates.test.js::"R4 marks a task due today as overdue"` asserts exactly this wrong behaviour,
  which is why the implementer's traceability table reports S6.2 as passed.
- Test: tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 marks a task due today as due today and not as overdue" and ::"R4 boundary: yesterday, today and tomorrow get three different states"
- Status: Open (round 1)

### F2 – Regression: done tasks are no longer below the open ones
- Requirement: 001 S3.2 – "Given done and open tasks exist, when I open the list, then done tasks are shown below the open ones and are visibly struck through." (001 is Validated and stays in force; the 002 design repeats it: "open tasks first and done tasks last, exactly as 001 S3.2 requires; within each of those two groups, the soonest due date first")
- Severity: blocking
- Classification: implementation
- Steps to reproduce:
  1. Fresh stack: `docker compose up -d`
  2. `curl -X POST -H 'Content-Type: application/json' -d '{"title":"r-open-later","dueDate":"2026-12-01"}' http://localhost:8110/api/tasks`
  3. `curl -X POST -H 'Content-Type: application/json' -d '{"title":"r-done-soonest","dueDate":"2026-09-01"}' http://localhost:8110/api/tasks`
  4. Mark the second task done: `curl -X PATCH -H 'Content-Type: application/json' -d '{"done":true}' http://localhost:8110/api/tasks/<id>`
  5. `curl http://localhost:8110/api/tasks`
- Expected: "r-open-later" (open) comes before "r-done-soonest" (done).
- Actual: the done task is first, because `src/store.js:20-29` sorts by due date only and no longer
  groups by `done`. It also happens without due dates at all whenever an older task is still open:
  the 001 acceptance test "S3.2 sorts done tasks below open ones" fails on this build. The
  implementation report's self-validation #5 claims "11 passed, 0 failed" for the acceptance suite;
  re-running it on this commit gives 10 passed, 1 failed for 001. The unit test that covered this
  ("S3.2 sorts done tasks to the bottom") was deleted rather than extended (report §Tests changed),
  so `npm test` stays green.
- Test: tests/acceptance/001-task-list/tasks.test.js::"S3.2 sorts done tasks below open ones" and tests/acceptance/002-due-dates/due-dates.test.js::"S6.5 + 001 S3.2 keeps done tasks below open ones even with due dates"
- Status: Open (round 1)

### F3 – Recurring tasks are built, although they are out of scope
- Requirement: 002 §Out of scope – "**Recurring tasks** ("every Monday", "every month"). The stakeholder considered it and decided against it for now: "that is a different thing, it needs a whole discussion about what happens when you tick it off.""
- Severity: blocking
- Classification: implementation (the design has no `repeat` field and lists recurring tasks as "Not designed, no field, no UI")
- Steps to reproduce:
  1. Fresh stack: `docker compose up -d`
  2. Open http://localhost:8110/ – the add form shows a checkbox labelled "Repeat weekly"
     (`public/index.html`, evidence `docs/validation/002-due-dates/screens-phone.png`).
  3. `curl -X POST -H 'Content-Type: application/json' -d '{"title":"standup","dueDate":"2026-09-21","repeat":"weekly"}' http://localhost:8110/api/tasks`
- Expected: no recurrence anywhere – no control in the UI, no field in the API, nothing stored.
- Actual: the API answers `{"id":5,"done":false,"title":"standup","dueDate":"2026-09-21","repeat":"weekly"}`,
  every task carries a `repeat` key (`src/app.js:58-59`), and the value is written to `tasks.json`
  and survives a restart. Nothing acts on it, so the product now shows the team a promise it does
  not keep, and it writes a field into the stored data that the agreed scope does not contain.
- Test: tests/acceptance/002-due-dates/due-dates.test.js::"Out of scope: recurring tasks are not part of the product" and tests/acceptance/002-due-dates/ui.test.js::"Out of scope: the UI offers no recurring tasks"
- Status: Open (round 1)

### F4 – Phone text is 14 px, not the required 20 px
- Requirement: QE5 – "The list is read from a step away, standing, on a phone. On a phone screen, a task's title and its due-date marking are large enough to read from that distance: at least 20 px." (the design derives: "Title and marking are at least 20 px on a phone viewport (QE5), which raises the row text from the 18 px of 001")
- Severity: blocking
- Classification: implementation
- Steps to reproduce:
  1. Fresh stack with a few tasks, one of them with a due date.
  2. Open http://localhost:8110/ in a browser at a phone viewport of 390x844.
  3. Read the computed font size of `li .title` and `li .due`.
- Expected: at least 20 px for both, on the phone viewport.
- Actual: title 14 px and marking 14 px on 390x844; on the desktop viewport the title is 18 px and the
  marking 14 px. `public/style.css` sets `.due { font-size: 14px }` and, in the `@media (max-width: 480px)`
  block, `li .title { font-size: 14px }` – on a phone the list text is *smaller* than the 18 px of 001,
  the opposite of what QE5 and the design ask for. Evidence: `docs/validation/002-due-dates/ui-measurements.json`
  (measured with `getComputedStyle` in Chromium) and `docs/validation/002-due-dates/screens-phone.png`.
- Test: tests/acceptance/002-due-dates/ui.test.js::"QE5 the phone stylesheet does not shrink the title or the marking below 20 px", measured by tests/acceptance/002-due-dates/ui-browser.mjs
- Status: Open (round 1)

### F5 – The add form is no longer one row on a phone
- Requirement: QE7 – "Adding a day must not make adding a task slower to do: the add form stays one line of inputs and one button."
- Severity: minor
- Classification: implementation
- Steps to reproduce:
  1. Fresh stack, open http://localhost:8110/ at 390x844.
  2. Look at the add form / read the `top` offsets of its children.
- Expected: one line of inputs and one button.
- Actual: two lines. The title field and the date input sit at y=97, while the "Repeat weekly" label
  and the "Add task" button wrap to y=147 (`@media (max-width: 480px) { form { flex-wrap: wrap } }`).
  The extra control is the out-of-scope recurrence of F3; removing it will probably restore the single
  row, but please re-measure at 390 px width after the fix. Evidence:
  `docs/validation/002-due-dates/ui-measurements.json` (`phone.controls`, `phone.formRowCount: 2`).
- Test: tests/acceptance/002-due-dates/ui.test.js::"QE7 the add form has one row of inputs and one button"
- Status: Open (round 1)

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance test "S5.1 creates a task with a day and shows the day in the list" | Passed | |
| S5.2 | Acceptance test "S5.2 creates a task without a day" | Passed | |
| S5.3 | Acceptance test "S5.3 sets a day on a task that has none" (PATCH) | Passed | |
| S5.4 | 6 invalid days on POST (2026-13-01, 2026-02-30, 19.09.2026, 2026-9-1, tomorrow, 2026-09-19T10:00:00Z) + an invalid PATCH that must not change the task | Passed: 400 with a message naming the date | |
| S5.5 | Acceptance test "S5.5 accepts a day that already passed" | Passed: 201 with the past day | |
| S6.1 | Acceptance test "S6.1 marks a task whose day is before today as overdue" (X-Today 2026-09-19) | Passed | |
| S6.2 | Acceptance test "S6.2 marks a task due today …" + R4 boundary test | **Failed → F1** | ui-measurements.json, screens-phone.png |
| S6.3 | Acceptance test "S6.3 shows a task after today without a marking" | Passed: dueState "upcoming", row reads "Due 2026-09-25" | |
| S6.4 | Acceptance test "S6.4 shows no day and no marking" | Passed: dueState "none", empty marking | |
| S6.5 | Acceptance test "S6.5 orders open tasks by day …" | Passed within the open tasks; the grouping by done is broken → F2 | |
| R4 | Boundary 2026-09-18 / -19 / -20 with X-Today, plus the same without the header against the server's Europe/Berlin day | **Failed → F1** (18 → overdue ok, 19 → overdue wrong, 20 → upcoming ok) | |
| R5 | The 6 invalid days above + valid 2026-09-19 | Passed | |
| R6 | Tasks without a day next to dated ones: listed, patchable, dueState "none"; 001 tasks stored without the key read as null | Passed | |
| QE5 (≥ 20 px on a phone) | `getComputedStyle` in Chromium at 390x844 | **Failed → F4**: title 14 px, marking 14 px | ui-measurements.json, screens-phone.png |
| QE6 (word, not only colour) | Rendered rows: "Overdue 2026-09-18", "Due 2026-09-25"; `DUE_LABELS` carries "Overdue"/"Due today" | Passed (the "Due today" label is unreachable until F1 is fixed) | ui-measurements.json |
| QE7 (one row of inputs + one button) | Bounding boxes of the form children at 390x844 | **Failed → F5**: 2 rows, 3 controls + 1 button | ui-measurements.json |
| Out of scope: recurring tasks | UI, API and stored data checked for a recurrence | **Failed → F3** | screens-phone.png |
| Out of scope: reminders/notifications | UI text and API surface, grep for outbound calls (mail, http) | Passed: none | |
| Out of scope: times of day | POST "2026-09-20T15:00" | Passed: 400 | |
| 001 S1.1–S1.3, S2.1, S3.1, S4.1, S4.2, QE3 | 001 acceptance suite | Passed (10 of 11) | |
| 001 S3.2 (done tasks below open) | 001 acceptance suite | **Failed → F2** | |
| 001 R2 (survives a restart) | `docker compose down` + `up` without `-v`, task with a due date created before | Passed: the task and its day came back | |
| 001 QE1 (phone, tap targets) | Rendered control sizes at 390x844 | Passed: add button 44 px, inputs 42 px, row checkbox 24 px (the text size is F4) | ui-measurements.json |
| 001 QE2 (4 GB machine, one command) | `docker compose up -d`, `docker stats` during the load run, `docker inspect` | Passed: healthy 1 s after `up`, 18–30 MiB of the 256 MiB limit, OOMKilled false, 0 restarts | |
| 001 QE4 (well under a second) | 10 concurrent users, 10 rounds each (list, add, tick off, delete) with think time, 400 requests | Passed: p50 2.1 ms, p95 6.5 ms, max 26.7 ms, 0 errors | perf-summary.txt, tests/acceptance/002-due-dates/perf/load.mjs |
| 001 QE3 / 002 language | All rendered texts English, no placeholder keys | Passed | screens-desktop.png |
| Security/privacy | `.env` untracked, no secrets in the repo, only the app port published, no outbound calls in src/ or public/ | Passed | |

## Regression
- Full unit test suite (`npm test`): 19 passed, 0 failed, 0 skipped. Note that it is green while F1 and
  F2 exist, because `test/dates.test.js` asserts the wrong boundary and the store test for 001 S3.2 was
  deleted instead of extended.
- Acceptance tests 001-task-list: 10 passed, 1 failed (S3.2 → F2).
- Acceptance tests 002-due-dates: 18 passed, 6 failed (F1 x2, F2, F3 x2, F4, F5 – counted per test).
- Product-wide constraints re-checked with 002 included: restart persistence (001 R2) passed, memory
  33 MiB of 256 MiB under load (001 QE2) passed, latency p95 6.5 ms at 10 concurrent users (001 QE4) passed.

## Not verified
None. The UI measurements were taken in a real browser (Playwright driving a locally cached Chromium
against the stack on port 8110), not from the stylesheet alone.

## Observations
- The implementation report's traceability table names the test
  `test/dates.test.js::"R4 marks a task due today as overdue"` as the proof for S6.2. The test name
  itself contradicts the requirement; a test whose name restates the requirement wrongly cannot prove it.
- Self-validation #5 of the implementation report ("Acceptance tests (001 + 002) … 11 passed, 0 failed,
  regression of 001 is green") does not reproduce on this commit: 001 S3.2 fails. Please re-run
  `tests/acceptance/run.sh` before the next handover.
- `X-Today` is accepted without validation: `curl -H 'X-Today: banana' …` labels every dated task
  "overdue". No requirement covers the header (it is a test hook and read-only), so this is not a
  finding, but rejecting a malformed value would make it harder to misread a response.

## Closed findings
None yet.
