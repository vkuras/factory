# ADR 0006 – In-process scheduler with a persisted daily plan

- Status: Accepted
- Date: 2026-09-19
- Context: requirement 002 (R2, R7, R8, R10), design 002

## Context
Reminders must go out at 07:00 Europe/Berlin on Bavarian working days only, at most one message per person per day, based on the task state at 07:00. There are no background jobs yet. Taskli runs as a single `api` container on one VPS whose clock is in UTC.

## Options
- **A: `@nestjs/schedule` cron inside the API** (time zone Europe/Berlin), with the day's messages first planned into Postgres and then delivered.
- B: Host crontab / a separate `worker` container calling an internal endpoint. More moving parts, same failure modes on a single VPS.
- C: OneSignal scheduled delivery or journeys. Rejected: the holiday rules, the bundling and the Meister logic are ours and depend on Taskli's data.
- D: A job queue (BullMQ + Redis). Rejected: it adds Redis for one job a day.

## Decision
**A.** A cron tick runs every 5 minutes, 07:00–09:55 Berlin. On a working day, the first tick plans the day (`ReminderRun` + `ReminderMessage` rows in one transaction), and every tick delivers the pending messages. There is a Postgres advisory lock against concurrent ticks, `@@unique([runDate, recipientId])` for R7, and the message id is used as the OneSignal idempotency key. Nothing is planned or sent from 09:00 on. Leftovers are marked `EXPIRED` and logged.

## Consequences
- A restart or deploy around 07:00 only delays messages, and they are never duplicated.
- The persisted plan fixes the 07:00 snapshot (R8) and serves as the audit trail.
- The 09:00 cutoff is a product-visible choice made by architecture (see design 002, §5).
- A second API replica is safe (lock + unique constraint), but it is not needed.
