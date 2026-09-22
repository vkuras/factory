Status: needs-architect.

Built S6 (hide done tasks): `open=true` filter on `GET /api/tasks` (src/search.js, src/app.js), an "Open only" checkbox in the UI. Self-validated in Docker (build, healthy stack, API + regression checks, 500-task timing, memory 19 MiB/256 MiB, restart keeps data, clean diff), then torn down.

S5 (search by text) not built: the design's match rule (case-sensitive prefix, `title.startsWith(q)`) contradicts the requirements (R4, S5.2, S5.3 ask for case-insensitive, anywhere-in-title). No ADR covers this deviation. Filed as G1 in docs/architecture/.gaps/002-find-a-task.md rather than guessing which rule is right.

Report: docs/implementation/002-find-a-task.md. Requirements status left unchanged pending the architect's answer.
