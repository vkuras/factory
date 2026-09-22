# 002 – Due dates and overdue tasks: design

- Requirements: docs/requirements/002-due-dates.md
- Status: Ready for implementation
- Date: 2026-09-12

## Summary
A task gets one new optional field, `dueDate`. The server derives a `dueState` for every task when it answers `GET /api/tasks`, so the browser never has to know what "today" is, and the boundary rule R4 lives in exactly one place. A new module `src/dates.js` holds the date rules.

## Drivers and constraints
- R4's boundary must be testable without waiting for midnight, so "today" has to be overridable from the outside.
- R6: existing tasks have no `dueDate`. The field is optional everywhere and old records stay readable.
- QE5/QE6: the marking is a word plus a colour, at a size that is readable on a phone.
- QE7: the add form gains one input and stays a single row.

## Decisions
- ADR-0002: "today" is computed on the server in Europe/Berlin, and can be pinned per request with the `X-Today` header for tests. A client-supplied day never changes stored data, only how the answer is labelled.
- `dueState` is derived on every read rather than stored, because it changes at midnight without anything happening in the product.

## Components
| Component | Change |
|---|---|
| `src/dates.js` | New. `today()`, `validateDueDate()` (R5) and `dueState()` (R4). |
| `src/app.js` | `POST`/`PATCH` accept `dueDate`; `GET` decorates every task with `dueState`. |
| `src/store.js` | The list order gains the due date (see Business rules). |
| `public/` | A date input in the form, and a marking per row. |

## Data model
The task gains one field:

| Field | Type | Meaning |
|---|---|---|
| `dueDate` | string or null | The day in the form YYYY-MM-DD, or null when the task has none (R5, R6). |

Tasks stored before this feature have no `dueDate` key; the code reads a missing key as null.

## Interfaces
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/tasks` | optional header `X-Today: YYYY-MM-DD` | `200 {"tasks":[Task & {dueState}]}` |
| POST | `/api/tasks` | `{"title":string, "dueDate"?:string\|null}` | `201 Task`, or `400 {"error":...}` |
| PATCH | `/api/tasks/:id` | `{"done"?:boolean, "dueDate"?:string\|null}` | `200 Task`, `400`, `404` |

`dueState` is one of `overdue`, `due-today`, `upcoming`, `none`.

## Business rules
- R4 lives in `dueState(dueDate, reference)`: `overdue` when the day is strictly before the reference day, `due-today` when it equals it, `upcoming` when it is after, `none` without a day. The strict comparison is the whole point of the rule: a task due today is not late.
- R5 lives in `validateDueDate()`: the format plus a round-trip check that the day exists.
- **List order** (S6.5) in `store.list()`: open tasks first and done tasks last, exactly as 001 S3.2 requires; within each of those two groups, the soonest due date first, tasks without a due date last, and the newest task first when two share a day. 002 refines the order inside the groups; it does not change that done tasks are at the bottom.

## User interface
The add form gains a native date input between the title field and the button, so a phone shows its own date picker, plus nothing else (QE7). Each row shows the marking after the title: "Overdue 2026-09-18" in red and bold, "Due today 2026-09-19", or the plain day. The word carries the meaning, the colour only reinforces it (QE6). Title and marking are at least 20 px on a phone viewport (QE5), which raises the row text from the 18 px of 001.

## Cross-cutting concerns
No change to logging, errors or security. `X-Today` only relabels a response and cannot write anything.

## Deployment and runtime
Unchanged: the same single container and volume. No migration is needed because a missing field reads as null.

## Test strategy
- Unit tests for `dates.js`, including both sides of the R4 boundary and the invalid dates of R5.
- Acceptance tests drive the boundary through `X-Today`, so the result does not depend on the day the suite runs.

## Build order
1. `src/dates.js` with its unit tests.
2. The API fields and `dueState`.
3. The list order.
4. The UI.

## Assumptions
- The team is in one time zone.

## Requirement conflicts
None.

## Traceability
| Requirement | Design element |
|---|---|
| S5.1, S5.2, S5.5 | `POST /api/tasks` with the optional `dueDate` |
| S5.3 | `PATCH /api/tasks/:id` with `dueDate` |
| S5.4 | `validateDueDate()` |
| S6.1–S6.4 | `dueState()`, the marking in the row |
| S6.5 | the order in `store.list()` |
| R4 | `dueState()` |
| R5 | `validateDueDate()` |
| R6 | optional field, missing key reads as null |
| QE5 | 20 px title and marking on a phone viewport |
| QE6 | the word plus the colour |
| QE7 | one extra input in the same row |
| Out of scope: recurring tasks | Not designed, no field, no UI |
| Out of scope: reminders | Not designed |
| Out of scope: times of day | The field is a day, not a timestamp |
