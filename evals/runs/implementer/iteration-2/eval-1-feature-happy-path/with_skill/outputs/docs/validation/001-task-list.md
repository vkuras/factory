# 001 – Task list: validation

- Requirements: docs/requirements/001-task-list.md
- Design: docs/architecture/001-task-list.md
- Implementation report: docs/implementation/001-task-list.md
- Verdict: Validated
- Round: 1
- Validated commit: e4f5a6b on feature/001-task-list
- Date: 2026-08-19

## Summary
Validated. Every acceptance criterion, business rule and quality expectation of 001 was checked against the running stack and passed; there are no open findings. The regression suite is the 11 acceptance tests introduced here, all green.

## Open findings
None.

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S1.1 | Acceptance tests "S1.1 adds a task ...", "S1.1 shows the new task in the list" | Passed | |
| S1.2 | Acceptance test "S1.2 rejects an empty title with a message" | Passed | 400, "A title is required." |
| S1.3 | Acceptance tests at 200 and 201 characters | Passed | 201 / 400 at the boundary |
| S2.1 | Acceptance test "S2.1 lists the newest open task first" | Passed | |
| S2.2 | Manual: empty list in the browser | Passed | "No tasks yet." |
| S3.1 | Acceptance test "S3.1 marks a task as done" | Passed | |
| S3.2 | Acceptance test "S3.2 sorts done tasks below open ones" + manual | Passed | Struck through and grey |
| S4.1 | Acceptance test "S4.1 deletes a task" | Passed | |
| S4.2 | Acceptance test "S4.2 reports deleting a task that does not exist" | Passed | 404 |
| R1 | Boundary cases 0, 1, 200, 201 characters and spaces only | Passed | |
| R2 | `docker compose down` + `up` (no `-v`), then GET /api/tasks | Passed | 3 tasks still present |
| R3 | Two browsers on the same stack see the same list | Passed | |
| QE1 | Phone viewport 390x844: single column, computed font size 18 px, row height 44 px | Passed | screens/list-phone.png |
| QE2 | `docker stats` during the acceptance run | Passed | peak 44 MiB / 256 MiB |
| QE3 | Every visible text and API message | Passed | English throughout |
| QE4 | GET /api/tasks with 200 tasks, 20 runs | Passed | p95 9 ms |
| Out of scope: accounts | No login, no user field in the API | Passed | |
| Out of scope: several lists | One list only | Passed | |
| Out of scope: notifications | No mail or push code, no outbound calls | Passed | |

## Regression
- Full test suite: 10 passed, 0 failed, 0 skipped.
- Acceptance tests of earlier documents: none (001 is the first).
- Product-wide constraints re-checked: memory 44 MiB of 256 MiB, start to healthy 6 s.

## Not verified
None.

## Observations
- Deleting has no undo, as decided. Worth watching whether the team hits it.

## Closed findings
None.
