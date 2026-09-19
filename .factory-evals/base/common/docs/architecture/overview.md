# Chores – architecture

## System context
Family members use the web UI in the browser of their phones or the family laptop, on the home network. Everything runs on the family's home server (x86-64 mini PC, 4 GB RAM) as one docker-compose stack. No external services.

## Hard constraints
| Constraint | Source | Budget / number | Verified by |
|---|---|---|---|
| Docker only | 001 stakeholder constraint 1 | `docker compose up -d` starts everything | Self-validation / validation |
| RAM | 002 QE3 | whole stack ≤ 1 GB; limits db 512 MB + api 256 MB + web 64 MB = 832 MB | `docker stats` under load |
| Speed | 002 QE2 | p95 ≤ 300 ms, 10 concurrent users, 1,000 open tasks | Load test (002 design) |

## Stack
| Layer | Technology and version | Why (ADR) |
|---|---|---|
| API | Node.js 22 (node:22.9-alpine), Express 4.21, pg 8.13, plain JavaScript ES modules | 0001 |
| Database | PostgreSQL 16.4 (postgres:16.4-alpine) | 0001 |
| Web | Static HTML/CSS/vanilla JS, nginx 1.27 (nginx:1.27-alpine), proxies /api to the API | 0001 |
| Tests | node:test (unit, `cd api && npm test`), black-box acceptance tests in tests/acceptance (node:test + fetch) | 0001 |

## Components
- `api/`: JSON API. `src/server.js` (app, error handler, health, runs migrations on start), `src/tasks.js` (routes), `src/validation.js`, `src/migrate.js`, `src/db.js`. Business logic lives in pure modules under `src/` with unit tests in `api/test/`.
- `web/`: `public/index.html`, `app.js`, `style.css`; `nginx.conf`.
- `tests/acceptance/`: black-box tests per requirements document, owned by the validator; `run.sh` runs all of them.

## Data model
- `tasks`: id serial PK, title varchar(100) NOT NULL (non-blank), due_date date NULL, done boolean NOT NULL default false, created_at timestamptz NOT NULL default now(). Index `tasks_open_due_idx (done, due_date)`.

## Deployment and runtime
| Service | Image or build | Ports | Volumes | Memory limit |
|---|---|---|---|---|
| db | postgres:16.4-alpine, shared_buffers=128MB, max_connections=30 | 5432 internal | db-data | 512m |
| api | build ./api | 3000 internal | – | 256m (heap 160 MB) |
| web | build ./web | 80, published as ${APP_PORT:-8080} | – | 64m |
Healthchecks on all services, `depends_on` with `service_healthy`, `restart: unless-stopped`. Secrets in `.env` (`POSTGRES_PASSWORD`), template `.env.example`. Start: `cp .env.example .env && docker compose up -d`. Backups: nightly `pg_dump` by the family's existing host cron job (outside this repo).

## Conventions
- API errors: `{ "error": "<German message for the user>" }` with 400/404/500.
- Dates on the wire: `YYYY-MM-DD` strings; DATE columns are parsed as strings (db.js).
- Migrations: `api/migrations/NNN_<name>.sql`, applied in order on API start.
- Unit tests next to the logic in `api/test/*.test.js`; acceptance tests in `tests/acceptance/NNN-<slug>/*.test.mjs`, test names start with the requirement ID.
- Commits: `feat(NNN): ...`, `fix(NNN): ...`, `test(NNN): ...`.

## Design index
| # | Title | Status |
|---|---|---|
| 001 | Task list MVP | Validated |
| 002 | Overdue tasks | Designed |
