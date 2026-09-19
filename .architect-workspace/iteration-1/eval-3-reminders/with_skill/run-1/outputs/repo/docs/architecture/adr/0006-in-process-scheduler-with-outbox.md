# 0006 – Daily reminders run in-process with cron, outbox table and a same-morning catch-up window

- Status: Accepted
- Date: 2026-09-19
- Requirements: 002 R2, R7, R8, R10, QE1, QE3, Left to architecture 3

## Context
Messages must go out at 07:00 Europe/Berlin on working days only, at most one per person per day, reflecting the state at 07:00, never moved to another day. The server runs in UTC; the api is a single NestJS container on a CX22 (ADR 0004). A deploy or crash can take the api down at 07:00. Load: one run per day, ≤ 8 recipients.

## Options
### A – `@nestjs/schedule` cron inside the api + DB outbox
No new process. Cron with `timeZone: 'Europe/Berlin'` handles DST. Idempotency and resume via tables `ReminderRun` (one per date) and `ReminderMessage` (unique per date/recipient/kind). Missed runs covered by a bootstrap check and 5-minute ticks during 07:xx.
### B – Host crontab / separate container calling an internal endpoint
Survives api crashes only if the api is up anyway at call time; adds a second scheduling place outside the repo's code and an internal endpoint to protect.
### C – Job queue (pg-boss / BullMQ + Redis)
Durable scheduling and retries, but a new library (and for BullMQ a Redis container) for one job a day.

## Decision
A. Fewest moving parts; the outbox plus OneSignal idempotency keys gives exactly-once delivery per person and day. Catch-up window: triggers at 07:00, 07:05 … 07:55 and on api start; planning happens at the first trigger of the day, sending retries pending rows at later triggers. From 08:00 on nothing is planned or sent for that day; leftover pending rows are marked FAILED the next day. This keeps R2 ("nothing is moved to another day") and R8 while tolerating short outages.

## Consequences
- The api must run as exactly one replica (as today); scaling out requires a DB advisory lock around `runIfDue`.
- An outage covering all of 07:00–07:59 loses that day's reminders and notices; logged as ERROR the next working day.
- All time logic must go through the injected `Clock` and Berlin dates (`luxon`), never the process time zone.
