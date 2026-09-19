# 002 – Find a task: validation

- Requirements: docs/requirements/002-find-a-task.md
- Design: docs/architecture/002-find-a-task.md
- Implementation report: docs/implementation/002-find-a-task.md
- Verdict: Blocked – waiting for architecture
- Round: 1
- Validated commit: f44ad9d on main
- Date: 2026-09-19

## Summary
One blocking finding, no minor ones. The feature's central rule is wrong in the
product: searching for "milk" over a list full of tasks containing "milk"
returns nothing, because the design specifies a case-sensitive prefix match
while S5.2, S5.3 and R4 require a case-insensitive match anywhere in the title.
The implementer built the design faithfully, so this is a design defect, raised
as gap G1 in `docs/architecture/.gaps/002-find-a-task.md`. Everything else
passed: S5.4, S5.5, S6.1–S6.3, R5, the out-of-scope items, and the
non-functional expectations (QE5 p95 3.82 ms at 500 tasks and 10 concurrent
searchers, QE6 peak 28.1 MiB of 256 MiB, QE7 one field above the list). The
regression is green: 15 unit tests and the 11 acceptance tests of 001 pass, and
data still survives `down` + `up`.

## Open findings

### F1 – The search finds nothing unless the typed text is the exact start of the title
- Requirement:
  - S5.3 – "Given a task \"Buy milk\", when I search for \"milk\", then I see it. The text may sit anywhere in the title, not only at its start."
  - S5.2 – "Given a task \"Buy Milk\", when I search for \"milk\", then I see it. Upper and lower case make no difference."
  - R4 – "A search matches when the typed text occurs anywhere in the task's title, comparing without regard to upper and lower case. \"milk\" matches \"Buy Milk\", \"Order milk crate\" and \"MILK\"."
  - S5.1 – "Given the list, when I type text into the search field, then I see only tasks whose title contains that text."
- Severity: blocking
- Classification: design (gap G1 in `docs/architecture/.gaps/002-find-a-task.md`)
- Steps to reproduce:
  1. Fresh stack: `cp .env.example .env && docker compose up -d`, wait for the app to be healthy.
  2. Create the stakeholder's three tasks:
     ```
     curl -s -X POST -H 'Content-Type: application/json' -d '{"title":"Buy Milk"}'         http://localhost:8080/api/tasks
     curl -s -X POST -H 'Content-Type: application/json' -d '{"title":"Order milk crate"}' http://localhost:8080/api/tasks
     curl -s -X POST -H 'Content-Type: application/json' -d '{"title":"Milk bill"}'        http://localhost:8080/api/tasks
     ```
  3. Search the way the stakeholder demonstrated it: `curl -s 'http://localhost:8080/api/tasks?q=milk'`
  4. In the browser at http://localhost:8080, type `milk` into the search field.
- Expected: all three tasks are returned and shown. The text may sit anywhere in
  the title and upper/lower case makes no difference (S5.2, S5.3, R4, and the
  requirements' Notes: "the stakeholder demonstrated this by typing \"milk\" and
  expecting \"Buy Milk\", \"Order milk crate\" and \"Milk bill\" to appear").
- Actual: nothing is returned and the UI shows `No task matches "milk".`
  ```
  $ curl -s 'http://localhost:8122/api/tasks?q=milk'
  {"tasks":[],"query":"milk","openOnly":false}
  $ curl -s 'http://localhost:8122/api/tasks?q=Milk'
  {"tasks":[{"id":3,"done":false,"title":"Milk bill"}],"query":"Milk","openOnly":false}
  ```
  Only a title that *begins* with the typed text, in exactly the typed case, is
  found. `src/search.js` does `task.title.startsWith(query)`, which is what the
  design's "Interfaces" section specifies. Evidence:
  `docs/validation/002-find-a-task/README.md`,
  `docs/validation/002-find-a-task/ui-measurements.md` (last row).
- Why this is a design finding, not an implementation one: the design decides
  "The match is a **prefix match on the title, compared case-sensitively**" and
  states "Requirement conflicts: None". It justifies this with QE5, arguing that
  avoiding string normalisation is "what makes QE5 comfortable rather than
  tight". The measurement contradicts that justification: the required
  case-insensitive substring match costs 0.0147 ms for a full scan of 500
  titles against 0.0040 ms for the designed one
  (`docs/validation/002-find-a-task/match-rule-cost.txt`), and the measured
  search p95 is 3.82 ms against a 500 ms budget. There is no conflict between
  R4 and QE5 to trade off; the design simply dropped R4. The requirement wins
  over the design.
- Test: `tests/acceptance/002-find-a-task/search.test.js` –
  "S5.1 shows only tasks whose title contains the search text",
  "S5.2 ignores upper and lower case: \"milk\" finds \"Buy Milk\"",
  "S5.2 ignores upper and lower case in the other direction: \"MILK\" finds \"Buy milk\"",
  "S5.3 matches text anywhere in the title, not only at its start",
  "S5.3 the stakeholder example: \"milk\" finds all three spellings",
  "R4 matches case-insensitively anywhere: \"milk\" finds \"MILK\"" (6 red tests).
- Status: Open (round 1)

## Coverage

| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S5.1 | Acceptance test "S5.1 shows only tasks whose title contains the search text" | Failed → F1 | |
| S5.2 | Acceptance tests "milk" → "Buy Milk" and "MILK" → "Buy milk" | Failed → F1 | |
| S5.3 | Acceptance tests "matches text anywhere" + the stakeholder's three-title example | Failed → F1 | README.md |
| S5.4 | Acceptance test "an empty search text shows the whole list again" + UI: cleared the field, 500 tasks back | Passed | ui-measurements.md |
| S5.5 | Acceptance test (empty result + echoed query) + UI: `No task matches "zzzqqq".`, the 001 empty state stays hidden | Passed | ui-measurements.md |
| S6.1 | Acceptance test "\"open only\" hides tasks that are done" + UI checkbox | Passed | ui-measurements.md |
| S6.2 | Acceptance test "\"open only\" combines with the search text" | Passed | |
| S6.3 | Acceptance test + UI: unchecking shows the done task again | Passed | ui-measurements.md |
| R4 | Acceptance tests: the three spellings, "MILK", a non-matching text | Failed → F1 | |
| R5 | Acceptance test (a second client sees the whole list) + `md5sum /data/tasks.json` before and after two searches: unchanged (`d59d5ff2…`) | Passed | |
| QE5 (500 tasks, 10 concurrent searchers, p95 < 500 ms) | k6, 10 VUs, 3 min, 500 tasks, scenario "open the list, type a four-letter query keystroke by keystroke, switch open-only on", with think times | Passed: search p95 3.82 ms, avg 2.09 ms, max 12.52 ms, 2340 requests, 0 % errors | qe5-k6-summary.txt, perf/search-load.js |
| QE6 (≤ 256 MB) | `docker stats` sampled every 5 s during the load test; `OOMKilled` and restart count checked | Passed: peak 28.1 MiB of 256 MiB (10.98 %), no restart, no OOM | qe6-docker-stats.txt |
| QE7 (one field above the list, no page, no button) | Rendered geometry at 375x812: search field at y=157, list at y=225, no search button, request per `input` event | Passed | ui-measurements.md |
| Out of scope: fuzzy matching | Acceptance test: "mlik" and "milc" match nothing | Passed | |
| Out of scope: searching other fields | Acceptance test: the id and the done state are not searchable | Passed | |
| Out of scope: sorting options | Acceptance test: `?sort=title` does not change the order; no sort control in the UI | Passed | |

## Regression

- Full test suite: `node --test test/*.test.js` – 15 passed, 0 failed, 0 skipped.
- Acceptance tests of earlier documents: 001-task-list – 11 passed, 0 failed.
- Acceptance tests of this document: 002-find-a-task – 11 passed, 6 failed (all six are F1).
- Product-wide constraints re-checked with the feature included:
  - 001 R2 (data survives a restart): `docker compose down` + `up` (no `-v`) with 500 tasks → 500 tasks still present. Passed.
  - 001 QE4 (opening the list feels instant): `GET /api/tasks` with 500 tasks, 20 runs → p95 5.6 ms, max 14.0 ms. Passed.
  - 001 QE1 (phone, tap targets): at 375x812 the new row keeps the 001 sizes, 18 px text and a 44 px row height. Passed.
  - 001 QE2/QE3 (memory budget, English): covered by QE6 above and by the UI text check. Passed.
  - Security/privacy: only port 8122 is published, `.env` is git-ignored, no secrets in the repo, a query writes nothing.

## Not verified

- None of the requirements of 002. Two environment notes, neither of which
  blocks a requirement:
  - The host this validation ran on forbids writing a file named `.env`, so the
    documented `cp .env.example .env` was replaced by an equivalent
    `--env-file` with the same two variables (`PORT`, `DATA_DIR`), and the app
    was published on port 8122 instead of 8080 to avoid a port collision. Build,
    start and health behaved exactly as documented otherwise.
  - The target CPU architecture is not stated in the requirements or the design,
    so the image was built and run only for this host's architecture.

## Observations

- The implementer's unit tests in `test/search.test.js` assert the designed
  behaviour ("the query is compared case-sensitively", "the query matches the
  start of the title"). They will have to change with the fix; they are not a
  finding, because the implementer built what the design says.
- The UI sends one request per keystroke with no debouncing, as the design
  decided. It is comfortably inside QE5 at this size, but it means a five-letter
  word is five list transfers of the whole filtered result.
- `docs/architecture/002-find-a-task.md` claims "Requirement conflicts: None"
  while specifying a rule that contradicts three requirements. Worth a second
  look at how that section is filled in, beyond fixing G1 itself.

## Closed findings

None.
