# Taskli

## Vision
The simplest possible task list for a small electrician business.

## Problem
Jobs and to-dos were handed out on paper and by phone; things got forgotten and nobody knew the status.

## Target users
- Meister (owner, 1 person): creates tasks, assigns them, sees everything. Mostly in the office on a laptop, sometimes on the phone.
- Geselle / Azubi (employees, ~6 people): see and complete their assigned tasks, on their company phone, on construction sites.

## Core value
Everyone knows what they have to do today, and the Meister sees what is done.

## Non-goals
- No time tracking, no invoicing, no customer portal.

## Glossary
- Task: title, customer name, optional address, optional due date, assignee, status (open / done), notes.
- Assignee: the one employee responsible for a task.
- Due date: calendar day by which a task has to be done (no time of day).
- Overdue: an open task whose due date is before today.
- Working day: Monday to Friday, except statewide Bavarian public holidays (not 15 Aug, not 8 Aug). See 002 R1.
- Reminder: the one daily push message (07:00, working days) an employee receives about their own tasks that are due tomorrow or overdue.
- Meister notice: the push message the Meister receives when tasks become 2 working days overdue.

## Requirements index
| # | Title | Type | Status |
|---|---|---|---|
| 001 | Task list MVP | MVP | Built |
| 002 | Task reminders | Feature | Groomed |
