# 002 – Task reminders

- Type: Feature
- Status: Designed – see docs/architecture/design/002-task-reminders.md
- Date: 2026-09-18
- Product context: docs/product.md

## Summary
Employees (Geselle / Azubi) keep forgetting tasks assigned to them, and the Meister often only notices when it is too late. Taskli will remind them on its own with a push message on their company phone: once on the day before a task is due, and on every working day while the task is overdue. The Meister gets a one-time notice when a task is 2 working days overdue. There are no messages on weekends or on Bavarian public holidays, so nobody is bothered outside working days.

## Users and roles
- **Employee (Geselle / Azubi)**: receives one reminder message per working day morning covering their own open tasks that are due tomorrow or overdue. Receives nothing about other people's tasks.
- **Meister**: receives a notice when a task becomes 2 working days overdue. Is never reminded about tasks himself (tasks are always assigned to an employee, see docs/product.md).

Nobody configures anything. There is no settings screen for reminders.

## Stories

### S1 – Morning reminder for tasks due tomorrow
As an employee, I want to be reminded the morning before a task is due, so that I can plan it in and don't forget it.

Acceptance criteria:
- Given Tom has an open task A due on Thursday, when Wednesday 07:00 arrives (Wednesday being a working day), then Tom receives a reminder message that lists A under "due tomorrow" with its title and customer name.
- Given a task is due on a Monday, when the weekend passes, then no pre-due reminder is sent at all (the day before is a Sunday; it is not moved to Friday). See R4.
- Given a task is due on the day after a public holiday, then no pre-due reminder is sent.
- Given a task is due today, when today 07:00 arrives, then the task is not part of today's message (nothing on the due date itself, R5).
- Given a task has no due date, then it never appears in any reminder (R3).
- Given the task is marked done before Wednesday 07:00, then it does not appear in the message.
- Given the task was created, assigned or given its due date on Wednesday after 07:00, then no reminder is sent later that day (R8).

### S2 – Daily reminder for overdue tasks
As an employee, I want to be reminded every working day about my overdue tasks, so that they don't stay forgotten.

Acceptance criteria:
- Given Tom's task A was due on Thursday and is still open, when Friday 07:00 arrives, then Tom's message lists A under "overdue". The same happens on Monday, Tuesday and every further working day until A is done.
- Given A is marked done, then it no longer appears in any following message.
- Given Tom has task A due tomorrow and task B overdue, when 07:00 arrives, then Tom receives exactly one message with two sections, "due tomorrow: A" and "overdue: B" (R7).
- Given Tom has no task that is due tomorrow or overdue, then Tom receives no message that day.
- Given it is a Saturday, Sunday or public holiday, then no message is sent and nothing is sent later instead (R2).
- Given the Meister reassigns overdue task A from Tom to Lisa, then from the next working day's 07:00 A appears in Lisa's message and no longer in Tom's. A is still overdue, the count is based on the due date and does not restart (R9).

### S3 – Meister notice for tasks 2 working days overdue
As the Meister, I want to be told once when a task is 2 working days overdue, so that I can step in without being flooded.

Acceptance criteria:
- Given task A was due on Thursday and is still open, when Monday 07:00 arrives (Friday = 1st, Monday = 2nd working day overdue), then the Meister receives a notice listing A with its title, customer name and assignee.
- Given A stays open afterwards, then the Meister receives no further notice about A.
- Given two or more tasks reach 2 working days overdue on the same day, then the Meister receives one single message listing all of them (R7).
- Given A is done before the 2nd working day overdue, then no notice is sent.
- Given the due date of A is changed, then only the new due date counts, and A can trigger a Meister notice again based on the new date (R10).
- Given A had no due date, then no notice is ever sent.

### S4 – Tapping a reminder opens the right place
As a recipient of a reminder, I want tapping it to take me straight to what it is about, so that I don't have to search.

Acceptance criteria:
- Given a message (employee or Meister) lists exactly one task, when the recipient taps it, then Taskli opens that task directly.
- Given an employee's message lists several tasks, when the employee taps it, then Taskli opens the employee's list of their open tasks.
- Given a Meister notice lists several tasks, when the Meister taps it, then Taskli opens the Meister's existing overview of all tasks. No separate "overdue only" view is added.

## Business rules
- **R1 – Working day**: Monday to Friday, except statewide Bavarian public holidays: New Year's Day (1 Jan), Epiphany (6 Jan), Good Friday, Easter Monday, Labour Day (1 May), Ascension Day, Whit Monday, Corpus Christi, German Unity Day (3 Oct), All Saints' Day (1 Nov), Christmas Day (25 Dec), St Stephen's Day (26 Dec). Assumption Day (15 Aug) and the Augsburg Peace Festival (8 Aug) are **not** holidays for this business.
- **R2 – When messages go out**: only on working days, at 07:00 German local time. On non-working days nothing is sent, and nothing is moved to another day. This applies to employee reminders and Meister notices alike.
- **R3 – Which tasks count**: only open (not done) tasks that have a due date. Tasks without a due date never trigger anything.
- **R4 – Due-tomorrow reminder**: a task appears under "due tomorrow" exactly once, on the calendar day immediately before its due date, and only if that day is a working day. If the day before is not a working day, the pre-due reminder is dropped (e.g. a task due Monday gets none; a task due the day after a holiday gets none).
- **R5 – Due date itself**: on the due date, the task is in no message.
- **R6 – Overdue**: a task is overdue from the day after its due date while it is open. It appears under "overdue" on every working day from the first working day after its due date until it is done. "N working days overdue" counts the working days after the due date: due Thursday → Friday = 1, Monday = 2.
- **R7 – One message per person per day**: each person receives at most one message per working day. An employee's message has the sections "due tomorrow" and "overdue", listing each task with title and customer name. The Meister's message lists each task with title, customer name and assignee. A person with nothing to report receives no message.
- **R8 – No catch-up**: the content of a message reflects the tasks as they are at 07:00. Tasks that are created, assigned, edited or given a due date after 07:00 are only considered from the next regular 07:00 on a working day. Nothing is sent during the day.
- **R9 – Recipient**: employee reminders always go to the task's current assignee. After reassignment, the new assignee gets the task in their next message, and the previous assignee no longer does.
- **R10 – Meister notice once**: the Meister is notified about a task once, on the 2nd working day after its due date at 07:00, if the task is still open then. If the due date is changed, counting starts from the new due date and the task can trigger a notice again.
- **R11 – Push only**: reminders are delivered only as push messages on the phone. There is no email or other fallback. Someone who has push messages switched off for Taskli receives nothing. That is their own responsibility.
- **R12 – No absence handling**: Taskli does not know about vacation or sickness. Reminders go out regardless; the Meister reassigns tasks if needed.

## Quality expectations
- Messages arrive on the recipients' phones (employees: company phones) at 07:00.
- Messages are in German.
- Nobody may receive a message on weekends or on the public holidays in R1. This is the stakeholder's explicit "don't annoy anyone" expectation.
- An employee's message only contains their own tasks.

## Scope
### In scope
- S1–S4, rules R1–R12.
### Later
- Nothing parked.
### Out of scope
- Email or any channel other than push.
- Reminders for tasks without a due date.
- Moving reminders that fall on weekends/holidays to another day (including moving the pre-due reminder of Monday tasks to Friday).
- A reminder on the due date itself.
- Settings to switch reminders off or choose other times, per person or globally.
- Vacation / absence management.
- A separate "overdue only" view for the Meister.
- Reminders for the Meister about his own tasks.

## Decisions
- Pre-due reminder at 07:00 on the day before the due date, once. (stakeholder)
- Overdue reminders every working day at 07:00 until done. (stakeholder)
- No reminders for tasks without due date. (stakeholder)
- Reminders go to the assignee; the Meister gets one notice at 2 working days overdue. (stakeholder)
- Weekends and Bavarian holidays: reminders are dropped completely, not shifted, including the pre-due reminder for Monday tasks. (stakeholder)
- Only statewide Bavarian holidays; 15 Aug and 8 Aug are not holidays for this business. (stakeholder, groomer asked)
- Nothing on the due date itself. (stakeholder)
- One bundled message per person per day instead of one per task, because single messages would annoy. (stakeholder)
- Push only, no fallback if push is switched off. (stakeholder)
- Tap opens the task directly if the message contains one task, otherwise the list. (stakeholder)
- For the Meister, "the list" is his existing overview of all tasks; no new view. (groomer proposal, accepted)
- Meister notices are also bundled into one message per day. (groomer proposal, accepted)
- Messages show title and customer (Meister: also assignee), split into "due tomorrow" / "overdue". (groomer proposal, accepted)
- Done tasks trigger nothing; reassignment moves reminders to the new assignee without resetting the overdue count; a changed due date restarts counting and can trigger a second Meister notice. (groomer proposal, accepted)
- No catch-up for tasks created or changed after 07:00. (groomer proposal, accepted)
- No settings / opt-out, no absence handling, German texts, German local time, no message on days with nothing to report. (groomer proposal, accepted)

## Stakeholder technical constraints
- "ich würd OneSignal nehmen, das kenn ich" – stated as a preference for the push messaging service, because the stakeholder already knows it.

## Left to architecture
- How push messages reach the phones and how employees' devices are registered for them (product need: every employee with Taskli on their company phone and push enabled receives the 07:00 message; see R11; OneSignal preference above).
- How the Bavarian holiday calendar is kept correct for movable holidays across years (product need: R1).
- How the 07:00 schedule is triggered reliably and how a missed run is handled (product need: messages at 07:00 on working days, never on non-working days, R2).
- How tapping a message opens a specific task or list in the app (product need: S4).

## Glossary
- **Working day**: see R1.
- **Reminder**: the one daily push message an employee receives about their tasks that are due tomorrow or overdue.
- **Meister notice**: the push message the Meister receives when tasks become 2 working days overdue.
- **Overdue**: an open task whose due date is before today.

## Open questions
None.

## Appendix: Stakeholder input trace
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "Wir brauchen Erinnerungen für Aufgaben" | Summary, S1–S4 |
| L2 | "Die Leute vergessen ständig ihre Sachen" | Summary, S1, S2 |
| L3 | "Am besten per Push" | R11 |
| L4 | "ich würd OneSignal nehmen, das kenn ich" | Stakeholder technical constraints |
| L5 | "am Wochenende soll keiner genervt werden" | R1, R2, Quality expectations |
| L6 | "Donnerstag fällig heißt Erinnerung Mittwoch 7 Uhr früh, einmal" / "Erinnerung 1 Tag vorher" | S1, R2, R4 |
| L7 | "überfällige (jeden Werktag 7 Uhr)" | S2, R6 |
| L8 | "Ohne Fälligkeitsdatum brauch ma nix erinnern, macht kein Sinn" | R3, Out of scope |
| L9 | "Erinnerung geht an den, der die Aufgabe hat" | R9 |
| L10 | "Wenn was 2 Werktage überfällig is, krieg ich als Meister auch einmal Bescheid" | S3, R6, R10 |
| L11 | "Am Wochenende und an Feiertagen (sind ja in Bayern) fällt die Erinnerung einfach komplett weg, nicht verschieben" | R1, R2, Out of scope |
| L12 | "dann fällt die Vorab-Erinnerung halt weg, brauchma nicht extra auf Freitag verschieben" | R4, Out of scope |
| L13 | "am Fälligkeitstag selbst kommt nix, erst am Tag drauf gehts los mit überfällig" | R5, R6 |
| L14 | "eine Sammelnachricht, sonst nervt das ja nur wenn er 4 einzelne kriegt" | R7 |
| L15 | "dann is Pech, kein E-Mail, nur Push. Wer's ausgeschaltet hat, muss selber schaun dass er's anmacht" | R11, Out of scope |
| L16 | "beim Tippen soll sich nicht einfach die Liste öffnen, sondern gleich die jeweilige Aufgabe direkt" | S4 |
| L17 | "Bei einer Aufgabe direkt die Aufgabe, bei mehreren die Liste" | S4 |
| L18 | "die zwei Sonderfälle lass ma weg ... reichen die normalen bayerischen Feiertage" | R1 |
