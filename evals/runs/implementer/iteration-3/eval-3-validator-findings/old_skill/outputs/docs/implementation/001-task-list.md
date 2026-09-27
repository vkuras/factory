# 001 – Task list: implementation

- Requirements: docs/requirements/001-task-list.md
- Design: docs/architecture/001-task-list.md
- Status: Ready for validation
- Branch: feature/001-task-list, commits a1b2c3d..e4f5a6b
- Date: 2026-08-18
- Round: 1

## What was built
1. **Store and validation**: `src/store.js` keeps the tasks in memory and writes `${DATA_DIR}/tasks.json` on every change; `src/validation.js` holds R1. Unit tests in `test/`.
2. **API**: `src/app.js` with `/health` and the four `/api/tasks` routes, plus static file serving for the UI.
3. **UI**: `public/index.html`, `public/style.css`, `public/app.js`. One screen, single column.
4. **Container and stack**: `Dockerfile` (node:22-alpine, health check) and `docker-compose.yml` with the `taskdata` volume and a 256 MB limit.

## How to run
```
cp .env.example .env
docker compose up -d
```
The UI is at http://localhost:8080 (change `PORT` in `.env`). There is no seed data and there are no test users.

## Traceability
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S1.1 | src/app.js POST /api/tasks | tests/acceptance/001-task-list/tasks.test.js::"S1.1 adds a task and returns it as not done" | Passed |
| S1.2 | src/validation.js | ...::"S1.2 rejects an empty title with a message" | Passed |
| S1.3 | src/validation.js | ...::"S1.3 rejects a title longer than 200 characters" | Passed |
| S2.1 | src/store.js list() | ...::"S2.1 lists the newest open task first" | Passed |
| S2.2 | public/app.js empty state | Manual check 6 | Passed |
| S3.1 | src/app.js PATCH | ...::"S3.1 marks a task as done" | Passed |
| S3.2 | src/store.js list(), public/style.css | ...::"S3.2 sorts done tasks below open ones" | Passed |
| S4.1 | src/app.js DELETE | ...::"S4.1 deletes a task" | Passed |
| S4.2 | src/app.js DELETE | ...::"S4.2 reports deleting a task that does not exist" | Passed |
| R1 | src/validation.js | test/validation.test.js (5 tests) | Passed |
| R2 | taskdata volume | Self-validation 6 | Passed |
| R3 | one shared list | – | Passed by construction |
| QE1 | public/style.css | Self-validation 7 | Passed: 18 px text, 44 px tap targets |
| QE2 | docker-compose.yml mem_limit | Self-validation 8 | Passed: 41 MB in use |
| QE3 | public/, API messages | ...::"QE3 serves the UI in English" | Passed |
| QE4 | in-memory list | Self-validation 9 | Passed: 6 ms |
| Out of scope: accounts | Not built | – | – |
| Out of scope: several lists | Not built | – | – |
| Out of scope: notifications | Not built | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Syntax | `node --check src/*.js` | Passed | |
| 2 | Unit tests | `npm test` | Passed: 10 passed, 0 failed, 0 skipped | |
| 3 | Image builds | `docker compose build` | Passed | |
| 4 | Stack starts | `docker compose up -d` | Passed: app healthy after 6 s | |
| 5 | Acceptance tests | `tests/acceptance/run.sh` | Passed: 11 passed, 0 failed | |
| 6 | R2 restart | `docker compose down && docker compose up -d` | Passed: the three tasks were still there | |
| 7 | QE1 phone | Browser at 390x844 | Passed: single column, 18 px text, checkbox 24 px in a 44 px row | |
| 8 | QE2 memory | `docker stats --no-stream` | Passed: 41 MiB / 256 MiB | |
| 9 | QE4 speed | `curl -w %{time_total}` on GET /api/tasks with 200 tasks | Passed: 6 ms | |

### Not run
None.

## Implementation choices
- The static file handler lives in `app.js` rather than in its own module: it is 8 lines and only 001 uses it.
- `writeFileSync` instead of an async write, so a response is never sent before the change is on disk (R2).

## Tests changed
None.

## Open gaps
None.

## Validator findings
### Round 1
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| – | – | No findings in round 1 | |
