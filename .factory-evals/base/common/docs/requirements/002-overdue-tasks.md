# 002 – Overdue tasks

- Status: __STATUS__
- Date: 2026-09-15
- Builds on: 001

## Summary
Open tasks whose due date has passed show how many working days they are overdue, and the list can be filtered to show only overdue tasks, most overdue first.

## Users and roles
Family members, as in 001.

## Stories
### S1 – See how overdue a task is
As a family member I want to see at a glance how late a task is, so that the late ones get done first.
- S1.1 An open task whose due date has passed shows the overdue label from R2 in the list.
- S1.2 A task due today or later, or without a due date, shows no overdue label.
- S1.3 The label is red, so that it stands out.

### S2 – Show only overdue tasks
As a family member I want to see only the overdue tasks, so that I can catch up on the weekend.
- S2.1 With the filter "Nur überfällige" switched on, the list shows only overdue open tasks.
- S2.2 In the filtered list the most overdue task comes first.
- S2.3 With the filter switched off, the list is exactly as in 001 (S2.1 sort order).

## Business rules
- R1 Overdue working days. A task is overdue by N working days, where N is the number of working days (Monday to Friday) after the due date up to and including today. A task is overdue when N is at least 1. "Today" is the calendar date in Europe/Berlin. Public holidays are not taken into account.
  Examples:
  | Due date | Today | N | Overdue? |
  |---|---|---|---|
  | Thu 10 Sep 2026 | Fri 11 Sep 2026 | 1 | yes |
  | Fri 11 Sep 2026 | Sat 12 Sep 2026 | 0 | no |
  | Fri 11 Sep 2026 | Mon 14 Sep 2026 | 1 | yes |
  | Wed 9 Sep 2026 | Wed 16 Sep 2026 | 5 | yes |
  | Mon 14 Sep 2026 | Mon 14 Sep 2026 | 0 | no |
- R2 Label text. N = 1: "Überfällig seit 1 Arbeitstag". N ≥ 2: "Überfällig seit N Arbeitstagen" (for example "Überfällig seit 3 Arbeitstagen").
- R3 Sort order of the filtered list: most working days overdue first; with equal N the earlier due date first.

## Quality expectations
- QE1 The overdue label is readable on a phone: at least 16 px text.
- QE2 The list, filtered or not, stays fast: with 1,000 open tasks and 10 family members using it at the same time, it answers within 300 ms (95th percentile).
- QE3 The whole product keeps using at most 1 GB of RAM on the home server.

## Scope
### In scope
- The overdue label and the filter in the existing list.
### Later
- Public holidays.
### Out of scope
- Notifications or reminders about overdue tasks.
- Snoozing or postponing tasks.

## Stakeholder technical constraints
- As 001: runs at home as Docker containers.

## Left to architecture
- Where the working days are computed (server or browser).
