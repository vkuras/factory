002 – Due dates and overdue tasks: implemented, status "Implemented – ready for validation".

Built per the design (docs/architecture/002-due-dates.md): `src/dates.js` (today/validateDueDate/dueState), dueDate on POST/PATCH, dueState decoration on GET, the new list order (S6.5), and the UI (date input in the add form and per row, "Overdue"/"Due today"/plain-day marking). Branch feat/002-due-dates, commits b4998ce..ebc2b1c.

Self-validation: 26 unit tests + 24 acceptance tests (11 regression for 001, 13 new for 002) all green; Docker stack builds, starts healthy, survives a restart with data intact; memory 21.6/256 MiB; UI walked through in the browser at phone and desktop widths. One bug found in my own diff review (title text wrapping one letter per line on a phone once the row grew a due-date input) and fixed (commit 8bdbd3a) before handover. No open gaps.

Report: docs/implementation/002-due-dates.md.
