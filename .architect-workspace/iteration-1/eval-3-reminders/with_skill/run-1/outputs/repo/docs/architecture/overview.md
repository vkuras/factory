# Taskli – architecture

## System context
The Meister uses Taskli in the browser on a laptop, sometimes on his phone. Employees use it as an installed PWA on their Android company phones, on construction sites over the mobile network. Taskli runs on a rented Hetzner VPS and is reachable at `https://taskli.elektro-huber.de`. Push messages (002) are delivered through OneSignal Web Push to the browsers/PWAs of registered users (ADR 0005).

## Hard constraints
| Constraint | Source | Budget / number | Verified by |
|---|---|---|---|
| Works on company phones over mobile network | 001 | – | Playwright mobile viewport tests |
| Push messages only on working days (Mon–Fri except the 12 statewide Bavarian holidays of 002 R1; 15 Aug and 8 Aug are working days) | 002 R1, R2, QE3 | 0 messages on non-working days | Unit tests T-CAL-1/2, integration T-RUN-2 (002 design) |
| Scheduled messages at 07:00 Europe/Berlin, independent of the server's UTC time zone; never moved to another day | 002 R2, R8 | Send window 07:00–07:59 Berlin | T-CAL-3, T-RUN-5/6 (002 design) |
| At most one message per person and kind per day | 002 R7 | ≤ 1 employee reminder / ≤ 1 Meister notice per user per date | T-RUN-3/4 (002 design) |

## Stack
| Layer | Technology and version | Why (ADR) |
|---|---|---|
| Backend | Node.js 22, TypeScript, NestJS 10 | ADR 0001 |
| Persistence | PostgreSQL 16, Prisma 5 | ADR 0002 |
| Frontend | React 18 + TypeScript, Vite, PWA (vite-plugin-pwa), installed on Android phones | ADR 0003 |
| Hosting | Docker Compose on Hetzner CX22 (2 vCPU, 4 GB), Caddy 2 with Let's Encrypt | ADR 0004 |
| Push messaging | OneSignal Web Push (Web SDK v16 via `react-onesignal` 3.x; REST API from the api) | ADR 0005 |
| Scheduling | `@nestjs/schedule` 4.x in-process cron, `Europe/Berlin`; outbox tables | ADR 0006 |
| Date/time | `luxon` 3.x (api), calendar dates as `YYYY-MM-DD`; own Bavarian holiday calendar | ADR 0006, ADR 0007 |

## Components
- `api/`: NestJS app under `/api`. Modules: `auth`, `users`, `tasks`, `reminders` (daily 07:00 job, working-day calendar, push sending, `/api/push-subscriptions`; see 002 design).
- `web/`: React PWA, service worker `web/src/sw.ts` (vite-plugin-pwa `injectManifest`, imports the OneSignal SW), push registration in `web/src/push/`. Routes: `/tasks` (employee: own open tasks, sorted by due date), `/tasks/:id` (task detail, mark done), `/overview` (Meister: all tasks with status and assignee), `/tasks/new`, `/tasks/:id/edit` (Meister only), `/login` (supports `?next=<relative path>`).
- Background jobs: only the daily reminders job (002). Push only via the `PushSender` interface (`OneSignalPushSender`, `LogPushSender` when no API key is configured).

## Data model (Prisma)
- `User { id String @id @default(uuid()), name String, role Role (MEISTER | EMPLOYEE), username String @unique, passwordHash String, active Boolean @default(true) }`
- `Task { id String @id @default(uuid()), title String, customerName String, address String?, dueDate DateTime? @db.Date, assigneeId String, status TaskStatus (OPEN | DONE), notes String?, createdAt DateTime, updatedAt DateTime, doneAt DateTime? }`
- `PushSubscription { id String @id (OneSignal subscription id), userId → User, userAgent String?, createdAt, lastSeenAt }` (002)
- `ReminderRun { runDate Date @id, startedAt, completedAt? }` (002)
- `ReminderMessage { id uuid, runDate → ReminderRun, recipientId → User, kind (EMPLOYEE_REMINDER | MEISTER_NOTICE), title, body, url, taskIds String[], status (PENDING | SENT | NO_DEVICE | FAILED), attempts, lastError?, oneSignalId?, sentAt?, createdAt; unique (runDate, recipientId, kind) }` (002)
- Field-level detail: docs/architecture/002-task-reminders.md.

## Deployment and runtime
- `docker-compose.yml`: `caddy`, `api` (Node 22 alpine), `web` (static build served by Caddy), `postgres`.
- Secrets and config in `.env` on the server (not in the repo): `DATABASE_URL`, `JWT_SECRET`, `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `APP_BASE_URL`. Web build arg: `VITE_ONESIGNAL_APP_ID`. Empty `ONESIGNAL_REST_API_KEY` disables real push (dev, CI).
- Server time zone is UTC; business time logic always uses `Europe/Berlin` explicitly. Daily `pg_dump` to Hetzner Storage Box.
- Auth: username + password, JWT in HttpOnly cookie, 90-day sessions (employees stay logged in on company phones).

## Conventions
- REST, JSON, camelCase. DTO validation with class-validator. Errors: NestJS standard exception format.
- Authorization via `@Roles('MEISTER')` guard; employees only ever get their own tasks.
- Migrations: `prisma migrate`, files in `api/prisma/migrations/`.
- Tests: Jest unit + e2e (`api/test/`, Testcontainers Postgres), Vitest for `web/`, Playwright for end-to-end.
- UI texts German; push texts German.
- Time: never use process-local time for business rules; inject `Clock`, convert with `luxon` to `Europe/Berlin`, compare calendar dates as `YYYY-MM-DD`.
- Working days: always via `api/src/reminders/working-day-calendar.ts`, never re-implemented.

## Design index
| # | Title | Status |
|---|---|---|
| 001 | Task list MVP | Built |
| 002 | Task reminders | Designed |
