# 002 – Due dates and overdue tasks

- Type: Feature
- Status: Implemented – ready for validation
- Date: 2026-09-10
- Product context: docs/product.md

## Summary
The team writes tasks down but nothing says when they have to be finished, so the urgent ones drown between the rest. This feature lets a team member put a day on a task and see at a glance which tasks have run out of time. It changes the daily standup in front of the screen from "what is on the list" to "what is late". It matters now because the team missed two customer deadlines last month that were on the list the whole time.

## Users and roles
Unchanged: everyone is a team member and may do everything, including setting and changing a due date on any task.

## Stories

### S5 – Put a day on a task
As a team member, I want to give a task a day it has to be done by, so that the list says when, not only what.

Acceptance criteria:
- S5.1 Given the add form, when I enter a title and a day and submit, then the task is created with that day and the day is visible on the task in the list.
- S5.2 Given the add form, when I enter a title and no day and submit, then the task is created without a day and looks exactly as it did before this feature.
- S5.3 Given a task without a day, when I set a day on it, then the list shows that day for the task.
- S5.4 Given a day that is not a real date or not in the form 2026-09-19, when I submit it, then the task is not created or changed and I see a message about the date.
- S5.5 Given a day that already passed, when I submit it, then the task is created with that day. Writing down something that is already late is the point.

### S6 – See what is late
As a team member, I want late tasks to stand out, so that I see in one look what the team has to catch up on.

Acceptance criteria:
- S6.1 Given a task whose day is before today, when I open the list, then the task is marked as overdue.
- S6.2 Given a task whose day is today, when I open the list, then the task is marked as due today and is **not** marked as overdue. The day is not over yet.
- S6.3 Given a task whose day is after today, when I open the list, then the task shows its day without an overdue or due-today marking.
- S6.4 Given a task without a day, when I open the list, then it shows no day and no marking.
- S6.5 Given tasks with days, when I open the list, then tasks are ordered by day, the soonest first, and tasks without a day come last.

## Business rules
- R4 A task is **overdue** when its day lies **before** today, in the team's time zone (Europe/Berlin). A task whose day **is** today is **due today** and is not overdue. Example, with today being 2026-09-19: a task for 2026-09-18 is overdue, a task for 2026-09-19 is due today, a task for 2026-09-20 is neither.
- R5 A day is written as a full calendar date in the form YYYY-MM-DD and must be a day that exists.
- R6 A day is optional. Every task from before this feature stays valid and keeps working without one.

## Quality expectations
- QE5 The list is read from a step away, standing, on a phone. On a phone screen, a task's title and its due-date marking are large enough to read from that distance: at least 20 px.
- QE6 The colour of the overdue marking is not the only thing that says a task is late: the word is there as well, because two people in the team do not distinguish red from grey reliably.
- QE7 Adding a day must not make adding a task slower to do: the add form stays one line of inputs and one button.

## Scope
### In scope
S5, S6.
### Later
Sorting or filtering by day beyond the default order, a "this week" view.
### Out of scope
- **Recurring tasks** ("every Monday", "every month"). The stakeholder considered it and decided against it for now: "that is a different thing, it needs a whole discussion about what happens when you tick it off."
- Reminders, notifications or e-mails about tasks that are due or late.
- Times of day. A day is enough.

## Decisions
- A day, not a date and time: "nobody here needs 3 p.m." (stakeholder).
- Due today is not late: the day is still running (stakeholder, when asked directly about the boundary).
- Past days are allowed when adding: you often write something down after it was already due (stakeholder).

## Stakeholder technical constraints
None stated beyond those of 001.

## Left to architecture
- How "today" is determined so that it is the team's day and testable: the product need is R4's boundary; the mechanism is open.

## Glossary
- **Day / due date**: the calendar day a task has to be finished by.
- **Overdue**: the day lies before today (R4).
- **Due today**: the day is today (R4).

## Open questions
None.

## Appendix: Stakeholder input trace
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "We missed two deadlines that were on the list the whole time." | Summary |
| L2 | "I want to see what is late, in red, from a step away." | S6, QE5, QE6 |
| L3 | "Something due today is not late. The day is still running." | R4, S6.2, Decisions |
| L4 | "Days only. Nobody here needs 3 p.m." | R5, Decisions |
| L5 | "You often write it down when it is already late, that has to work." | S5.5 |
| L6 | "Two of us do not see red properly, write it out as well." | QE6 |
| L7 | "Recurring? No. That is a different thing, it needs a whole discussion." | Out of scope |
| L8 | "Adding a task has to stay as fast as it is." | QE7, R6 |
