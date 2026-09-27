# Taskboard – architecture

## System context
Taskboard is a single self-hosted web application. Team members open it in a browser on the office network, on a phone or a laptop. There are no other systems: no identity provider, no external API, no outbound calls.

## Hard constraints
- Runs on the team's own office machine with 4 GB of RAM, shared with other software (001 QE2).
- Starts with one command, operated by a non-developer (001 stakeholder constraints).
- The task list survives restarts (001 R2).
- No accounts, no roles (001 out of scope).

## Stack
- Node.js 22 with the standard library only. No runtime dependencies, so an install on the office machine never breaks on a package registry and the image stays small.
- The browser UI is plain HTML, CSS and JavaScript served by the same process. A framework would add a build step for four screens' worth of markup.
- Tests use the built-in `node:test` runner, for the same reason.

## Components
| Component | Responsibility |
|---|---|
| `src/server.js` | Process entry point: reads the configuration, creates the store and starts the HTTP server. |
| `src/app.js` | HTTP request handling: the JSON API under `/api`, `/health`, and the static files of the UI. |
| `src/store.js` | Holds the tasks in memory and writes them to a JSON file on every change. |
| `src/validation.js` | The business rules on a task's fields, shared by the API and the tests. |
| `src/dates.js` | The due-date rules: the team's day, the date format and the overdue state. |
| `public/` | The browser UI, served as static files. |

## Data model
One entity, stored as a JSON array in `${DATA_DIR}/tasks.json`.

| Field | Type | Meaning |
|---|---|---|
| `id` | integer | Stable identifier, assigned in ascending order. |
| `title` | string | The task text, trimmed, 1–200 characters (R1). |
| `done` | boolean | Whether the task is finished. |
| `dueDate` | string or null | The day the task is due, as YYYY-MM-DD (002). |

## Deployment and runtime
One container (`app`) in a docker compose stack, published on `${PORT}` (8080 by default). The task data lives in the named volume `taskdata` mounted at `/data`, which is what makes R2 hold across `docker compose down` and `up`. The container has a memory limit of 256 MB, which leaves the 4 GB machine to its other work.

## Conventions
- Configuration comes from environment variables with defaults, documented in `.env.example`.
- The API answers with JSON; errors are `{ "error": "<message in English>" }` with a 4xx status.
- Unit tests live in `test/`, black-box acceptance tests in `tests/acceptance/<requirements folder>/`, run by `tests/acceptance/run.sh` against a started stack.

## Design index
| # | Title | Design |
|---|---|---|
| 001 | Task list | docs/architecture/001-task-list.md |
| 002 | Due dates and overdue tasks | docs/architecture/002-due-dates.md |
