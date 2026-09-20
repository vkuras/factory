002 – Due dates: validator findings addressed. Status: Ready for validation (round 2).

- F1 (task due today shown as overdue): bug, fixed. `dueState()` used `<=` so the overdue branch matched today before the due-today check ran. Changed to strict `<`. The existing unit test had encoded the wrong behaviour; corrected it.
- F2 (nobody told when a task becomes overdue): not a defect. Requirements explicitly put this out of scope ("Reminders, notifications or e-mails about tasks that are due or late."). Not built.
- F3 (due date lost after restart): bug, fixed. `TaskStore.flush()` truncated `tasks.json` in place; a kill mid-write could corrupt it. Now writes to a temp file and renames it into place (atomic). Added a regression test. Could not reproduce the exact reported symptom even under repeated SIGKILL + concurrent writes, but the non-atomic write was a real gap against R2 and is now closed.

Full self-validation rerun (project `tb-i3-e3-ws`, port 8143): unit tests 21/21 passed (was 20, +1 for F3), both acceptance suites green (001: 11/11, 002: 13/13, including S6.2), stack healthy in ~2s, 5 rounds of concurrent writes + SIGKILL + restart with no data loss, memory 16.7/256 MiB. The shared browser pane was at its tab cap, so QE5/QE6/QE7 and the UI flow (add/error/toggle/delete) were verified with a headless Chromium against the running stack instead: title/marking 20px, marking carries the word not just colour, add form is one row, no sideways scroll. Stack torn down.

Details: docs/implementation/002-due-dates.md (round 2).
