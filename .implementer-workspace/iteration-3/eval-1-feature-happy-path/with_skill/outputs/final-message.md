002 – Due dates and overdue tasks: implemented, ready for validation.

Built: `src/dates.js` (today/validateDueDate/dueState), `dueDate` on POST/PATCH `/api/tasks`, `dueState` decoration + `X-Today` override on GET, due-date ordering in `store.list()`, and the UI (add-form date input, per-row marking, per-row date edit for S5.3).

Self-validation (all against `docker compose -p tb-i3-e1-ws`, port 8141): 34/34 unit tests, 11/11 regression acceptance tests (001, untouched), clean image build, stack healthy in ~9s, data survives restart, 16.5 MiB / 256 MiB memory, own diff review clean. Verified live in the browser at 375×812: added a task with a date through the real form, set a date on an existing task through its row control and watched it become "Overdue" and re-sort, and measured (not eyeballed) title/marking font-size = 20px (QE5), overdue colour+bold+word (QE6), and the add form's three fields sharing one row (QE7).

One implementation choice beyond the design: the design didn't specify how a team member changes the due date of an existing task in the UI (S5.3), only that the API accepts it. Added a small native date input per row, consistent with the existing checkbox pattern; not sent to the architect since it's a UI-interaction detail, not an API/data/architecture change.

One bug caught only by actually looking at the phone-sized page (not by reading the CSS): the new row controls squeezed the title into a 1-letter-per-line column. Fixed by letting the row wrap and giving the title a minimum width.

Status set to "Implemented – ready for validation" in the requirements doc and product.md. Report: docs/implementation/002-due-dates.md. No open gaps.
