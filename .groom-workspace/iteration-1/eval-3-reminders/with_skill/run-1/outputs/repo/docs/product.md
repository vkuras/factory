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
- Workday: Monday to Friday, excluding Bavaria-wide statutory public holidays and company holiday days.
- Company holiday: a period (start to end date) entered by the Meister during which the business is closed. It counts as a non-workday.
- Reminder: the one push notification an employee receives at 07:00 on a workday, listing their open tasks that are due today or overdue.
- Overdue workdays: the number of workdays after a task's due date, up to and including today.
- Overdue report: the push notification the Meister receives when a task reaches 3 overdue workdays (once per task and due date).

## Requirements index
| # | Title | Type | Status |
|---|---|---|---|
| 001 | Task list MVP | MVP | Built |
| 002 | Task reminders | Feature | Groomed |
