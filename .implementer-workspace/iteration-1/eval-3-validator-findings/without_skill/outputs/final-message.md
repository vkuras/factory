I worked through the findings in `docs/validation/002-due-dates.md`.

## F1 – Task due today shown as overdue (blocking) — fixed
In `src/dates.js`, `dueState()` checked `dueDate <= reference` before `dueDate === reference`, so today always fell into `overdue` and the `due-today` branch was dead code. Reordered the checks (equality first). The unit test `test/dates.test.js` had encoded the same bug ("R4 marks a task due today as overdue" expected `overdue`) and was corrected to expect `due-today`.

Verified: `npm test` (21 passed) and the acceptance test `S6.2 marks a task due today as due today and not as overdue` now pass against the running stack. Manual curl check confirms `"dueState":"due-today"` for a task due today.

## F2 – Nobody is told when a task becomes overdue (blocking) — not implemented, requirements conflict
Requirements 002, "Scope > Out of scope", explicitly excludes "Reminders, notifications or e-mails about tasks that are due or late". 001's validation already confirmed "Out of scope: notifications" as passed ("no mail or push code, no outbound calls"). A proactive notification (e-mail, push, background job) would reverse that deliberate stakeholder decision and would need a third-party dependency (e.g. SMTP) the project conventions rule out ("no third-party runtime dependencies"). S6 as written (S6.1–S6.5) is already fully met by the in-list marking that ships today.

I did not build this. Instead I documented the conflict in `docs/implementation/002-due-dates.md` ("Validator findings" and "Open gaps") and recommended sending it back to requirements grooming rather than the implementation guessing a product decision.

## F3 – Task loses its due date after a restart (blocking) — fixed (hardened)
`TaskStore.flush()` in `src/store.js` wrote the whole `tasks.json` with a single `writeFileSync` — no fsync, no atomicity. A restart could catch the write mid-flight or catch data written but not yet flushed to disk, matching the validator's symptom exactly. `flush()` now writes to a temp file, fsyncs it, atomically renames it over the real file, and fsyncs the directory so the rename itself is durable.

Added regression test `test/store.test.js::"F3 keeps a due date across a reload and leaves no leftover temp file"`. Manually verified: 3 tasks with due dates created concurrently, then `docker compose restart` — all 3 due dates intact afterward.

## Verification
- `npm test`: 21/21 passed (was 20; F1 test corrected, F3 test added).
- Full acceptance suite against a freshly built stack (project `tb-i1-e3-ns`, port 8113): 001 – 11/11 passed, 002 – 13/13 passed (including S6.2, previously failing).
- Memory: 19 MiB / 256 MiB limit, stack healthy within seconds.
- Stack torn down afterward with `docker compose -p tb-i1-e3-ns down -v`.

## Commit
One commit on `feature/002-due-dates`: `303dd58 fix(002): address validator findings F1 and F3, reject F2 as scope conflict`. Changed files: `src/dates.js`, `src/store.js`, `test/dates.test.js`, `test/store.test.js`, `docs/implementation/002-due-dates.md` (bumped to round 2, with answers to all three findings and an updated self-validation table).

I did not edit `docs/validation/002-due-dates.md` itself — that is the validator's own report; the responses live in the implementation report's existing "Validator findings" table, matching the repo's convention. The validator should now re-check round 2.

Relevant paths:
- `/Users/vicokuras/workspace/mixed/factory/.implementer-workspace/iteration-1/eval-3-validator-findings/without_skill/repo/src/dates.js`
- `/Users/vicokuras/workspace/mixed/factory/.implementer-workspace/iteration-1/eval-3-validator-findings/without_skill/repo/src/store.js`
- `/Users/vicokuras/workspace/mixed/factory/.implementer-workspace/iteration-1/eval-3-validator-findings/without_skill/repo/test/dates.test.js`
- `/Users/vicokuras/workspace/mixed/factory/.implementer-workspace/iteration-1/eval-3-validator-findings/without_skill/repo/test/store.test.js`
- `/Users/vicokuras/workspace/mixed/factory/.implementer-workspace/iteration-1/eval-3-validator-findings/without_skill/repo/docs/implementation/002-due-dates.md`
