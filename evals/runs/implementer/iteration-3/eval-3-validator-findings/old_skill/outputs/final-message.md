Fixed the validator's findings on 002. Status: Ready for validation (round 2), commit 81ac13d on feature/002-due-dates.

- F1 (bug, blocking): `dueState()` used `dueDate <= reference` so a task due today matched "overdue" before "due-today" was ever checked. Fixed to strict `<`. Also corrected `test/dates.test.js`, whose existing test had been written to assert the buggy result instead of R4.
- F2 (not a defect): asks for notifications/e-mails about late tasks. Requirements explicitly list that as out of scope. Not built.
- F3 (not reproducible): tried sequential and concurrent creates + restart, and repeated SIGKILL-mid-burst kills, against a fresh stack. Due dates always survived. No fix made; report documents exactly what was tried.

Self-validation re-run in full and green: 20 unit tests, 24 acceptance tests (001 + 002, including S6.2), clean build, stack healthy in 5s, data survives restart, memory 16.4/256 MiB, diff review clean. UI was fetched (200s, correct content) but not clicked through in a browser this round — the shared browser pane had no free tab and I avoided closing other runs' tabs; nothing in this round's diff touches the UI. Details in docs/implementation/002-due-dates.md.
