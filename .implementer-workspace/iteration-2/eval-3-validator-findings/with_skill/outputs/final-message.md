All three findings from docs/validation/002-due-dates.md are addressed:

- **F1 (Bug, blocking)**: `dueState()` wrongly treated "due today" as overdue (`<=` instead of `<`). Fixed in `src/dates.js`, and fixed the unit test that had encoded the same bug. Regression test: `test/dates.test.js::"R4 marks a task due today as due today, not overdue"`, and the acceptance check `S6.2` is now green.
- **F2 (Not a defect)**: Notifications/e-mails about due or late tasks are explicitly out of scope per the requirements ("Reminders, notifications or e-mails about tasks that are due or late."). Not built.
- **F3 (Not reproducible)**: Tried multiple times (plain restart, 5 rounds of concurrent POSTs immediately followed by `restart`) and reviewed the write path (every mutation flushes synchronously, no race window). No data loss occurred in any attempt.

Self-validation round 2 fully green: 20 unit tests, 24 acceptance tests (001 + 002), stack starts healthy in ~6s, data survives a restart, memory 18.6 MiB/256 MiB, diff is clean. Commit `7db4c6b` on `feature/002-due-dates`; status stays "Implemented – ready for validation".
