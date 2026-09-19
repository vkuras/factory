# 002 – Overdue tasks: design

- Requirements: docs/requirements/002-overdue-tasks.md
- Status: Designed – ready for implementation
- Date: 2026-09-16
- Architecture: docs/architecture/overview.md

## Summary
The API computes the overdue working days per open task on every list request (pure function, Europe/Berlin "today" from an injectable clock) and returns them with the label text. `GET /api/tasks?filter=overdue` filters and sorts on the server. The UI shows the label and a filter checkbox. No schema change.

## Drivers and constraints
| Driver | Source | In numbers | How the design meets it | Verified by |
|---|---|---|---|---|
| Speed | QE2 | 1,000 open tasks, 10 concurrent users, p95 ≤ 300 ms | One indexed query, O(n) computation in memory, no N+1 | Load test T-LOAD-1 |
| RAM | QE3 | ≤ 1 GB total | Unchanged limits: 832 MB total | `docker stats` during T-LOAD-1 |
| Correct "today" | R1 | Europe/Berlin | `Intl.DateTimeFormat` with timeZone Europe/Berlin | Unit tests |

## Decisions
- Compute on the server, not in the browser (left to architecture): one source of truth for the label and the sort order, and testable with an injectable clock.
- Compute on read instead of storing N: N changes every day without any write.
- Clock override `APP_FAKE_NOW` (ISO 8601 instant, empty in production) so that tests and validation can fix "today".

## Components
- `api/src/clock.js` (new): `now()` returns `new Date(APP_FAKE_NOW)` when the variable is set and non-empty, otherwise `new Date()`.
- `api/src/overdue.js` (new, pure): `todayInBerlin(instant) → 'YYYY-MM-DD'`, `overdueWorkingDays(dueDate, today) → integer ≥ 0`, `overdueLabel(n) → string | null`.
- `api/src/tasks.js` (changed): every task DTO gets `overdueDays` and `overdueLabel`; the list endpoint gets the filter.
- `web/public/*` (changed): label and filter.

## Data model
No change. The existing index `tasks_open_due_idx (done, due_date)` serves the list query.

## Interfaces
- `GET /api/tasks` (changed): every task additionally has `overdueDays` (integer ≥ 0; 0 = not overdue; always 0 for done tasks) and `overdueLabel` (string per R2, or null when `overdueDays` is 0). Sort order unchanged (`due_date ASC NULLS LAST, id ASC`).
- `GET /api/tasks?filter=overdue` (new): only open tasks with `overdueDays ≥ 1`, sorted by `overdueDays DESC`, then `dueDate ASC`, then `id ASC` (R3). Any other value of `filter` → 400 `{ "error": "Unbekannter Filter." }`.
- `POST /api/tasks` and `POST /api/tasks/:id/done`: responses include the two new fields.
- The server reads "now" once per request from `clock.now()`.

## Business rules
- R1 `overdueWorkingDays(dueDate, today)`: if `dueDate` is null or `dueDate >= today` → 0. Otherwise count the dates d with `dueDate < d ≤ today` whose weekday is Monday–Friday. Iterate over UTC midnights of the calendar dates, so that DST does not shift days. `today = todayInBerlin(clock.now())`.
  Test cases: the five examples of R1, plus: due Fri → today Sun = 0; due Sat → today Mon = 1; due Fri 4 Sep → today Mon 14 Sep = 6; `todayInBerlin(2026-09-14T23:30Z)` = 2026-09-15; `todayInBerlin(2026-09-14T21:59Z)` = 2026-09-14 (CEST, UTC+2); `todayInBerlin(2026-12-31T23:30Z)` = 2027-01-01 (CET, UTC+1).
- R2 `overdueLabel(n)`: n < 1 → null; n = 1 → "Überfällig seit 1 Arbeitstag"; n ≥ 2 → "Überfällig seit ${n} Arbeitstagen".
- R3 as in Interfaces.

## User interface
- Above the list: a checkbox with the label "Nur überfällige" (`id="only-overdue"`), off by default, not persisted. Changing it reloads the list with or without `?filter=overdue`.
- In each list item after the due date: `<span class="overdue">` with `overdueLabel`, only when it is not null. Style: color `#c62828`, `font-size: 1rem` (16 px, QE1), `font-weight: 600`.
- Empty state (existing "Keine offenen Aufgaben.") also applies to the filtered list.

## Deployment and runtime
### Compose stack
Only change: `api` gets the environment variable `APP_FAKE_NOW: ${APP_FAKE_NOW:-}`. Add `APP_FAKE_NOW=` with a comment to `.env.example`. Everything else unchanged.

### Resource budget
Unchanged: db 512 MB, api 256 MB, web 64 MB = 832 MB ≤ 1 GB.

## Test strategy
- Unit (`api/test/overdue.test.js`): all R1 and R2 cases above.
- API integration via the running stack: filter, sort order (R3), 400 on unknown filter, done tasks never overdue — as part of self-validation with `APP_FAKE_NOW=2026-09-14T10:00:00Z`.
- T-LOAD-1: k6 (`grafana/k6` image, on the compose network), seed 1,000 open tasks (half overdue) through the API, 10 VUs, 2 minutes, each VU alternates `GET /api/tasks` and `GET /api/tasks?filter=overdue` with 1 s think time. Pass: p95 ≤ 300 ms, 0 % errors, every container below its memory limit (`docker stats`).

## Build order
1. `clock.js`, `overdue.js` and their unit tests.
2. API fields and filter.
3. UI label and filter.
4. Compose/env change and T-LOAD-1.

## Assumptions
- The filter state is not persisted across page loads (the requirements don't ask for it).

## Requirement conflicts
None.

## Traceability
| Requirement | Design element | Verified by |
|---|---|---|
| S1.1 | overdueLabel in DTO, span.overdue | Unit R2, API check, UI check |
| S1.2 | overdueWorkingDays = 0 cases | Unit R1 |
| S1.3 | span.overdue color #c62828 | UI check |
| S2.1 | ?filter=overdue | API check |
| S2.2 | Sort overdueDays DESC | API check |
| S2.3 | Unchanged default sort | 001 acceptance tests |
| R1 | overdueWorkingDays, todayInBerlin | Unit tests |
| R2 | overdueLabel | Unit tests |
| R3 | Filter sort | API check |
| QE1 | font-size 1rem | UI check |
| QE2 | Indexed query, compute on read | T-LOAD-1 |
| QE3 | Memory limits | docker stats in T-LOAD-1 |
| Left to architecture: where computed | Server | – |
| Out of scope: notifications | Not built | – |
| Out of scope: snoozing | Not built | – |
| Later: public holidays | Not built | – |
