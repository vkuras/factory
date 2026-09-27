**Verdict: Changes requested** – 002 goes back to the implementer. Report: `docs/validation/002-due-dates.md` (round 2), commit `d104aad` on `main`.

**Round-1 findings**
- F1 (due today shown as overdue) – **fixed**, verified with its own repro steps: `X-Today: 2026-09-19` on a task due 2026-09-19 returns `"dueState":"due-today"`, UI shows "Due today".
- F3 (undated tasks before dated ones) – **fixed**, verified: `GET /api/tasks` returns `["dated one", "undated one"]`.
- F2 (no state word on upcoming tasks) – **withdrawn**. The implementer is right: S6.3 asks for the day "without an overdue or due-today marking". The round-1 expectation was validator taste, not a requirement.

**New: F4, blocking (regression)** – the round-2 rewrite of the comparator in `src/store.js` `list()` dropped the done/open grouping. Done tasks are no longer below the open ones (001 S3.2), and the design of 002 explicitly required that grouping to survive ("open tasks first and done tasks last, exactly as 001 S3.2 requires"). Worst case: a ticked-off task with an early due date renders as the **first** row of the list (`docs/validation/002-due-dates/list-phone.png`). The unit suite stayed green because `test/store.test.js` lost its S3.2 test when it was replaced by the two due-date tests — that coverage needs restoring too.

**Regression**: unit tests 19/19 green; acceptance 001 **10/11** (S3.2 fails), acceptance 002 **15/16** (new cross-check "S6.5 keeps done tasks below open ones when both have due dates" fails). Both red tests point at F4 only. The implementer's self-validation ran only the 002 folder, which is why this was missed.

**Everything else passed**, measured on a fresh `tb-e3-ws` stack on port 8130: S5.1–S5.5, S6.1–S6.5 (due-date order itself), R4 (server `today()` = 2026-09-19 Europe/Berlin), R5 incl. leap years and 2026-13-01, R6 (a legacy record without a `dueDate` key written into the volume lists as `none` and can be ticked off), QE5 (title and marking both 20 px on a 390x844 phone, read with `getComputedStyle`), QE6 (the word in all four states), QE7 (one line of inputs, one button), plus the product-wide constraints with 002 included: persistence across `down`/`up`, 30.2 MiB of 256 MiB under 8 parallel clients, healthy after ~7 s, GET/POST p95 ≤ 6 ms with 100 tasks. All three out-of-scope items are absent. Nothing unverified.

**Acceptance tests added** (`tests/acceptance/002-due-dates/`): the done/open cross-check above, an S5.4 case that an invalid date on PATCH leaves the task unchanged, and an R6 case. UI was checked with a headless Chromium from the local Playwright cache (npm registry unreachable, so `npx playwright install` was not possible — an already cached chromium-1234 headless shell was used).

Requirements status set to `Changes requested – back to implementation`. Stack torn down.
