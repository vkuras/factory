# 002 – Find a task: validation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Implementation report: docs/implementation/002-find-a-task.md
- Verdict: Changes requested (F1 needs the architect first, gap G1)
- Round: 1
- Validated commit: 6616b98 on main
- Date: 2026-09-19

## Summary
Changes requested. The search does not do what 002 asks for: it matches only a
case-sensitive prefix of the title, so the stakeholder's own example — typing
"milk" with 50 tasks containing "milk" in the list — shows "No task matches
"milk"." (F1, blocking). F1 comes from the design, not from the implementer, so
it is filed as gap G1 for the architect; the design's performance reason for it
does not survive measurement. Two minor implementation findings follow (F2
unbounded request duplication per keystroke, F3 the documented seeding command
crashes). Everything else passed: S5.4, S5.5, S6.1, S6.3, R5, the out-of-scope
list, QE5 (p95 3.92 ms at 10 concurrent searchers over 500 tasks), QE6 (28 MiB
of 256 MiB) and QE7. The regression is green: 15 of 15 unit tests, 11 of 11
acceptance tests of 001, and the 001 constraints R2, QE1, QE3, QE4 re-checked
with 500 tasks.

## Open findings

### F1 – The search finds only titles that start with the text, and only in the exact case
- Requirement: R4 – "A search matches when the typed text occurs anywhere in the
  task's title, comparing without regard to upper and lower case. "milk" matches
  "Buy Milk", "Order milk crate" and "MILK"." Also S5.1, S5.2 ("Given a task
  "Buy Milk", when I search for "milk", then I see it. Upper and lower case make
  no difference."), S5.3 ("The text may sit anywhere in the title, not only at
  its start.") and S6.2.
- Severity: blocking
- Classification: design (gap G1 in docs/architecture/.gaps/002-find-a-task.md)
- Steps to reproduce:
  1. Fresh stack: `cp .env.example .env`, `docker compose up -d`, wait for healthy.
  2. Create the requirement's own examples:
     `curl -sX POST localhost:8080/api/tasks -H 'Content-Type: application/json' -d '{"title":"Buy Milk"}'`
     and the same for `Order milk crate` and `MILK`.
  3. `curl -s 'localhost:8080/api/tasks?q=milk'`
  4. In the browser, type `milk` into the search field.
- Expected: all three tasks are returned in step 3, and the browser lists them in
  step 4 (S5.2, S5.3, R4).
- Actual: step 3 answers `{"tasks":[],"query":"milk","openOnly":false}`; the
  browser shows `No task matches "milk".` while the unfiltered list holds 50
  tasks containing "milk". Only an exact, case-identical prefix matches:
  `?q=Call the milk` returns 5 tasks, `?q=call` returns none.
  Evidence: `docs/validation/002-find-a-task/f1-match-rule.txt`.
- Test: tests/acceptance/002-find-a-task/search.test.js::"R4 "milk" matches "Buy
  Milk", "Order milk crate" and "MILK"" (plus the S5.1, S5.2, S5.3, S6.2 and
  upper-case R4 tests, 6 failing in total)
- Note for the implementer: this is not yours to guess at. `src/search.js`
  implements exactly what the design specifies. The design must change first
  (G1); the requirement's rule is
  "title contains the text, compared without regard to case". The performance
  argument the design gives for the prefix match does not hold: measured on this
  stack, the unfiltered 500-task response — larger than anything the required
  rule produces — answers at p95 5.22 ms against the 500 ms of QE5.
- Status: Open (round 1)

### F2 – Every add, done or delete multiplies the requests of each later keystroke
- Requirement: QE5 – "The list holds up to 500 tasks in daily use, and up to ten
  people in the room search at the same time. Under that load a search still
  feels instant: 95 out of 100 searches answer in under half a second."
- Severity: minor
- Classification: implementation
- Steps to reproduce:
  1. Fresh stack, open http://localhost:8080 in a browser with the network tab open.
  2. Add a task, tick a task off and delete a task (three actions).
  3. Type one character into the search field.
- Expected: one `GET /api/tasks?...` per keystroke, as the design's "every
  keystroke triggers a request" says.
- Actual: four `GET /api/tasks?...` for that single keystroke, and the number
  grows by one with every further add/done/delete in the same tab, without limit.
  Measured: 4 requests per keystroke after three "done" clicks
  (`docs/validation/002-find-a-task/f2-request-amplification.txt`).
  Cause: `public/app.js` — `toggle()`, `destroy()` and the submit handler each
  contain `await searchInput.addEventListener('input', () => load()); openOnlyInput.addEventListener('change', () => load()); load();`
  where a plain `await load();` was meant, so each action registers another
  listener.
- Why it is only minor: with ten concurrent users and ten requests per keystroke
  the stack still answers at p95 9.96 ms, so QE5 is not breached today. The
  growth is unbounded, and a tab left open all day in the room is the normal case
  for this product, so it should not be left in.
- Test: not automatable through the black-box HTTP suite (a browser-side defect);
  the measurement above reproduces it.
- Status: Open (round 1)

### F3 – The documented seeding command crashes before it does anything
- Requirement: 002 QE5 – the 500-task situation the requirement names has to be
  reproducible; the implementation report documents `node scripts/seed.js 500
  http://localhost:8080` as the way to produce it, and cites it as the evidence
  for QE5 ("Self-validation 9").
- Severity: minor
- Classification: implementation
- Steps to reproduce:
  1. Fresh stack, `docker compose up -d`.
  2. `node scripts/seed.js 500 http://localhost:8080` (node 22 or 24).
- Expected: 500 tasks are created, as the implementation report's "How to run" says.
- Actual: the script does not start:
  `SyntaxError: Unexpected token '||'` at `scripts/seed.js:4`,
  `const baseUrl = process.argv[3] ?? process.env.BASE_URL || 'http://localhost:8080';`
  — `??` and `||` may not be mixed without parentheses. This is a parse error, so
  the script fails with any arguments. Validation seeded the 500 tasks with an
  equivalent local script instead.
- Test: none (a repo script, not a product interface).
- Status: Open (round 1)

## Coverage
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance test "S5.1 returns only tasks whose title contains the search text" | Failed → F1 | f1-match-rule.txt |
| S5.2 | Acceptance test "S5.2 ignores upper and lower case" | Failed → F1 | f1-match-rule.txt |
| S5.3 | Acceptance test "S5.3 matches text anywhere in the title" | Failed → F1 | f1-match-rule.txt |
| S5.4 | Acceptance test "S5.4 clearing the search text shows the whole list again" (empty `q` and no `q`) | Passed | |
| S5.5 | Acceptance test "S5.5 … empty result, not an error" + browser: `No task matches "milk".`, not a blank area | Passed | browser at 375x812 |
| S6.1 | Acceptance test "S6.1 "open only" returns only tasks that are not done" | Passed | |
| S6.2 | Acceptance test "S6.2 … only matching open tasks" | Failed → F1 (the text half of the filter) | |
| S6.3 | Acceptance test "S6.3 switching "open only" off shows the done tasks again" + browser | Passed | |
| R4 | Acceptance tests with the requirement's three examples + an upper-case query | Failed → F1 | f1-match-rule.txt |
| R5 | Acceptance tests: a second client's unfiltered view is unchanged; the stored list is identical before and after searching | Passed | |
| QE5 (500 tasks, 10 searchers, p95 < 500 ms) | k6, 10 VUs, 3 min, scenario "open the list, type a four-letter query, read it", think times, 500 tasks | Passed: p95 3.92 ms, 0 % errors — but measured on the F1 match rule, re-measure after the fix | qe5-load-test.txt |
| QE6 (≤ 256 MB) | `docker stats` sampled every 5 s during the load test, plus OOM/restart check | Passed: max 28.02 MiB / 256 MiB, OOMKilled false, 0 restarts | qe6-memory.txt |
| QE7 (one field above the list, no page, no button) | Acceptance test on the served markup + browser at 375x812: field and "open only" in one row above the list, search runs while typing, no button | Passed | ui-phone-list.png |
| Out of scope: fuzzy matching | Acceptance test "the search is not typo tolerant" (`q=mlik`) | Passed: no match | |
| Out of scope: searching other fields | Acceptance test: `q` with an id and with `false` | Passed: no match | |
| Out of scope: sorting options | Acceptance test: `?sort=title&order=asc` has no effect; no sort control in the UI | Passed | |
| 001 QE1 (phone) | Browser 375x812: single column, no horizontal scrolling (scrollWidth 375), search font 18 px, row height 44 px, checkbox 24 px | Passed | ui-phone-list.png |
| 001 QE3 (English) | Every visible text and API message, incl. the new ones ("Find a task", "Open only", "No task matches …") | Passed | |
| 001 QE4 (instant list and add) | 20 runs with 500 tasks: list p95 5 ms, filtered list p95 5 ms | Passed | |
| 001 R2 (survives a restart) | 500 tasks, `docker compose down` (no `-v`) + `up` | Passed: 500 tasks still there | |
| 001 R3, S1–S4 | Acceptance tests of 001 + unit suite | Passed | |
| Security/privacy | `.env` untracked, only port 8120→8080 published, no outbound calls, no secrets in the code | Passed | |

## Regression
- Full unit test suite (`npm test`): 15 passed, 0 failed, 0 skipped.
- Acceptance tests of earlier documents: 001-task-list 11 passed, 0 failed
  (re-run after the `down`/`up` restart, with 500 tasks in the list).
- Acceptance tests of 002: 11 passed, 6 failed (all six are F1).
- Product-wide constraints re-checked with the feature included: memory 28.02 MiB
  of 256 MiB (001 QE2), list latency p95 5 ms at 500 tasks (001 QE4), data
  survives `down` + `up` (001 R2), start to healthy 12 s with one command.

## Not verified
- None of the requirements. Two environment notes, neither of which hides a
  requirement: `.env` could not be written in this sandbox, so the stack was
  started with `PORT=8120 docker compose -p tb-e2-ws up -d`, which is the same
  path the `.env` file feeds; and the UI checks were done with a headless Chrome
  container and the browser pane rather than Playwright, because the npm
  registry is unreachable here.

## Observations
- The search sends a request per keystroke with no ordering guard, so on a slow
  connection an earlier response can arrive last and show results for a text the
  field no longer holds. No requirement covers it, and it is invisible on the
  office LAN (p95 4 ms). Worth a debounce or a request counter when F2 is fixed.
- The implementation report marks S5.2, S5.3 and R4 as "Passed as designed" and
  the unit tests assert the case-sensitive prefix behaviour. Once G1 is resolved,
  `test/search.test.js` has to change with it, and those rows are claims that the
  next round should not inherit.
- At 375 px the "open only" label sits right at the edge of the row. It fits and
  is tappable (44 px), but there is no margin left for a longer word.

## Closed findings
None.
