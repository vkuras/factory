# 002 – Due dates and overdue tasks: implementation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Status: Ready for validation
- Branch: feat/002-due-dates, commits b4998ce..8bdbd3a
- Date: 2026-09-20
- Round: 1

## What was built
All four build-order slices are complete.

1. **`src/dates.js`** (new): `today(override)` returns the day in Europe/Berlin, or a valid `override` (used for the `X-Today` header, ADR-0002); `validateDueDate(raw)` implements R5 (format + a round-trip check so `2026-02-30` is rejected); `dueState(dueDate, reference)` implements R4 (`overdue` / `due-today` / `upcoming` / `none`).
2. **`src/app.js`**: `POST /api/tasks` and `PATCH /api/tasks/:id` accept an optional `dueDate`, validated through `validateDueDate`. `GET /api/tasks` decorates every task with `dueState`, computed against `today(req.headers['x-today'])`. `PATCH` now updates whichever of `done`/`dueDate` is present instead of requiring `done`.
3. **`src/store.js`**: `list()` keeps open tasks above done ones (unchanged, 001 S3.2), and within each group orders by due day ascending, tasks without a day last, newest first as a tie-breaker (S6.5). A missing `dueDate` key (pre-002 records) is treated as `null` (R6).
4. **`public/`**: the add form gained a native date input between the title and the button (QE7). Each row shows a due-date input (to set/change/clear a day, S5.3) and a marking span after the title: "Overdue YYYY-MM-DD" (bold, red), "Due today YYYY-MM-DD" (bold), or the plain day for upcoming tasks; no marking when there is no day (S6.4). The word carries the meaning, colour only reinforces it (QE6). Title and marking are 20 px (QE5, up from 001's 18 px).

## How to run
```
cp .env.example .env
PORT=8101 docker compose -p tb-i1-e1-ws up -d --build
```
Open `http://localhost:8101`. No seed data; the list starts empty (or keeps whatever is in the `taskdata` volume from before). Tear down with `docker compose -p tb-i1-e1-ws down -v`.

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S5.1 | `POST /api/tasks` (src/app.js) | tests/acceptance/002-due-dates/due-dates.test.js::"S5.1 creates a task with a day..." | Passed |
| S5.2 | `POST /api/tasks` with `dueDate` omitted | ...::"S5.2 creates a task without a day..." | Passed |
| S5.3 | `PATCH /api/tasks/:id` with `dueDate` | ...::"S5.3 sets a day on a task that had none" | Passed |
| S5.4 | `validateDueDate()` (src/dates.js) | test/dates.test.js::"R5 rejects a day that is not..." / "...does not exist"; acceptance ...::"S5.4 rejects..." (×3) | Passed |
| S5.5 | `validateDueDate()` allows past days | test/dates.test.js::"S5.5 accepts a day that already passed"; acceptance ...::"S5.5 allows a day that has already passed" | Passed |
| S6.1 | `dueState()` | test/dates.test.js::"R4 a day before the reference is overdue"; acceptance ...::"S6.1 marks a task..." | Passed |
| S6.2 | `dueState()` | test/dates.test.js::"R4 a day equal to the reference is due today..."; acceptance ...::"S6.2 marks a task..." | Passed |
| S6.3 | `dueState()` | test/dates.test.js::"R4 a day after the reference is upcoming"; acceptance ...::"S6.3 marks a task..." | Passed |
| S6.4 | `dueState()` returns `none`; UI renders no marking | test/dates.test.js::"R4 a task without a day is none"; acceptance ...::"S6.4 a task without a day..." | Passed |
| S6.5 | `store.list()` order | test/store.test.js::"S6.5 orders open tasks by due date..." (×3); acceptance ...::"S6.5 orders open tasks by day..." | Passed |
| R4 | `dueState()` | test/dates.test.js R4 tests (4) | Passed |
| R5 | `validateDueDate()` | test/dates.test.js R5 tests (7) | Passed |
| R6 | optional field, missing key reads as null | test/store.test.js::"R6 treats a missing dueDate key like null..."; acceptance ...::"R6 a task added before this feature..." | Passed |
| QE5 | `li .title`, `li .due` at 20 px | Self-validation 5 (manual, browser, phone viewport) | Passed |
| QE6 | word + colour in the marking span | Self-validation 5 (manual, browser) | Passed |
| QE7 | one extra input in the add form's row | Self-validation 5 (manual, browser, phone viewport) | Passed |
| Out of scope: recurring tasks | Not built | – | – |
| Out of scope: reminders | Not built | – | – |
| Out of scope: times of day | Field is a day (YYYY-MM-DD), not a timestamp | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Build | `PORT=8101 docker compose -p tb-i1-e1-ws build` | Passed | Clean image build, no errors |
| 2 | Unit tests | `npm test` | Passed: 26 passed, 0 failed, 0 skipped (before this work: 22 passed, 0 skipped) | |
| 3 | Traceability | see table above | Passed | every row has an existing, green test |
| 4 | Stack starts | `docker compose -p tb-i1-e1-ws up -d`, `... ps`, `... logs` | Passed | container healthy in ~5 s; no errors in logs; fresh volume (no prior schema/migration needed, R6 means old records just read `dueDate` as `null`) |
| 5 | Use it like a user (API) | `curl` POST/GET/PATCH/DELETE against `localhost:8101`, with and without `X-Today` | Passed | `POST {title, dueDate:"2026-09-18"}` → 201 with `dueDate` set; `GET` with `X-Today: 2026-09-19` → `dueState:"overdue"` for that task |
| 5 | Use it like a user (UI) | Browser tool, phone-width viewport (386×863) and desktop | Passed | Added a task with a day, added one without, set a day on an existing dayless task via the row's date input, ticked a task done. Marking text and colours matched the design ("Overdue 2026-09-18" red bold, "Due today 2026-09-20" bold, plain day for upcoming, empty for none); order was soonest-first with no-day last, done tasks always at the bottom |
| 5 | Failure path | `curl POST {title:"x", dueDate:"2026-02-30"}` and `PATCH {dueDate:"not-a-date"}` | Passed | Both 400 with a message containing "date"; the PATCH left the task's existing `dueDate` unchanged (acceptance test) |
| 6 | Data survives | `docker compose -p tb-i1-e1-ws restart`, then `GET /api/tasks` | Passed | The three tasks created in step 5 (overdue, due-today, no-day, one marked done) were all present with their fields intact after the restart |
| 7 | Memory (QE2, hard constraint from 001, still applies) | `docker stats --no-stream` | Passed | 21.6 MiB / 256 MiB limit |
| 8 | Own diff review | `git diff d276ada..HEAD` | Passed, after one fix | No debug output, TODOs, secrets, or scope creep; one bug found and fixed (see below) |
| 9 | Tear down | `docker compose -p tb-i1-e1-ws down -v` | Passed | Container, volume and network removed |

Bug found during self-validation (own diff review + manual UI walkthrough): on a narrow phone viewport, adding the due-date input and marking to each row left too little space for the title, which then wrapped one character per line instead of by word. Fixed in commit 8bdbd3a by letting the row wrap onto multiple lines (`flex-wrap: wrap` plus a `min-width` floor on the title) instead of squeezing it; re-verified in the browser afterwards.

### Not run
- Load test / concurrency threshold: the design's drivers table and test strategy name none for 002 (QE4's "instant feel" is inherited from 001 and not changed by this feature; no new hard constraint was added). Not applicable.
- `docker buildx build --platform ...` for a non-default target architecture: no target architecture is specified anywhere in the design or `overview.md` beyond "runs on the office machine"; not applicable.

## Implementation choices
- `today(override)` lives in `dates.js` and treats an invalid or missing `X-Today` header the same as "no override": it falls back to the real day. This keeps `app.js` simple (one call, no separate validation branch) and matches ADR-0002 ("X-Today is read-only... nothing else"): a bad header cannot break the endpoint.
- Date comparisons use plain string comparison on `YYYY-MM-DD` values (both for `dueState` and for the list order), which is correct because that format sorts lexicographically the same as chronologically, and it avoids parsing dates for every list read.
- `PATCH /api/tasks/:id` now updates any combination of `done` and `dueDate` present in the body (previously `done` was mandatory). This was necessary for S5.3 (setting a day on an existing task without touching `done`) and matches the design's interface table (`PATCH` request: `{"done"?:boolean, "dueDate"?:string|null}`, both optional).
- The per-row date `<input type="date">` doubles as the affordance for S5.3 (setting a day) and for clearing one (emptying it sends `dueDate: null`, matching the design's `string|null` PATCH field). The design's "User interface" section didn't spell out the exact widget, so this was a developer-level UI decision.
- `li` uses `flex-wrap: wrap` so a row's due-date controls drop to their own line on a narrow phone instead of squeezing the title (see the self-validation fix above).

## Tests changed
None removed or weakened. `tests/acceptance/helpers.js::api()` gained an optional fourth parameter (`extraHeaders`) so acceptance tests can send `X-Today`; existing call sites are unaffected (the parameter defaults to `{}`).

## Open gaps
None.

## Validator findings
None yet (round 1).
