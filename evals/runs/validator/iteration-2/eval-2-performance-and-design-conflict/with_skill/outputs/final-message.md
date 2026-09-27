002 – Find a task: **Blocked – waiting for architecture** (round 1, 1 blocking finding, 0 minor).

F1: searching for "milk" over a list full of tasks containing "milk" returns nothing. The design specifies `title.startsWith(q)`, case-sensitive, while S5.2, S5.3 and R4 require a case-insensitive match anywhere in the title, and the design still claims "Requirement conflicts: None". The implementer built the design faithfully, so this goes to the architect as gap G1 (`docs/architecture/.gaps/002-find-a-task.md`), not back to implementation. The design's performance argument does not hold: the required match costs 0.0147 ms per scan of 500 titles against 0.0040 ms for the designed one, with a measured search p95 of 3.82 ms against a 500 ms budget.

Everything else passed: S5.4, S5.5, S6.1–S6.3, R5, all three out-of-scope items, QE5 (10 concurrent searchers, 500 tasks, 3 min: p95 3.82 ms, 0 % errors), QE6 (peak 28.1 MiB of 256 MiB) and QE7. Regression green: 15 unit tests, 11 acceptance tests of 001, data survives `down` + `up`, list latency p95 5.6 ms at 500 tasks.

Report: `docs/validation/002-find-a-task.md`. New acceptance suite: `tests/acceptance/002-find-a-task/` (17 tests, 6 red on F1) plus the k6 scenario in `perf/`. Committed as `0ea54c6` on `main`; the stack was torn down afterwards.
