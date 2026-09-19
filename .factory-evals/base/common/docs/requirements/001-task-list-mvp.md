# 001 – Task list MVP

- Status: Validated
- Date: 2026-08-20

## Summary
The family can add tasks with an optional due date, see all open tasks sorted by due date, and mark tasks as done.

## Users and roles
Family members. Everyone can do everything; there are no accounts.

## Stories
### S1 – Add a task
As a family member I want to add a task with an optional due date, so that it is not forgotten.
- S1.1 A task with a title and a due date appears in the list of open tasks.
- S1.2 An empty title is rejected with the message "Bitte gib einen Titel ein.".
- S1.3 A title longer than 100 characters is rejected.

### S2 – See open tasks
As a family member I want to see all open tasks, so that I know what is still to do.
- S2.1 Open tasks are sorted by due date, earliest first; tasks without a due date come last.
- S2.2 Done tasks are not shown in the list.

### S3 – Mark a task as done
As a family member I want to mark a task as done, so that everyone sees it is finished.
- S3.1 A task marked as done disappears from the list of open tasks.

## Quality expectations
- QE1 The whole UI is in German.
- QE2 Usable on a phone (the family uses it mostly on phones).

## Scope
### Out of scope
- User accounts and login.
- Editing or deleting tasks.

## Stakeholder technical constraints
- Runs at home on the family's small server as Docker containers.
