# 0002 – Determine "today" on the server, overridable per request

- Status: Accepted
- Date: 2026-09-12
- Context: 002 – Due dates and overdue tasks

## Context
R4 turns on what "today" is, and its boundary (due today is not overdue) has to be tested without waiting for midnight or moving a container's clock.

## Options
### A – The browser decides
The client knows the user's day. But then every client can disagree, and an API client has no day at all.

### B – The server decides, fixed to Europe/Berlin
One answer for everyone in the one-room team, but untestable around the boundary without changing the container clock.

### C – The server decides, with a per-request override header
As B, plus `X-Today` for tests and nothing else.

## Decision
C. The team is in one office, so one server-side day is the correct answer, and the override makes R4's boundary a normal test instead of a clock trick.

## Consequences
- Acceptance tests pin the day and are stable on any day of the year.
- `X-Today` is read-only: it changes the labelling of a response, never stored data.
- A team travelling across time zones would see the office's day. That is what "the team's day" means here.
