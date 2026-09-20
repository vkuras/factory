# 001 – Task list: design

- Requirements: docs/requirements/001-task-list.md
- Status: Implemented
- Date: 2026-08-16

## Summary
A single Node.js process serves both the JSON API and the browser UI, and keeps the tasks in a JSON file on a volume. This is the smallest shape that satisfies the MVP and the "one command, small machine" constraints.

## Drivers and constraints
- One command to start, on a 4 GB machine (QE2): one container, no database server.
- The list survives restarts (R2): a named volume and a synchronous write on every change.
- Instant feel (QE4): the whole list is in memory, so a read is a sort of a small array.
- Phone use (QE1): a single-column layout, 18 px body text and tap targets of at least 44 px.

## Decisions
- ADR-0001: a JSON file instead of a database. The list is at most a few hundred rows and one process owns it.
- The done state is a boolean, not a timestamp: no requirement asks when something was finished.

## Components
As in the overview. 001 introduces all of them.

## Data model
As in the overview.

## Interfaces
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/health` | – | `200 {"status":"ok"}` |
| GET | `/api/tasks` | – | `200 {"tasks":[Task]}`, sorted (see Business rules) |
| POST | `/api/tasks` | `{"title":string}` | `201 Task`, or `400 {"error":...}` |
| PATCH | `/api/tasks/:id` | `{"done":boolean}` | `200 Task`, `400`, or `404 {"error":...}` |
| DELETE | `/api/tasks/:id` | – | `204`, or `404 {"error":...}` |

## Business rules
- R1 is implemented once in `src/validation.js` and used by `POST /api/tasks`.
- The list order (S2.1, S3.2) is computed in `store.list()`: open tasks before done tasks, and within each group the highest `id` first.
- R3 needs no code: there is one file and one list.

## User interface
One screen. A heading, the add form (one text field and a button), an error line that appears only after a rejected submit, and the task list. Each row has a checkbox, the title and a delete button. Done rows are struck through and greyed. The empty state shows "No tasks yet." Body text is 18 px, buttons and checkboxes are at least 44 px high (QE1).

## Cross-cutting concerns
- Errors: every 4xx carries an English message that the UI shows verbatim.
- Logging: one line on start. Nothing per request, because nothing reads it.
- Security: no accounts by decision; the product is reachable only on the office network. Static file serving rejects paths that leave `public/`.

## Deployment and runtime
### Compose stack
| Service | Image | Ports | Volumes | Limits |
|---|---|---|---|---|
| app | built from `./Dockerfile` | `${PORT:-8080}:8080` | `taskdata:/data` | 256 MB |

The container has a health check on `/health`, so `docker compose up -d` can be followed by a wait for "healthy".

### Resource budget
The single container is limited to 256 MB, which fits QE2 with a wide margin on a 4 GB machine.

## Test strategy
- Unit tests for `validation.js` and `store.js` in `test/`.
- Black-box acceptance tests per requirements document in `tests/acceptance/`, run over HTTP against the started stack. They are the regression suite.

## Build order
1. Store and validation with their unit tests.
2. The API.
3. The UI.
4. The container and the compose stack.

## Assumptions
- A few hundred tasks at most, so sorting the whole list on every read is free.
- One process writes the file, so no locking is needed.

## Requirement conflicts
None.

## Traceability
| Requirement | Design element |
|---|---|
| S1.1–S1.3 | `POST /api/tasks`, `validation.js`, the add form |
| S2.1, S2.2 | `GET /api/tasks`, `store.list()`, the empty state |
| S3.1, S3.2 | `PATCH /api/tasks/:id`, the sort order, the struck-through row |
| S4.1, S4.2 | `DELETE /api/tasks/:id` |
| R1 | `validation.js` |
| R2 | the `taskdata` volume, the write on every change |
| R3 | one list, no per-user state |
| QE1 | single-column UI, 18 px text, 44 px tap targets |
| QE2 | one container, 256 MB limit |
| QE3 | all UI texts in English |
| QE4 | in-memory list |
