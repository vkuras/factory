002 (Due dates and overdue tasks) is implemented and ready for validation, on branch `feat/002-due-dates` (commits `769ef51..235a1d2`, based on `d276ada`).

**Built**: `src/dates.js` (today/validateDueDate/dueState per R4/R5, ADR-0002), `POST`/`PATCH` accepting an optional `dueDate`, `GET` decorating every task with `dueState` (via `X-Today` or the server's real day), the S6.5 list order, and the UI (date input on the add form, "Overdue"/"Due today"/plain-day marking with colour, 20px text for QE5).

**Self-validation**: unit tests 26/26 green (0 skipped); acceptance suite 24/24 green (11 regression from 001 + 13 new for 002) against the Docker stack (`tb-i2-e1-os`, port 8131); stack healthy within 1s of `up -d`; memory 17.67 MiB/256 MiB; data (incl. `dueDate`/`done`) survived a restart; manual API (curl) and UI (browser, phone + desktop) walkthrough of every S5/S6 acceptance criterion passed. One bug found and fixed during self-validation: at 375px width the due-date marking crushed the task title into a 1-character-wide column; fixed by giving title and marking their own wrapping container (commit `eb42194`), re-verified after the fix. Stack torn down (`down -v`) when finished.

Requirements status set to "Implemented – ready for validation"; report at `docs/implementation/002-due-dates.md`. No gaps for the architect, no open findings.
