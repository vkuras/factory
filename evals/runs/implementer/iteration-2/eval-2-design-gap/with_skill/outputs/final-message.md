Status: needs-architect.

While checking the design's traceability table against the requirements, I found the design contradicts them: it specifies a case-sensitive prefix match (`title.startsWith(q)`), but R4/S5.2/S5.3 require a case-insensitive match anywhere in the title — the stakeholder's own "milk" example fails under the design's rule on all three sample titles. Filed as G1 in `docs/architecture/.gaps/002-find-a-task.md` instead of guessing; S5 (find a task by typing) is blocked on it and was not built.

S6 (hide what is finished) does not depend on G1 and is built and self-validated: `src/search.js` `filterTasks()`, the `open` query parameter on `GET /api/tasks`, and an "Open only" checkbox in the UI.

Self-validation (branch `feat/002-find-a-task`, project `tb-i2-e2-ws`, port 8122): clean build, 16 unit tests passing (was 10), the existing 001 acceptance suite still green (11/11) against the running stack, S6.1/S6.3 walked through in the browser and via curl, data survived a restart, memory at 17 MiB / 256 MiB, own diff reviewed. QE5's load test was not run (it covers the blocked `q` search). Stack torn down (`down -v`), no `tb-i2-e2-ws` containers remain. Requirements status left unchanged (`Designed – ready for implementation`) pending the architect's answer on G1.

Full report: `docs/implementation/002-find-a-task.md`. Gap: `docs/architecture/.gaps/002-find-a-task.md`.
