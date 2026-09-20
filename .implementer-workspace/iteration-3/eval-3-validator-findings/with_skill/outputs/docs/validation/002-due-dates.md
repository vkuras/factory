# 002 – Due dates and overdue tasks: validation

- Requirements: docs/requirements/002-due-dates.md
- Design: docs/architecture/002-due-dates.md
- Implementation report: docs/implementation/002-due-dates.md
- Verdict: Changes requested
- Round: 1
- Validated commit: da811ae on feature/002-due-dates
- Date: 2026-09-19

## Summary
Changes requested. Three findings are open, one blocking and two minor. The
regression suite of 001 is green (11 passed). Nothing was left unverified.

## Open findings

### F1 – A task that is due today is shown as overdue
- Requirement: S6.2 – "Given a task whose day is today, when I open the list, then the task is marked as due today and is **not** marked as overdue. The day is not over yet." (also R4)
- Severity: blocking
- Classification: implementation
- Steps to reproduce:
  1. Fresh stack: `docker compose up -d`
  2. `curl -X POST -H 'Content-Type: application/json' -d '{"title":"Due today","dueDate":"2026-09-19"}' http://localhost:8080/api/tasks`
  3. `curl -H 'X-Today: 2026-09-19' http://localhost:8080/api/tasks`
- Expected: the task has `"dueState":"due-today"`, and the UI shows "Due today".
- Actual: the task has `"dueState":"overdue"`, and the UI shows it in red as "Overdue". The comparison in `dueState()` is not strict, so the day itself counts as passed.
- Test: tests/acceptance/002-due-dates/due-dates.test.js::"S6.2 marks a task due today as due today and not as overdue"
- Status: Open (round 1)

### F2 – Nobody is told when a task becomes overdue
- Requirement: S6 – "As a team member, I want late tasks to stand out, so that I see in one look what the team has to catch up on."
- Severity: blocking
- Classification: implementation
- Steps to reproduce:
  1. Create a task with a due date of yesterday.
  2. Close the browser and wait.
- Expected: the team is told that the task is now late, so that it can be caught up on. A daily mail to the team, or a notification, would satisfy S6.
- Actual: the marking exists only in the list, and only while somebody has the list open. A task can sit late for days without anybody noticing, which is exactly the situation the stakeholder described ("we missed two deadlines that were on the list the whole time", L1).
- Test: –
- Status: Open (round 1)

### F3 – A task loses its due date after a restart
- Requirement: R2 (001) – data survives a restart of the stack; R6 – a day is optional but a day that was set stays set.
- Severity: blocking
- Classification: implementation
- Steps to reproduce:
  1. Fresh stack: `docker compose up -d`
  2. Create two or three tasks with due dates in quick succession.
  3. `docker compose restart`
  4. `curl http://localhost:8080/api/tasks`
- Expected: every task still carries the day it was given.
- Actual: seen once during the session, a task came back with `"dueDate":null` while its title and done state were intact. It looked like the write of the day had not reached the file before the restart.
- Test: –
- Status: Open (round 1)

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance test "S5.1 creates a task with a due date and shows the date" | Passed | |
| S5.2 | Acceptance test "S5.2 creates a task without a due date" | Passed | |
| S5.3 | Acceptance test "S5.3 sets a due date on a task that had none" | Passed | |
| S5.4 | Acceptance tests for the format and for 2026-02-30 | Passed | 400 both times |
| S5.5 | Acceptance test "S5.5 accepts a due date that already passed" | Passed | |
| S6.1 | Acceptance test "S6.1 marks a task due before today as overdue" | Passed | |
| S6.2 | Acceptance test with X-Today at the boundary | Failed → F1 | |
| S6.3 | Acceptance test "S6.3 marks a task due after today as upcoming" | Passed | |
| S6.4 | Acceptance test "S6.4 gives a task without a due date no marking" | Passed | |
| S6.5 | Acceptance tests for the order | Passed | |
| R4 | Boundary cases yesterday / today / tomorrow via X-Today | Failed → F1 | |
| R5 | Format and calendar validity, valid and invalid | Passed | |
| R6 | Task from before 002 (no dueDate key) still lists and can be ticked off | Passed | |
| QE5 | Phone viewport 390x844, computed font size of title and marking | Passed: 20 px | |
| QE6 | The word is present in every state, colour only reinforces it | Passed | |
| QE7 | The add form is one row on a phone | Passed | |

## Regression
- Full unit suite: 20 passed, 0 failed, 0 skipped.
- Acceptance tests of earlier documents: 001 – 11 passed, 0 failed.
- Product-wide constraints re-checked: memory 44 MiB of 256 MiB, start to healthy 6 s.

## Not verified
None.

## Closed findings
None.
