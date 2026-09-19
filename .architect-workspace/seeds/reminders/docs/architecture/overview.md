# Taskli – architecture

## System context
The Meister uses Taskli in the browser on a laptop, sometimes on his phone. Employees use it as an installed PWA on their Android company phones, on construction sites over the mobile network. Taskli runs on a rented Hetzner VPS and is reachable at `https://taskli.elektro-huber.de`.

## Hard constraints
| Constraint | Source | Budget / number | Verified by |
|---|---|---|---|
| Works on company phones over mobile network | 001 | – | Playwright mobile viewport tests |

## Stack
| Layer | Technology and version | Why (ADR) |
|---|---|---|
| Backend | Node.js 22, TypeScript, NestJS 10 | ADR 0001 |
| Persistence | PostgreSQL 16, Prisma 5 | ADR 0002 |
| Frontend | React 18 + TypeScript, Vite, PWA (vite-plugin-pwa), installed on Android phones | ADR 0003 |
| Hosting | Docker Compose on Hetzner CX22 (2 vCPU, 4 GB), Caddy 2 with Let's Encrypt | ADR 0004 |

## Components
- `api/`: NestJS app under `/api`. Modules: `auth`, `users`, `tasks`.
- `web/`: React PWA. Routes: `/tasks` (employee: own open tasks, sorted by due date), `/tasks/:id` (task detail, mark done), `/overview` (Meister: all tasks with status and assignee), `/tasks/new`, `/tasks/:id/edit` (Meister only), `/login`.
- No background jobs and no push messaging exist yet.

## Data model (Prisma)
- `User { id String @id @default(uuid()), name String, role Role (MEISTER | EMPLOYEE), username String @unique, passwordHash String, active Boolean @default(true) }`
- `Task { id String @id @default(uuid()), title String, customerName String, address String?, dueDate DateTime? @db.Date, assigneeId String, status TaskStatus (OPEN | DONE), notes String?, createdAt DateTime, updatedAt DateTime, doneAt DateTime? }`

## Deployment and runtime
- `docker-compose.yml`: `caddy`, `api` (Node 22 alpine), `web` (static build served by Caddy), `postgres`.
- Secrets in `.env` on the server (not in the repo): `DATABASE_URL`, `JWT_SECRET`.
- Server time zone is UTC. Daily `pg_dump` to Hetzner Storage Box.
- Auth: username + password, JWT in HttpOnly cookie, 90-day sessions (employees stay logged in on company phones).

## Conventions
- REST, JSON, camelCase. DTO validation with class-validator. Errors: NestJS standard exception format.
- Authorization via `@Roles('MEISTER')` guard; employees only ever get their own tasks.
- Migrations: `prisma migrate`, files in `api/prisma/migrations/`.
- Tests: Jest unit + e2e (`api/test/`, Testcontainers Postgres), Vitest for `web/`, Playwright for end-to-end.
- UI texts German.

## Design index
| # | Title | Status |
|---|---|---|
| 001 | Task list MVP | Built |
