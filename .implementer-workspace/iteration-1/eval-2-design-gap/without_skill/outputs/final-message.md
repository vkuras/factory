Implemented 002 – Find a task in the taskboard repo.

## What I built
- `src/search.js` (new): `matchesQuery()` and `filterTasks()`.
- `src/app.js`: `GET /api/tasks` now reads `q` and `open` query params and filters before answering (per ADR-0003, filtering lives in the existing list endpoint, no new `/api/search`).
- `public/index.html`/`public/style.css`/`public/app.js`: a search field and an "open only" checkbox above the list, one row, no separate page (QE7). Every keystroke and checkbox change re-fetches and re-renders. An empty/no-match filtered result shows `No task matches "<text>".` instead of the 001 "No tasks yet." state (S5.5).
- Unit tests: `test/search.test.js` (8 tests covering S5.1–S5.4, S6.1–S6.3, R4).
- Acceptance tests: `tests/acceptance/002-find-a-task/search.test.js` (8 black-box tests against the running stack).
- `docs/implementation/002-find-a-task.md` (new): full build record, traceability table, self-validation log.
- Updated status fields: `docs/requirements/002-find-a-task.md` → "Implemented – ready for validation"; `docs/architecture/002-find-a-task.md` → flagged with the gap below.

## Design/requirements conflict found (important)
The architecture doc (`docs/architecture/002-find-a-task.md`, backed by ADR-0003) specifies the match as a **case-sensitive prefix match** (`title.startsWith(q)`). That directly contradicts the requirements it's meant to implement:
- R4: match "anywhere in the title", case-insensitive.
- S5.2: "Buy Milk" must be found by searching "milk" (case).
- S5.3: "Buy milk"/"Order milk crate" must be found by searching "milk" even though "milk" isn't at the start.

A literal implementation of the design would fail S5.2/S5.3/R4 and the stakeholder's own worked example in the requirements ("I type milk and I want to see everything with milk in it" / "Order milk crate" should match). Since there's no one to ask, I implemented `matchesQuery()` per the requirements (case-insensitive substring) rather than the design's literal prefix/case-sensitive text, and documented the conflict in `src/search.js` and in `docs/implementation/002-find-a-task.md`'s "Open gaps" section, flagged for architecture to reconcile ADR-0003/the design text with R4/S5.2/S5.3. Everything else in the design (query params on the existing endpoint, no index, no new component) was built as specified.

## Verification
- `npm test`: 18/18 unit tests pass (10 existing + 8 new).
- Built and ran the stack with `PORT=8112 docker compose -p tb-i1-e2-ns up -d --build`.
- `tests/acceptance/run.sh` against `http://localhost:8112`: 11/11 (001 regression) + 8/8 (002) pass.
- Memory: 18.75 MiB / 256 MiB (QE6).
- Manually verified end-to-end via curl: adding tasks, `?q=MILK` finds "Buy Milk" and "Order milk crate" case-insensitively and mid-string, `?q=<nomatch>` returns `[]`, `?open=true` hides done tasks, combined `q`+`open` works.
- Tore the stack down (`docker compose -p tb-i1-e2-ns down -v`) and confirmed no `tb-i1-e2-ns` containers/volumes/networks remain.
- No commits were made (working tree left with the changes unstaged, as no commit was requested).

## Files touched
- New: `src/search.js`, `test/search.test.js`, `tests/acceptance/002-find-a-task/search.test.js`, `docs/implementation/002-find-a-task.md`
- Modified: `src/app.js`, `public/index.html`, `public/style.css`, `public/app.js`, `docs/requirements/002-find-a-task.md`, `docs/architecture/002-find-a-task.md`

## Note on the browser tool
The Browser pane used for a visual check turned out to be shared with other evaluation runs on this machine (I saw tabs from `eval-1-feature-happy-path` and a stray `localhost:8111` origin that wasn't mine). I stopped interactive browser use as soon as I noticed and switched to `curl` against my own `localhost:8112` stack for verification, to avoid touching another run's session.

Artefacts saved under `.implementer-workspace/iteration-1/eval-2-design-gap/without_skill/outputs/`: `docs/`, `src/`, `public/`, `test/`, `tests/`, `final-message.md`, `git-status.txt`, `changes.diff`.
