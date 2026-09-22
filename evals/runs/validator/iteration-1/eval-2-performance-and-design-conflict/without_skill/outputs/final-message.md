# 002 – Find a task: validation round 1

**Verdict: Rejected – findings to fix.**
Report: `docs/validation/002-find-a-task.md`, evidence: `docs/validation/002-find-a-task/measurements.md`.
Validated commit 6616b98 on `feature/002-find-a-task`, against a real stack
(`PORT=8121 docker compose -p tb-e2-ns up -d --build`).

## Why it is rejected
The search does not do what the requirements ask. It matches the **start** of the
title and is **case-sensitive**. The stakeholder's own example — type `milk`, see
"Buy Milk", "Order milk crate", "Milk bill" — returns **nothing**:

```
GET /api/tasks?q=milk  ->  {"tasks":[],"query":"milk","openOnly":false}
```

That fails S5.2, S5.3 and R4, and takes S5.1 and S6.2 with it.

## Findings
- **F1 (Blocker) – wrong match rule.** `src/search.js` uses `title.startsWith(q)`
  case-sensitively. The **design** specifies this and justifies it with QE5, and
  its "Requirement conflicts" section wrongly says "None". Requirements win, and
  the performance argument does not survive measurement: the required match
  (`toLowerCase().includes()`) costs **14.3 µs** per search over 500 tasks —
  0.003 % of the 500 ms QE5 budget, against a measured end-to-end p95 of 5.2 ms.
  Needs the **architect** to correct `docs/architecture/002-find-a-task.md`, then
  the implementer to build R4 and rewrite the two unit tests that assert the wrong
  rule.
- **F2 (Blocker) – listener leak in `public/app.js`.** `toggle()`, `destroy()` and
  the submit handler each re-register the `input`/`change` listeners (with a
  meaningless `await addEventListener(...)`). Measured in the browser: 1 request
  per keystroke after load, **4 after three ticks**, growing without bound. Works
  directly against QE5.
- **F3 (Major) – `scripts/seed.js` does not run.** `SyntaxError: Unexpected token '||'`
  (`??` mixed with `||`). The implementation report's QE5/QE6 evidence names this
  script, so those numbers are unsupported. I measured QE5/QE6 independently
  instead; both pass.
- **F4 (Minor)** – `test/search.test.js` locks in the wrong rule and must be
  replaced together with F1.
- **F5 (Minor)** – the implementation report closed a known requirement/design
  conflict by itself and marked S5.2/S5.3/R4 "Passed as designed". A conflict like
  this is a design gap for the architect, and no requirement may be reported as
  passed when the shipped behaviour contradicts it.

## What passes
S5.4, S5.5 (no-match message, not an empty screen), S6.1, S6.3, R5 (nothing is
stored — checksum of `/data/tasks.json` unchanged), QE7 (one row above the list,
18 px text in a 44 px row, no separate page), and the out-of-scope boundaries.
**QE5: p95 5.2 ms** (500 tasks, 10 concurrent searchers, 2000 searches, 0 errors;
budget 500 ms). **QE6: peak 26.5 MiB / 256 MiB.** Both must be re-measured after
F1, but the margin is four orders of magnitude.

## Regression
- Unit tests: 15 passed, 0 failed (2 of them assert the wrong rule, see F4).
- Acceptance 001-task-list: **11 passed, 0 failed** — no regression from 002.
- Acceptance 002-find-a-task (new): 8 passed, **4 failed** — all F1.

## Added to the regression suite
`tests/acceptance/002-find-a-task/search.test.js` — 12 black-box tests for
S5.1–S5.5, S6.1–S6.3, R4 (the stakeholder example), R5 and QE7, written against
the requirements rather than the design, each cleaning up after itself.
Run with `BASE_URL=http://localhost:8121 tests/acceptance/run.sh`.

## Next
1. Architect: fix the match rule in the 002 design and its "Requirement conflicts" section (F1).
2. Implementer: F1 in `src/search.js` + unit tests, F2 in `public/app.js`, F3 in `scripts/seed.js`, then re-report F5's rows honestly and hand back for round 2.

Requirements status set to "Rejected – findings open". Stack torn down
(`docker compose -p tb-e2-ns down -v`).
