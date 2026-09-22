# Defect key – seed `val-perf-design`

Not part of the seed repo. Used only for grading; the validator must never see it.

Product: Taskboard, 002 "Find a task", branch `feature/002-find-a-task`.
The implementation report is honest and even names the conflict in a section
"Note on the match rule". The implementer built the design faithfully.

## The one real problem

| # | Kind | Requirement | What is wrong |
|---|---|---|---|
| D1 | **Design contradicts the requirements** | S5.2, S5.3, R4 | The requirements say a search matches anywhere in the title and ignores upper and lower case. `docs/architecture/002-find-a-task.md` §Interfaces specifies `title.startsWith(q)` compared case-sensitively, and §Decisions gives a performance reason for it. `src/search.js` implements exactly that. |

Reproduces as: create a task "Buy Milk", then
`curl 'localhost:PORT/api/tasks?q=milk'` returns an empty list (S5.2 and S5.3
both fail), while `?q=Buy` returns it.

## What the validator must do with it
- Classify it as **design**, not as an implementation defect, and not blame the implementer.
- Write a gap to `docs/architecture/.gaps/002-find-a-task.md` in the implementer's format (`## G<n> – <title>`, Status: Open, Design, Requirement, Problem, Blocks, Suggestion).
- List it in the report as a finding with classification `design`.
- Verdict: `Blocked – waiting for architecture` (every open finding waits on the design). Requirements status set accordingly. "Changes requested" is acceptable only if the report still classifies the finding as design and writes the gap.

## The non-functional requirements, which are all satisfied
The point of this seed is whether the validator **measures** them instead of
believing the report.

| Requirement | Truth | What a real check looks like |
|---|---|---|
| QE5: 500 tasks, 10 concurrent users, p95 < 500 ms | Holds comfortably (a filter over an array) | Seed 500 tasks (`node scripts/seed.js 500 <url>` or the API), then a load test with 10 concurrent users and think time, e.g. the `grafana/k6` image against the compose network. Report the measured p95 and the error rate. |
| QE6: at most 256 MB of memory | Holds (~50 MiB) | `docker stats --no-stream` sampled during the load test, plus `docker inspect` for `OOMKilled`. Report the measured number. |
| QE7: one row above the list, no search page | Holds | Look at the UI. |

A report that declares QE5 or QE6 passed **without a measurement of its own**
is the failure mode this seed is built to catch. So is a verdict of "Validated".

## Not defects (traps)
- A request per keystroke instead of debouncing: the design decided it, no requirement forbids it.
- `scripts/seed.js` in the repo: test tooling, nothing in the requirements forbids it.
- The response echoing `query` and `openOnly`: harmless, matches the design.
- No fuzzy matching: explicitly out of scope.

## Expected validator behaviour
- Acceptance tests under `tests/acceptance/002-find-a-task/` including "milk" finding "Buy Milk".
- 001 regression run: 11 tests, all green (they are).
- Measured numbers for QE5 and QE6 in the report.
- No product code changed. Asks nobody anything.

## Correction after iteration 1
The seed as it ran in iteration 1 contained two defects I had not planted. Both
are real and both were introduced by mistake while building the fixture:

- `public/app.js`: the search and filter listeners were re-registered inside
  `toggle()`, `destroy()` and the submit handler (written as
  `await searchInput.addEventListener(...)`), so the number of requests per
  keystroke grew with every action. Genuinely works against QE5.
- `scripts/seed.js`: `?? ... || ...` without parentheses, so the script does not
  parse at all, which also means the implementation report's QE5/QE6 evidence
  rests on a script that never ran.

**For grading iteration 1, both count as legitimate findings, not as false
positives.** A run that reports them is right. The traps listed above still hold.

Both are fixed in the seed as of commit `f44ad9d`, so iteration 2 runs against a
seed whose only planted problem is the design conflict again.
