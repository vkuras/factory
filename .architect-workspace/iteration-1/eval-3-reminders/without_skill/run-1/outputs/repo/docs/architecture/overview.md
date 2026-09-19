# Taskli – architecture

## System context
The Meister uses Taskli in the browser on a laptop, sometimes on his phone. Employees use it as an installed PWA on their Android company phones, on construction sites over the mobile network. Taskli runs on a rented Hetzner VPS and is reachable at `https://taskli.elektro-huber.de`.

## Hard constraints
| Constraint | Source | Budget / number | Verified by |
|---|---|---|---|
| Works on company phones over mobile network | 001 | – | Playwright mobile viewport tests |
| Reminders only on Bavarian working days, planned at 07:00 Europe/Berlin | 002 R1, R2 | Send window 07:00–09:00, nothing outside | Unit tests holiday calendar 2026–2030 + planner; e2e scheduler with fake clock |
| At most one push message per person per day, never sent twice | 002 R7 | 1 | DB unique constraint + e2e retry test |

## Stack
| Layer | Technology and version | Why (ADR) |
|---|---|---|
| Backend | Node.js 22, TypeScript, NestJS 10 | ADR 0001 |
| Persistence | PostgreSQL 16, Prisma 5 | ADR 0002 |
| Frontend | React 18 + TypeScript, Vite, PWA (vite-plugin-pwa), installed on Android phones | ADR 0003 |
| Hosting | Docker Compose on Hetzner CX22 (2 vCPU, 4 GB), Caddy 2 with Let's Encrypt | ADR 0004 |
| Push messages | OneSignal Web Push (REST API from `api`, `react-onesignal` in `web`) | ADR 0005 |
| Scheduling | `@nestjs/schedule` 4 cron in `api`, time zone Europe/Berlin | ADR 0006 |

## Components
- `api/`: NestJS app under `/api`. Modules: `auth`, `users`, `tasks`, `reminders` (daily reminder planning and push delivery, design 002).
- `web/`: React PWA. Routes: `/tasks` (employee: own open tasks, sorted by due date), `/tasks/:id` (task detail, mark done), `/overview` (Meister: all tasks with status and assignee), `/tasks/new`, `/tasks/:id/edit` (Meister only), `/login`.
- Background job: `reminders` cron tick every 5 min 07:00–09:55 Europe/Berlin (design 002). The PWA service worker imports the OneSignal worker; devices register with `external_id = User.id`.

## Data model (Prisma)
- `User { id String @id @default(uuid()), name String, role Role (MEISTER | EMPLOYEE), username String @unique, passwordHash String, active Boolean @default(true) }`
- `Task { id String @id @default(uuid()), title String, customerName String, address String?, dueDate DateTime? @db.Date, assigneeId String, status TaskStatus (OPEN | DONE), notes String?, createdAt DateTime, updatedAt DateTime, doneAt DateTime? }`
- `ReminderRun { runDate DateTime @id @db.Date, plannedAt DateTime }` (002)
- `ReminderMessage { id uuid, runDate, recipientId, kind (EMPLOYEE_REMINDER | MEISTER_NOTICE), taskIds String[], heading, body, url, status (PENDING | SENT | EXPIRED), attempts, lastError?, providerId?, deviceCount?, sentAt?; @@unique([runDate, recipientId]) }` (002, full definition in design 002 §8)

## Deployment and runtime
- `docker-compose.yml`: `caddy`, `api` (Node 22 alpine), `web` (static build served by Caddy), `postgres`.
- Secrets in `.env` on the server (not in the repo): `DATABASE_URL`, `JWT_SECRET`, `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `PUSH_DRIVER` (`onesignal` | `log`). Web build: `VITE_ONESIGNAL_APP_ID`.
- Server time zone is UTC; business dates and schedules use Europe/Berlin explicitly. Daily `pg_dump` to Hetzner Storage Box.
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
| 002 | Task reminders ([design](design/002-task-reminders.md)) | Designed |
