# 002 – Find a task: **Rejected** (validation round 1)

Report: `docs/validation/002-find-a-task.md`. Evidence: `docs/validation/002-find-a-task/`.

## Verdict
The feature does not do what 002 asks for. The search matches only the
**start** of a title and only in the **exact case** typed. With 500 tasks
seeded, 50 of which contain "milk", typing `milk` shows
`No task matches "milk".` — the stakeholder's own example.

S5.1, S5.2, S5.3, S6.2 and R4 fail. S5.4, S5.5, S6.1, S6.3, R5, QE5, QE6 and
QE7 pass. 001 regression is green (11/11).

## Findings
| # | Severity | For | What |
|---|---|---|---|
| F1 | Blocker | architect, then implementer | The match is a prefix match; R4/S5.1/S5.3 require anywhere in the title |
| F2 | Blocker | architect, then implementer | The match is case-sensitive; R4/S5.2 require case to make no difference |
| F3 | Blocker | **architect** | The design specifies that wrong rule (§Interfaces, §Decisions) and declares "Requirement conflicts: None" |
| F4 | Minor | implementer | With "open only" on and nothing typed, the no-match text reads `No task matches "".` |
| F5 | Minor | implementer | `test/search.test.js` pins the defective behaviour; replace those two tests |

## The performance argument does not hold
The design gives QE5 as the reason for narrowing the match ("keeps the endpoint
free of any string normalisation on the hot path"). Measured A/B on one host,
500 tasks, 10 concurrent clients, 2000 searches, only `matchesQuery()` swapped:

| Match rule | p50 | p95 | p99 | errors |
|---|---|---|---|---|
| As built (`startsWith`, case-sensitive) | 1.2 ms | **2.1 ms** | 3.2 ms | 0 |
| As required (`toLowerCase().includes`) | 1.2 ms | **2.3 ms** | 4.2 ms | 0 |

0.2 ms at p95, against a 500 ms budget — roughly 215x headroom. QE5 is no
reason to give up R4. In the container as built: p95 5.3 ms, 0 errors,
59.6 MiB of 256 MiB (QE6 fine).

## Next stage
Back to the **architect** for F3: correct §Interfaces, §Decisions, §Business
rules and §Traceability of `docs/architecture/002-find-a-task.md` to a
case-insensitive substring match on the title, and drop the QE5 justification
(measurements above). Then the implementer fixes F1, F2, F4, F5 — F1 and F2 are
one line in `src/search.js`.

## What I added
- `tests/acceptance/002-find-a-task/search.test.js` — 13 black-box tests for
  S5.1–S5.5, S6.1–S6.3, R4, R5, QE7. They encode the requirements, not the
  design's match rule, and stay in the regression suite. 7 pass, 6 fail today;
  all 13 must be green before 002 is validated.
- `docs/validation/002-find-a-task/load.mjs` — the QE5 load harness, reusable.

Requirements status set to "Rejected in validation – back to architecture";
`docs/product.md` index updated. No product code was changed. Stack torn down
(`docker compose -p tb-e2b-ns down -v`).
