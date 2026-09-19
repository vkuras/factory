# Design 002 – Task reminders

- Requirement: docs/requirements/002-task-reminders.md
- Status: Designed – ready for implementation
- Date: 2026-09-19
- ADRs: 0005 (push via OneSignal Web Push), 0006 (in-process scheduler with persisted daily plan)

## 1. Overview

A new `reminders` module in the API runs a cron tick every 5 minutes between 07:00 and 09:59 Europe/Berlin. On a working day, the first tick **plans** the day: it computes every message (employee reminders and the Meister notice) from the task state at that moment and stores them in Postgres. Every tick then **delivers** the stored messages that are still pending via the OneSignal REST API. Planning happens once per day, and there is at most one message per person per day (enforced by a unique constraint). Delivery is idempotent, so restarts and retries never send twice.

The PWA registers each device with OneSignal Web Push under the logged-in user's id (`external_id`). Tapping a notification opens a Taskli URL (`/tasks/:id`, `/tasks` or `/overview`).

```
 07:00 Europe/Berlin (cron, every 5 min until 09:59)
        │
        ▼
 ReminderScheduler.tick()
   ├─ today not a working day? ──► stop (R1, R2)
   ├─ pg advisory lock (single runner)
   ├─ no ReminderRun for today and now < 09:00?
   │     └─ ReminderPlanner (pure) → ReminderRun + ReminderMessage rows (PENDING)   [snapshot, R8]
   └─ ReminderDelivery: for each PENDING message of today
         └─ PushSender.send() ──► OneSignal REST ──► FCM ──► Chrome/PWA on phone
                                                        tap ──► web_url in Taskli PWA (S4)
```

## 2. Requirement → design mapping

| Req | Design element |
|---|---|
| R1 working day | `WorkingDays` – computed Bavarian holiday calendar (§4) |
| R2 07:00, working days only, no shifting | Cron in `Europe/Berlin`; tick exits on non-working days; plan only for `today` (§5) |
| R3 open + due date | Planner input query: `status = OPEN AND dueDate IS NOT NULL` |
| R4 due tomorrow | `dueDate == today + 1 calendar day`; plan only exists on working days, so "day before is a working day" holds implicitly |
| R5 nothing on due date | `dueDate == today` matches neither rule |
| R6 overdue | `dueDate < today` |
| R7 one message per person | One `ReminderMessage` per recipient per day, `@@unique([runDate, recipientId])` |
| R8 no catch-up | Plan is computed once and persisted; later changes that day are ignored |
| R9 recipient = current assignee | Planner groups by `task.assigneeId` at plan time; overdue count derived from due date only |
| R10 Meister notice once | Notice iff `workingDaysOverdue(dueDate, today) == 2`; deterministic per due date, so a changed due date re-arms it |
| R11 push only | OneSignal Web Push only; no fallback |
| R12 no absence handling | None; only `User.active = false` excludes a recipient (§6.3) |
| S4 tap target | `web_url` per message (§6.4) |

## 3. Components

### API (`api/src/reminders/`)

| File | Responsibility |
|---|---|
| `working-days.ts` | Pure functions: `isWorkingDay(date)`, `bavarianHolidays(year)`, `workingDaysOverdue(due, today)`. Dates are `YYYY-MM-DD` strings (`LocalDate`), no `Date` objects, so there are no timezone bugs. |
| `clock.ts` | `Clock` provider: `now()` and `todayInBerlin()`. Injected so tests can fake it. |
| `reminder-planner.ts` | Pure: `plan(today, tasks, users) → PlannedMessage[]`. All business rules R3–R10 live here. |
| `reminder-texts.ts` | Pure: German heading, body and tap URL for a planned message (§6). |
| `reminder.scheduler.ts` | `@Cron('*/5 7-9 * * *', { timeZone: 'Europe/Berlin' })` → `tick()`. Locking, planning, delivery, expiry. |
| `reminder-delivery.service.ts` | Sends PENDING messages and updates their status. |
| `push/push-sender.ts` | Interface `PushSender.send({ messageId, recipientId, heading, body, url }) → { providerId }`. |
| `push/onesignal-push-sender.ts` | OneSignal REST implementation (§7). |
| `push/log-push-sender.ts` | Writes to the log instead of sending. Used in dev/CI and when `PUSH_DRIVER=log`. |
| `reminders.module.ts` | Wiring; `PUSH_DRIVER` selects the sender (`onesignal` in production). |

New dependency: `@nestjs/schedule` (v4, compatible with NestJS 10). The OneSignal call uses Node 22's native `fetch`, so there is no OneSignal SDK in the API.

### Web (`web/`)

- **OneSignal SDK** via `react-onesignal`, initialised once after login with `VITE_ONESIGNAL_APP_ID`.
- **Service worker**: keep vite-plugin-pwa's worker as the only worker at scope `/`. Add `importScripts: ['https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js']` to the workbox config and init OneSignal with `serviceWorkerPath: 'sw.js'` (whatever the generated file is called) and `serviceWorkerParam: { scope: '/' }`. Two workers at the same scope would replace each other, so don't do that.
- **Login**: after a successful login, and on app start with a valid session, call `OneSignal.login(user.id)`. **Logout**: call `OneSignal.logout()` before clearing the session, so a handed-over phone stops getting the previous user's tasks.
- **Push hint** (`PushPermissionBanner`): shown on `/tasks` (employee) and `/overview` (Meister) only while this device is not subscribed:
  - Permission `default`: text "Erinnerungen aufs Handy bekommen" and a button "Aktivieren". The button calls `OneSignal.Notifications.requestPermission()`, because the browser requires a user gesture.
  - Permission `denied`: static text "Push-Nachrichten sind für Taskli blockiert. Bitte in den Browser-Einstellungen erlauben."
  - This is the minimum needed to register devices. It is not a settings screen: there is no switch to turn reminders off.
- **Deep links after an expired session**: `/login` must return to the originally requested URL (`/login?next=/tasks/abc`). If 001 does not already do this, add it. Only accept relative paths starting with `/` (open-redirect guard).

## 4. Working-day calendar (R1)

Computed, not stored, so there are no yearly data updates and no external library.

- Fixed: 01-01, 01-06, 05-01, 10-03, 11-01, 12-25, 12-26.
- Movable, relative to Easter Sunday (anonymous Gregorian / Meeus algorithm): Good Friday −2, Easter Monday +1, Ascension +39, Whit Monday +50, Corpus Christi +60.
- Explicitly **not** included: 08-15, 08-08 (a test asserts both are working days when they fall Mon–Fri).
- `isWorkingDay(d)` = Mon–Fri and not in `bavarianHolidays(year(d))`.
- `workingDaysOverdue(due, today)` = number of working days `d` with `due < d ≤ today`.

Tests: the full holiday list for 2026–2030, checked against the official Bavarian list. Example: Easter Sunday 2026-04-05 → Good Friday 04-03, Easter Monday 04-06, Ascension 05-14, Whit Monday 05-25, Corpus Christi 06-04. Plus the examples from the requirement (due Thursday → Friday = 1, Monday = 2).

## 5. Scheduling and missed runs (R2, R8)

**Time zone.** The server runs in UTC. All reminder logic uses Europe/Berlin via the cron `timeZone` option and `Intl.DateTimeFormat(…, { timeZone: 'Europe/Berlin' })` for "today". DST changes are handled by the cron library. Node's bundled ICU contains the tz data, so the alpine image needs no `tzdata`.

**Tick** (every 5 minutes, 07:00–09:55 Berlin):

1. `today = clock.todayInBerlin()`. If `!isWorkingDay(today)`, return. Nothing is sent on non-working days and nothing is moved (R2).
2. Take `pg_try_advisory_xact_lock(<reminders>)`. If it is held, return. This protects against overlapping ticks and a second API container.
3. **Plan** (if there is no `ReminderRun` for `today` and local time < 09:00): load the open tasks with a due date and all active users, run `ReminderPlanner`, then insert `ReminderRun(today)` and all `ReminderMessage` rows (`PENDING`) in one transaction. The plan is the snapshot of the task state at 07:00 (R8). Later edits that day don't change it.
4. **Deliver** (if local time < 09:00): send every `PENDING` message for `today`, sequentially. Success → `SENT`, `providerId`, `sentAt`. Error → `attempts++`, `lastError`; the message stays `PENDING` and the next tick retries it.
5. **Expire** (if local time ≥ 09:00): mark every still-`PENDING` message for `today` as `EXPIRED` and log an error per message. If no plan exists at 09:00 on a working day, log an error "Reminder run for <date> missed".

**Missed-run policy.** If the API is down at 07:00 (deploy, crash, VPS restart), the next tick after it comes back plans and sends, as long as that is before 09:00. After 09:00 the day is skipped completely: there are no messages "during the day" and nothing moves to the next day.
- ⚠ The 09:00 cutoff is an architecture choice with a visible product effect. It is not in the requirement. I picked it because a reminder at 08:30 is still useful, while one at noon counts as "during the day". Change the constant `SEND_WINDOW_END = '09:00'` if the stakeholder wants something else.
- If a missed day would have been the 2nd working day overdue for a task, the Meister notice for that task is lost. This follows from R10 ("on the 2nd working day"). The task still appears in the employee's daily overdue reminders.

**Deploys** should avoid 07:00–07:10 on working days. This is a note for the deploy routine, not a hard requirement, since retries cover it.

## 6. Message content and tap target (R7, S4)

### 6.1 Planner output

For `today` (a working day), the planner considers tasks with `status = OPEN`, `dueDate != null` and an active assignee:

- `dueTomorrow` = tasks with `dueDate == today + 1 day`
- `overdue` = tasks with `dueDate < today`, sorted by `dueDate` ascending, then title
- One `EMPLOYEE_REMINDER` per assignee who has ≥ 1 task in either list. Nobody else gets anything.
- `meisterTasks` = tasks with `workingDaysOverdue(dueDate, today) == 2`. If there are any, one `MEISTER_NOTICE` per active user with role `MEISTER`.

### 6.2 Texts (German)

Employee reminder, heading `Taskli: Deine Aufgaben`, body:
```
Morgen fällig:
• Steckdosen tauschen – Müller
Überfällig:
• Zähler setzen – Bauer
```
Empty sections are left out.

Meister notice, heading `Taskli: 2 Werktage überfällig`, body:
```
• Zähler setzen – Bauer (Tom)
```

Line format: `• {title} – {customerName}`, plus ` ({assigneeName})` for the Meister. Titles and customer names are cut at 50 characters with "…". Safety cap: after 15 lines, add `… und N weitere`. That keeps the payload well under the 4 KB web-push limit and should never happen in practice.

### 6.3 Recipients
- Recipients must have `User.active = true`. Tasks assigned to an inactive user produce no employee reminder, but still count for the Meister notice. That way the Meister notices orphaned tasks.
- A recipient without a registered device: OneSignal accepts the request and delivers to 0 devices. The message is `SENT` from Taskli's point of view (R11: their own responsibility). OneSignal's response reports the recipient count; store it in `ReminderMessage.deviceCount` so "why didn't Tom get it?" can be answered.

### 6.4 Tap URL (`web_url`, absolute on `https://taskli.elektro-huber.de`)
| Message | Tasks in message | URL |
|---|---|---|
| Employee or Meister | exactly 1 | `/tasks/{id}` |
| Employee | ≥ 2 (across both sections) | `/tasks` |
| Meister | ≥ 2 | `/overview` |

If the task was reassigned or deleted after 07:00, the existing task-detail behaviour of 001 applies (e.g. "not found" or forbidden for the old assignee). No special handling.

## 7. OneSignal integration (ADR 0005)

`POST https://api.onesignal.com/notifications`, header `Authorization: Key ${ONESIGNAL_REST_API_KEY}`:

```json
{
  "app_id": "<ONESIGNAL_APP_ID>",
  "target_channel": "push",
  "include_aliases": { "external_id": ["<user.id>"] },
  "headings": { "en": "<heading>", "de": "<heading>" },
  "contents": { "en": "<body>", "de": "<body>" },
  "web_url": "https://taskli.elektro-huber.de/tasks/<id>",
  "priority": 10,
  "ttl": 43200,
  "idempotency_key": "<ReminderMessage.id>"
}
```

- `en` is filled with the German text because OneSignal requires an `en` entry by default.
- `idempotency_key` = the message's UUID, so a retry after a timeout never creates a second notification.
- `ttl` of 12 h: a phone that is off all day does not get the morning reminder the next morning.
- `priority: 10`: high priority, so Android Doze delivers it promptly.
- HTTP 5xx, 429 or network errors → retry on the next tick. HTTP 4xx other than 429 → `attempts++` and log. It is still retried within the window, because config errors are fixed by a redeploy.
- Request timeout is 10 s. With ≤ 8 recipients, a run takes seconds.

## 8. Data model (Prisma)

```prisma
enum ReminderKind   { EMPLOYEE_REMINDER  MEISTER_NOTICE }
enum DeliveryStatus { PENDING  SENT  EXPIRED }

model ReminderRun {
  runDate   DateTime @id @db.Date      // Berlin local date
  plannedAt DateTime
  messages  ReminderMessage[]
}

model ReminderMessage {
  id          String         @id @default(uuid())   // also the OneSignal idempotency_key
  runDate     DateTime       @db.Date
  run         ReminderRun    @relation(fields: [runDate], references: [runDate])
  recipientId String
  recipient   User           @relation(fields: [recipientId], references: [id])
  kind        ReminderKind
  taskIds     String[]
  heading     String
  body        String
  url         String
  status      DeliveryStatus @default(PENDING)
  attempts    Int            @default(0)
  lastError   String?
  providerId  String?
  deviceCount Int?
  sentAt      DateTime?

  @@unique([runDate, recipientId])   // R7: at most one message per person per day
  @@index([runDate, status])
}
```

No change to `Task` or `User`. Retention: rows are small (~8 per day). Keep them; they are the audit trail.

## 9. Configuration and operations

- New server secrets in `.env`: `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `PUSH_DRIVER=onesignal`. Web build: `VITE_ONESIGNAL_APP_ID` (public).
- Dev/CI: `PUSH_DRIVER=log`. Use a separate OneSignal app for staging if one exists, so test pushes never reach the real phones.
- Ops scripts (`api/`, run with `docker compose exec api …`):
  - `npm run reminders:dry-run -- --date 2026-10-01` prints the plan for a date without storing or sending anything. Use it to verify holidays and rules against real data.
  - `npm run reminders:test-push -- --user <username>` sends "Taskli Test" to one user. Use it to check a phone after setup.
- One-time setup (Meister or whoever runs the server):
  1. Create a OneSignal app (Web, site URL `https://taskli.elektro-huber.de`, Taskli icon).
  2. Accept OneSignal's DPA (§11).
  3. Set the secrets.
  4. Deploy.
  5. On each company phone: open the Taskli PWA, tap "Aktivieren", allow.
  6. Run `test-push` per user.

## 10. Testing

| Level | What |
|---|---|
| Unit (Jest) | `working-days`: holidays 2026–2030, 15 Aug and 8 Aug are working days, overdue counting. `reminder-planner`: one test per acceptance criterion in S1–S3 (Monday due date → no pre-due reminder; day after holiday; due today; no due date; done; reassignment; two sections in one message; no message when empty; Meister exactly at 2, not at 1 or 3; several tasks → one notice; changed due date re-arms). `reminder-texts`: formats, truncation, URL choice per S4. |
| Integration (Jest e2e, Testcontainers) | `tick()` with fake clock and fake `PushSender`: Saturday/holiday → no rows. Two ticks → one plan, no double send. Sender fails once → retried on next tick → `SENT` once. 09:00 tick → `EXPIRED`. Task created after planning is not included (R8). Unique constraint holds. |
| Web (Vitest) | Banner states (default / denied / subscribed). `OneSignal.login`/`logout` called on login/logout. `/login?next=` redirect incl. open-redirect guard. |
| Manual smoke (real Android company phone) | The spike (§12) plus, after deploy, `test-push` on every phone. Playwright cannot verify real push delivery. |

## 11. Risks and assumptions

| # | Risk / assumption | Mitigation |
|---|---|---|
| A1 | Company phones are Android with Chrome and Google Play services (web push goes through FCM). | Covered by the spike and by `test-push` per phone. |
| A2 | If the Meister's phone is an **iPhone**, web push only works when Taskli is added to the home screen (iOS ≥ 16.4). | Setup step: install the PWA on his phone. Otherwise he only gets notices in the laptop browser (all his subscribed devices receive the notice). |
| R1 | OneSignal's worker and the vite-plugin-pwa worker must share one service worker. A misconfiguration breaks either offline caching or push. | Spike first (§12). |
| R2 | **Privacy.** Notification content (task titles, **customer names**) and user ids pass through OneSignal, a US processor. | The business owner has to accept OneSignal's DPA (with SCCs) before go-live. If that is not acceptable, fall back to self-hosted Web Push (ADR 0005, alternative B). Only the sender and the web init change. |
| R3 | Tapping a notification should open the installed PWA, not a Chrome tab. | Verify in the spike. The fallback (Chrome tab) still works functionally, and the session cookie is shared. |
| R4 | The API is down for the whole 07:00–09:00 window. | The day is skipped and logged (§5). There is no monitoring yet, which is out of scope here. |

## 12. Implementation order

1. **Spike (½ day, on a real company phone)**: OneSignal init + shared service worker + `OneSignal.login` + a manual push from the OneSignal dashboard with `web_url`. Check delivery, that tapping opens the PWA, and that offline caching still works. Update this design if something fails.
2. `working-days` + tests.
3. `reminder-planner` + `reminder-texts` + tests (all acceptance criteria).
4. Prisma migration, `PushSender` (log + OneSignal), scheduler/delivery + e2e tests.
5. Web: OneSignal init, login/logout hooks, banner, `/login?next=`.
6. Ops scripts, `.env` docs, deploy, per-phone setup and `test-push`.
