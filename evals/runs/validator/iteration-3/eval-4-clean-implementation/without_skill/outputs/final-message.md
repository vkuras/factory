# 002 – Due dates and overdue tasks: Validated

**Verdict: Validated, round 1. No open findings. The feature can ship.**

## What I did
Built and ran the stack from the repo (`PORT=8145 docker compose -p tb-e4c-ns up -d --build`)
and validated 002 black-box against it, then tore it down (`down -v`).

- Added 16 acceptance tests in `tests/acceptance/002-due-dates/due-dates.test.js`, one per
  acceptance criterion plus the business rules. The R4 boundary is driven through the
  `X-Today` header of ADR-0002, and once **without** it so the server's own Europe/Berlin
  day is exercised too.
- `tests/acceptance/helpers.js` gained an optional fourth argument for request headers.
  Existing calls are unaffected.
- Checked the UI in headless Chromium at 390x844 with computed styles, not by eye.

## Results
- **Acceptance suite (regression): 27 passed, 0 failed, 0 skipped** — 001 11, 002 16.
- **Unit tests: 20 passed, 0 failed, 0 skipped.**
- Every criterion of S5 and S6, every business rule R4–R6 and every quality expectation
  QE5–QE7 passed. Details in `docs/validation/002-due-dates.md`.

Highlights:
- R4 boundary holds in both directions: 2026-09-18 → `overdue`, 2026-09-19 → `due-today`
  (not overdue), 2026-09-20 → `upcoming`.
- S5.4: all 8 malformed days I tried (2026-02-30, 2026-13-01, 2026-09-31, 19.09.2026,
  2026/09/19, tomorrow, 2026-9-1, 2026-09-19T10:00:00Z) return 400 with a message about the
  date, and a rejected PATCH leaves the old day intact.
- R6: I wrote a `tasks.json` with records that have **no** `dueDate` key into the volume and
  restarted. Both read back fine as `dueState: none`, and one could be given a day afterwards.
- QE5: title 20 px **and** marking 20 px in every row at 390x844.
  QE6: the word is always there — "Overdue 2026-09-18", "Due today 2026-09-19",
  "Due 2026-09-26" — so the colour is only reinforcement.
  QE7: the add form is one row (all three children at the same y, 44 px high, one button),
  no horizontal page scroll.
- Product-wide 001 constraints re-checked: persistence over `down`/`up` survived with due
  dates, memory peaked at 28.4 MiB of 256 MiB, `GET /api/tasks` with 203 tasks is p95 1.4 ms,
  all text English.
- Out of scope confirmed absent: no recurrence code, no reminders/mail/push, no time of day
  (a `dueDate` with a time is rejected, a `dueTime` field is dropped).

## Observations (no action required)
- `X-Today` is not validated; a nonsense value is compared as a string and silently produces
  a state. It cannot write anything and only relabels one response, so no requirement is
  violated, but a 400 on a malformed header would be tidier.
- The 20 px rule sits behind a `max-width: 480px` media query, so a phone in landscape falls
  back to 18/14 px. QE5's "read standing, on a phone" is the portrait case, so this passes.
- At 390 px the title input is 109 px wide, the direct cost of QE7's one-row rule.

## Files
- `docs/validation/002-due-dates.md` (full coverage table)
- `docs/validation/002-due-dates/list-phone-390x844.png` (phone evidence)
- `tests/acceptance/002-due-dates/due-dates.test.js` (new), `tests/acceptance/helpers.js` (headers arg)
- `docs/requirements/002-due-dates.md` status set to `Validated`

Not verified: a real midnight rollover (that is exactly what `X-Today` exists to avoid), and
the native date picker's own UI on a physical phone (it is the platform's, not the product's).
