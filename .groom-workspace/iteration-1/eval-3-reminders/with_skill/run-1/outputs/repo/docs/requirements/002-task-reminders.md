# 002 – Task reminders

- Type: Feature
- Status: Groomed – ready for architecture
- Date: 2026-09-18
- Product context: docs/product.md (builds on 001 – Task list MVP)

## Summary
Employees (Gesellen, Azubis) keep forgetting their assigned tasks. Today Taskli only shows tasks when someone opens the list. With this feature, Taskli sends each employee a push notification on their company phone every workday at 07:00 that lists everything they have due today or overdue. It keeps doing this until they mark the tasks as done. If a task stays overdue for 3 workdays, the Meister is told once, so he no longer has to chase open tasks himself but still learns when something is stuck. Nobody is disturbed on weekends, Bavarian public holidays or during company holidays.

## Users and roles
- **Employee (Geselle / Azubi)**: receives the daily reminder for the tasks assigned to them. Cannot switch reminders off in the app.
- **Meister**: receives a notice when a task has been overdue for 3 workdays. Manages company holiday periods. Sees which employees cannot receive reminders. Has Taskli on his phone as well as on his laptop.

## Stories

### S1 – Daily reminder for the employee
As an employee, I want a push notification on my phone every workday morning that lists my due and overdue tasks, so that I don't forget them.

Acceptance criteria:
- Given it is a workday (R1) and Tim has open tasks with a due date of today or earlier, when it is 07:00, then Tim receives one push notification. It shows the number of due and overdue tasks and their titles.
- Given Tim has 3 tasks due today and 1 overdue task, when the 07:00 reminder is sent, then he receives exactly one notification that covers all 4 tasks, not one per task.
- Given Tim has no open task with a due date of today or earlier, when it is 07:00 on a workday, then Tim receives nothing.
- Given a task has no due date, then it never appears in a reminder.
- Given a task is marked done, then it no longer appears in any later reminder.
- Given a task was due Tuesday and Tim does not mark it done, then it appears in his reminder on Wednesday, Thursday, Friday, the following Monday, and so on, every workday until it is done.
- Given Tim taps the reminder, then Taskli opens his list of open tasks.
- Given it is Saturday, Sunday, a Bavarian public holiday or a company holiday day (R1), then no reminder is sent to anyone.
- Given a task is due on a Saturday, Sunday or Monday, then it first appears in the reminder on Monday at 07:00 (or on the next workday if Monday is not a workday).
- Given a task is only assigned to Tim, then only Tim is reminded of it. Other employees and the Meister do not get the daily reminder.

### S2 – Overdue report to the Meister
As the Meister, I want to be told once when a task has been overdue for 3 workdays, so that I can step in without having to check everything myself.

Acceptance criteria:
- Given Tim's task "Zählerschrank Müller" was due on Tuesday and is still open, when it is 07:00 on Friday (its 3rd overdue workday, R2), then the Meister receives a push notification on his phone. It names the employee, the task and the due date, for example "Tim: Zählerschrank Müller – overdue since Tue".
- Given a public holiday or company holiday day falls between the due date and the report, then that day is not counted, and the report arrives one workday later accordingly.
- Given several tasks reach the threshold on the same morning (from one or several employees), then the Meister receives one bundled notification listing all of them, not one per task.
- Given a task has already been reported to the Meister, then it is not reported again, even if it stays overdue for longer (except after a due date change, S4).
- Given the task is marked done before its 3rd overdue workday, then the Meister receives no report for it.
- Given the Meister taps the report, then Taskli opens his overview of all tasks.
- The Meister receives no daily reminders (S1) for other people's tasks. His only notification is this overdue report.

### S3 – Reassigning a task keeps its overdue history
As the Meister, I want an overdue task to keep counting after I reassign it, so that reassigning does not hide how long it has been open.

Acceptance criteria:
- Given Tim's task was due Tuesday and the Meister reassigns it to Jonas on Wednesday, then from Thursday 07:00 the task appears in Jonas's reminder and no longer in Tim's.
- Given the same case, then the overdue count still runs from the original Tuesday due date, and the Meister report arrives on Friday 07:00 as it would have without the reassignment.
- Given the task was already reported to the Meister before the reassignment, then it is not reported again after the reassignment.

### S4 – Changing the due date restarts the count
As the Meister, I want reminders and the overdue count to follow a new due date when I postpone a task, so that a deliberately postponed task isn't treated as overdue.

Acceptance criteria:
- Given Tim's task is overdue since Tuesday and the Meister changes the due date to next Wednesday, then the task does not appear in Tim's reminders until next Wednesday.
- Given the same case, then the overdue count starts over from the new due date. If the task becomes overdue again for 3 workdays, the Meister is reported again, even if he was already reported for the old date.

### S5 – Company holidays
As the Meister, I want to enter company holiday periods, so that nobody is reminded while the business is closed (for example between Christmas and New Year).

Acceptance criteria:
- The Meister can add one or more company holiday periods, each with a start date and an end date (both inclusive).
- The Meister can change or delete any period at any time. Changes take effect from the next 07:00 run.
- Given an end date before the start date, when the Meister saves, then the period is rejected with an understandable message.
- Given today falls in a company holiday period, then no reminders (S1) and no Meister reports (S2) are sent.
- Company holiday days do not count as overdue workdays (R2).
- Given a company holiday ends on Friday 2 January and Monday 5 January is a workday, then on Monday at 07:00 employees receive their normal reminder with everything due or overdue, including tasks that were due during the company holiday.
- Only the Meister can manage company holidays. Employees cannot see or change them.
- There are no built-in fixed company holiday dates. Only what the Meister enters counts.

### S6 – Unreachable employees are visible
As the Meister, I want to see which employees cannot receive reminders, so that a missing reminder doesn't go unnoticed.

Acceptance criteria:
- Given an employee has blocked or not allowed Taskli notifications on their phone, when they open Taskli, then they see a clear hint that they will not receive reminders and what to do about it (allow notifications for Taskli).
- Given the same case, then the Meister sees a visible marker next to that employee's name wherever he sees employees, meaning "receives no reminders".
- Given the employee allows notifications again, then the hint and the marker disappear.
- Reminders cannot be switched off inside Taskli, not by the employee and not by the Meister.

## Business rules
- **R1 – Workday**: Monday to Friday, excluding (a) all Bavaria-wide statutory public holidays and (b) days within a company holiday period entered by the Meister (S5). Mariä Himmelfahrt (15 August) counts as a holiday. The Augsburger Friedensfest (8 August) does not, because it is local to Augsburg. For reference, the Bavaria-wide statutory holidays are: Neujahr, Heilige Drei Könige, Karfreitag, Ostermontag, Tag der Arbeit, Christi Himmelfahrt, Pfingstmontag, Fronleichnam, Mariä Himmelfahrt, Tag der Deutschen Einheit, Allerheiligen, 1. and 2. Weihnachtsfeiertag. Movable holidays have to be correct for every year.
- **R2 – Overdue workdays**: a task's overdue workday count is the number of workdays (R1) strictly after its current due date, up to and including today. Examples: due Tuesday → Wednesday = 1, Thursday = 2, Friday = 3. Due Saturday → Monday = 1, Tuesday = 2, Wednesday = 3.
- **R3 – Reminder time**: reminders and Meister reports are sent at 07:00 local German time (following summer and winter time), and only on workdays.
- **R4 – Reminder content**: one notification per employee per workday, covering all their open tasks with a due date of today or earlier. It is only sent if at least one such task exists.
- **R5 – Meister report threshold**: an open task is reported to the Meister on the first 07:00 run at which its overdue workday count (R2) is 3 or more, provided it has not yet been reported for its current due date. All tasks reported on the same morning go into one notification. "3 or more" makes sure a task is still reported once, for example when a task is reopened or created with a due date that is already in the past.
- **R6 – Reassignment**: reassigning a task changes who is reminded (from the next 07:00 run), but not the due date, the overdue count or whether the task was already reported.
- **R7 – Due date change**: changing a task's due date restarts the overdue count from the new date and allows one new Meister report for the new date.
- **R8 – Task state is read at send time**: what a reminder or report contains is determined by the state of the tasks at 07:00. Changes made after 07:00 take effect the next workday. Nothing is re-sent the same day.

## Quality expectations
- Reminders arrive on the phone around 07:00, when work on site begins, and not noticeably later.
- Nobody receives any Taskli notification on Saturdays, Sundays, Bavarian public holidays or company holiday days.
- The notification text can be read at a glance on the lock screen and is in the same language as the rest of Taskli.
- Employees can't silently miss out on reminders. If reminders can't reach someone, both that person and the Meister can see it (S6).

## Scope
### In scope
S1–S6, R1–R8.
### Later
- Absences of individual employees (vacation, sickness), during which that person gets no reminders.
### Out of scope
- A time of day per task, or reminders at any time other than 07:00.
- Reminders by SMS or e-mail. Push to the phone is the only channel.
- Switching reminders off in the app, per user or for everyone.
- Daily reminders to the Meister about other people's tasks. He only gets the overdue report.
- Reminders for tasks without a due date.
- Reminders on non-workdays, including for tasks due on those days.

## Decisions
- Reminder is one bundled message at 07:00 every workday with everything due today or overdue (stakeholder, from groomer options).
- Overdue tasks are reminded every workday until done (stakeholder).
- Only the assignee is reminded. The Meister only gets a report on the 3rd overdue workday, once per task (stakeholder).
- Meister reports are bundled into one notification per morning (stakeholder, groomer recommendation accepted).
- Reassignment keeps the original due date for counting. The new assignee is reminded from the next morning (stakeholder).
- A due date change restarts the count and allows a new report (stakeholder, confirmed groomer scenario).
- Weekend = Saturday and Sunday. All Bavaria-wide public holidays including Mariä Himmelfahrt, not the Augsburger Friedensfest (stakeholder).
- Company holidays are configurable by the Meister, with no hard-coded dates (stakeholder).
- Blocked notifications: hint for the employee and marker for the Meister. Reminders cannot be switched off in the app (groomer recommendation accepted by stakeholder).
- The Meister's report goes to his phone as a push only. There is no separate display on the laptop (stakeholder, groomer recommendation accepted).
- No message when nothing is due; tasks without a due date are never reminded; tapping the reminder opens the employee's open task list (groomer decisions, announced, no objection).
- The report to the Meister is once per task, also after reassignment; the "receives no reminders" marker is next to the employee's name; the reminder shows the count and titles (groomer decisions, announced, no objection).
- Tapping the Meister report opens his overview of all tasks (groomer decision, minor, analogous to the agreed employee behaviour).

## Stakeholder technical constraints
- "Am besten per Push, ich würd OneSignal nehmen, das kenn ich." The stakeholder prefers OneSignal as the push service because he knows it.

## Left to architecture
- How to detect that an employee's phone does not accept Taskli notifications (S6). The product need is that both the employee and the Meister can see it.
- How to handle a user who is signed in on several devices, and what happens when a phone is off or offline at 07:00. The product need is that the reminder reaches the person's phone around 07:00 on workdays and never on non-workdays (R3).
- Where Bavarian public holiday dates come from, including movable holidays (R1). The product need is that they are correct every year without manual maintenance by the Meister.
- Where in the Meister's interface company holidays are managed (S5), as long as the Meister can easily find and edit them.

## Glossary
Defined in docs/product.md: Reminder, Overdue report, Workday, Company holiday, Overdue workdays.

## Open questions
None.

## Appendix: Stakeholder input trace
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "Wir brauchen Erinnerungen für Aufgaben" | S1, R3, R4 |
| L2 | "Die Leute vergessen ständig ihre Sachen" | Summary, S1 |
| L3 | "Am besten per Push" | S1, S2, Out of scope (SMS/e-mail) |
| L4 | "ich würd OneSignal nehmen, das kenn ich" | Stakeholder technical constraints |
| L5 | "am Wochenende soll keiner genervt werden" | R1, S1 |
| L6 | "morgens 7 uhr, alles was fällig oder überfällig ist" | S1, R3, R4 |
| L7 | "jeden werktag weiter erinnern bis erledigt" | S1 |
| L8 | "erinnert wird nur der zuständige" | S1, S2, Out of scope |
| L9 | "ab dem dritten überfälligen werktag kriegt der meister auch einmal bescheid" (confirmed: due Tue → report Fri) | S2, R2, R5 |
| L10 | "wochenende ist sa+sonntag" | R1 |
| L11 | "feiertage natürlich auch nicht, wir sind in bayern" / "alle bayernweiten, mariä himmelfahrt zählt, augsburger friedensfest nicht" | R1 |
| L12 | "montag fällige aufgabe wird erst montag früh gemeldet" | S1 |
| L13 | "gesammelte nachricht, nicht zehn einzelne" | S2, R5 |
| L14 | "bei umhängen: zählung geht weiter mit dem original-fälligkeitsdatum" | S3, R6 |
| L15 | "jonas kriegt ab dem nächsten morgen die normale erinnerung" | S3, R6 |
| L16 | "betriebsurlaub weihnachten/neujahr ... soll der meister iwo einstellen können, kein hardcoded datum" | S5, R1 |
| L17 | "benachrichtigungen blockiert: a+b ja gerne, sonst merkt's keiner" | S6 |
| L18 | "urlaub/krankheit einzelner leute - ja später" | Later |
| L19 | Reminders cannot be switched off in the app (groomer proposal, accepted) | S6, Out of scope |
| L20 | "neues datum, zählung von vorne" | S4, R7 |
| L21 | "push aufs handy reicht, hab taskli auch am handy" | S2, Decisions |
