002 – Due dates and overdue tasks: built and self-validated, status Implemented – ready for validation.

What was built: `src/dates.js` (today/validateDueDate/dueState), POST/PATCH accepting an optional `dueDate`, GET decorating tasks with `dueState`, `store.list()` ordering by due date within the open/done groups, and the UI (date input in the add form, "Overdue"/"Due today"/plain-day marking per row, 20 px on phone). Report: docs/implementation/002-due-dates.md.

Self-validation: 28/28 unit tests, clean docker build/up (healthy, no errors), 001's regression suite green against the running stack, data survived a restart, memory 18/256 MiB, and a walk-through of every story through curl and the browser (375 px and desktop). Found and fixed a real CSS bug during validation: the date input and the due-date marking were squeezing the task title into unreadable vertical text on a phone; fixed and re-verified.

One design note, not a gap: S5.3 (setting a day on an existing task) has no dedicated UI control, because the design's component table names only two UI changes (the add-form date input and the per-row marking) and maps S5.3 solely to PATCH — covered via the API and curl, not a browser control.

No open gaps, no validator findings yet (round 1). Branch feat/002-due-dates, commits be0e950..f0eb0e3.
