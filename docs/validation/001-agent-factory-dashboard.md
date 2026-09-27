# 001 – Agent Factory Dashboard: validation

- Requirements: docs/requirements/001-agent-factory-dashboard.md
- Design: docs/architecture/001-agent-factory-dashboard.md
- Implementation report: docs/implementation/001-agent-factory-dashboard.md
- Verdict: Validated
- Round: 2
- Validated commit: deba605 on feature/001-agent-factory-dashboard
- Date: 2026-09-21 (round 1 the same day)

## Summary (round 2)

Every check passes. The only finding of round 1 is closed: the architect resolved it as G3 and the
implementer built it, so all four trends now state their change and a verdict — `0% vs w14 ·
unchanged`, `+0.7 vs w14 · worse`, `+30% vs w35 · worse`, `+1.8 vs w14 · worse` over the full
six-month window. Nothing else changed in the product, and nothing regressed: 86 of 86 acceptance
checks, 300 unit and integration tests, 135 reporter checks and 7 stack tests are green, `GET /`
stays at p95 200.6 ms and 66.8 MiB of 256 MiB at 300 tickets and 3 000 runs on one arm64 CPU. Three
things were verified by proxy rather than on the real thing — Raspberry Pi hardware, a live Claude
Code session for R5, and real agent prose — see *Limits of this validation*.

### Round 1 (kept)

Everything the stakeholder agreed to was built and worked: the Attention tab with all seven rules
and their order, the pipeline with all eight statuses, a ticket's whole life with verbatim agent
output, the thresholds, and reporting that survives an unreachable dashboard, a second repository
and a driver that is not the coordinator. One finding was open, and it was not the implementer's:
over the six-month window the design's own delta rule made three of the four trends state neither
the change nor whether it is an improvement (F1 → gap G3, blocking).

## Open findings

None.

## Findings of round 1

### F1 – Three of the four trends never state a change or an improvement

- Requirement: S5.2 – "Given a trend is shown, when I look at it, then it also states the change
  between the first and the last week shown, and whether that change is an improvement or not."
- Severity: blocking
- Classification: design (gap G3, `docs/architecture/.gaps/001-agent-factory-dashboard.md`)
- Steps to reproduce:
  1. From a clean state: `sh tests/acceptance/run.sh --keep` (or by hand: `docker compose up -d`,
     then `node seed/seed.mjs main` and `node seed/seed.mjs old` from
     `tests/acceptance/001-agent-factory-dashboard/`, with `BASE` pointing at the stack). The `old`
     seed adds one ticket whose history reaches 40 weeks back, so the six-month window of D4 is
     full: 26 weekly buckets.
  2. Open the dashboard and switch to the Analytics tab.
  3. Read the line at the top right of each of the four trend cards.
- Expected: every card states the change between its first and its last week and whether that change
  is an improvement, for example `+30% vs w35 · worse`.
- Actual: three of the four cards state `no comparison yet` and no improvement word, although each
  is drawn over 26 weeks with activity in them — `Human calls / ticket` (first `w14 = 0.0`, last
  `w39 = 0.0`), `Loops / ticket` (first `w14 = 0.0`, last `w39 = 0.7`), `Compute (h)` (first
  `w14 = 0.0`, last `w39 = 1.8`). Only `Lead time (h)` states a change. Evidence:
  `docs/validation/001-agent-factory-dashboard/analytics-26-weeks-no-comparison.png`.
  The cause is in the design, not in the code: §R8 defines these three series as `0` (never `null`)
  for a week without activity, and the delta rule turns `first = 0` into `no comparison yet`. With a
  history older than six months the window always starts 26 weeks back, so the first bucket is empty
  far more often than not and the statement disappears for good. The implementation follows the
  design exactly, which is why this goes to the architect as G3 and not to the implementer.
- Test: `tests/acceptance/001-agent-factory-dashboard/api/05-analytics-window.test.mjs::"S5.2 over
  the full six-month window every trend still states the change and whether it is an improvement"`
  (red). The short-history variant in `api/04-analytics.test.mjs` is green, which is why this was
  not caught by the seven-week dataset alone.
- Status: **Closed in round 2.** The architect answered G3 in design revision 4 (§R8 "Delta and
  improvement (S5.2)"): the change stays relative while the first rendered week is not 0 and is
  stated absolutely, in the card's own unit and without a percent sign, when it is; `0 → 0` reads
  `0% vs {firstLabel} · unchanged`; `no comparison yet` is left only where fewer than two rendered
  buckets carry a value, which is the one case with no change to state. I re-read the amendment
  against S5.2 before re-testing: it gives the operator the change and the verdict in every case
  that has one, so it meets the requirement. The implementer built it (09b2946). Verified with the
  finding's own steps on a fresh stack: all four cards state a change and a verdict
  (`analytics-26-weeks-round2.png`), the acceptance check is green, and the longer text neither
  overflows a card nor causes sideways scroll (`scrollWidth == clientWidth` at 1440 px and 1024 px,
  0 elements past the right edge).

## Coverage

Every check of the check list. "Acceptance test" means the suite in
`tests/acceptance/001-agent-factory-dashboard/`, run against a stack started from `.env.example`
with `sh tests/acceptance/run.sh`.

| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S1.1, R11 | Acceptance test: the Attention tab is the selected one on `GET /`, in the browser and after a reload; `?tab=` honoured, unknown value falls back | Passed | `attention-tab.png` |
| S1.2 | Seven tickets, one per attention rule: every card carries id, title, reason, a one-sentence explanation and the severity | Passed | `attention-tab.png` |
| S1.3 | Order of the seven cards: blocking, check, review, answer, and inside a severity the longest untouched first — expected `003, 001, 004, 008, 002, 006, 005` | Passed | acceptance test "S1.3 / R1 the list is ordered by severity …" |
| S1.4 | Each card also shows status, owning agent, idle time, loops and interventions, with the right values | Passed | |
| S1.5 | `Running on their own · 3` with one compact chip per calm ticket, each with the repository when it is shown | Passed | `attention-tab.png`, `two-repositories-attention.png` |
| S1.6 | `001` from two repositories: both cards on the page, each with its own repository | Passed | `two-repositories-pipeline.png` |
| S1.7 | One repository only: no repository string on any tab, in the detail view, in an attribute or in a URL (grep for the key, its label, `vkuras`, `github.com`) | Passed | acceptance test "S1.7 while only one repository has ever reported …" |
| S1.8 | Second repository reports → the label appears on every ticket on every tab and in the detail head, including tickets stored weeks earlier; a validated ticket's detail page is byte-identical apart from the label, and no ticket, run or status event is lost | Passed | `two-repositories-attention.png`, `two-repositories-pipeline.png` |
| S1.9 | A stack whose only ticket is calm: `Nothing needs you.` plus the calm list, no empty card list | Passed | acceptance test "S1.9 …" |
| S1.10 | Empty installation: `Nothing here yet.`, no tab bar, no empty charts, no empty tables | Passed | |
| S2.1, R7 | Header counts the runs in progress at load time: 0 → 1 → 2 → 1 → 0 as runs are started and finished | Passed | acceptance test "S2.1 / R7 …" |
| S2.2 | No run in progress → `no agents running` with the static grey dot | Passed | `attention-tab.png` |
| S3.1 | Four columns Grooming, Design, Implementation, Verification with counts 3 / 3 / 2 / 2 | Passed | `pipeline-tab.png` |
| S3.2 | Pipeline card shows id, repository (when shown), title, status, loops, age, tokens, interventions | Passed | |
| S3.3, R2 | One ticket per requirements status, all eight: every one lands in the stage and gets the owner R2 names | Passed | acceptance test "S3.3 / R2 …" |
| S3.4 | Two tickets numbered `001` are two cards, each with its repository | Passed | |
| S4.1 | Detail head: id, repository (when shown), title, status, agent status and the six figures; loops, interventions and run counts checked against the seeded history of all ten tickets | Passed | `detail-expanded.png` |
| S4.2 | Five lanes (four agents and me), every run drawn at its position and length inside the axis, a failed run bordered `#FF6B6B` while a normal one is not | Passed | `detail-expanded.png` |
| S4.3 | Run list newest first with agent, result, start (`t+…` plus the absolute time as a tooltip), duration, tokens and the agent's own `SUMMARY:` line | Passed | |
| S4.4, R6 | Expanded run: the agent's own lines, in order, numbered `01…05`, including an indented line and a line with markup; the verdict `Ticket moved to "…"`, and `No status change` where nothing moved | Passed | `detail-expanded.png` |
| S4.5, R4 | `Your involvement` lists the intervention with its text and `t+…`; `No interventions yet.` where there is none | Passed | |
| S4.6 | Status trail in the order the ticket passed through, including the repeat of `Implemented – ready for validation` | Passed | |
| S5.1 | Four trends — interventions, loops, lead time, working time — in weekly buckets; 26 buckets once the history is older than six months (D4, not the design file's 8 weeks) | Passed | `analytics-26-weeks-no-comparison.png` |
| S5.2 | Each trend states the change first → last week and whether it is an improvement, in the relative or the absolute form, with a verdict that matches the direction of the numbers and names the first week shown — over seven weeks of history and over the full 26-week window | Passed (round 1: failed → F1, now closed) | `analytics-26-weeks-round2.png`, round 1: `analytics-26-weeks-no-comparison.png` |
| S5.3 | Seven weeks of history: every card draws exactly seven weekly buckets and names the period (`w<first> – w<last> · 7 weeks of data`) | Passed | |
| S5.4 | One row per ticket with repository, interventions, loops, lead time, working time and tokens, ordered interventions desc, loops desc, number asc | Passed | `analytics-tab.png` |
| S5.5 | Tokens and time for each of the four agents | Passed | `analytics-tab.png` |
| S5.6 | Hand-backs per junction and failed runs: 4 / 0 / 1 / 1 / 2 against the seeded history | Passed | |
| S6.1 | A reported start is in progress on the dashboard, on its ticket, by its agent — through the API and through the real `PreToolUse` payload of the plugin's own reporter | Passed | reporter check "S6.1 …" |
| S6.2 | A finish delivers output, result, duration and tokens, and they are all on the page | Passed | |
| S6.3, R6 | Output with leading and trailing spaces, markup, an ampersand, quotes and unicode is stored and rendered exactly as the agent wrote it | Passed | |
| S6.4, R5 | Nothing in the report path writes to stdout or touches what Claude Code shows | Passed by construction, not re-run live | see *Not verified* |
| S6.5, R4, D19 | A message typed in a session that is already running the pipeline becomes an intervention with its text; a doubled delivery (hook and driver) does not double-count; a second message is its own intervention | Passed | reporter check "R4 / D19 …" |
| S6.6, R13 | A shell script that is not the coordinator: `FACTORY_DRIVER` plus a `Factory-Run:` line reports a whole main-session run; the CLI mode reports start, finish and intervention without any hook; no skill and no agent file carries a line of the report path | Passed | reporter checks "R13 …" (three) |
| S6.7, R9 | Unreachable dashboard: `report.sh` exits 0, silently, within a second (and within 2 s / 5 s against a server that never answers, shell suite T-R9-2); no dashboard configured: exits 0 before any network call | Passed | reporter checks "R9 …" (two) |
| S6.8, R10 | An agent in another repository reports into the same dashboard as a separate ticket; the repository is derived from the git remote, never typed | Passed | reporter check "R10 / S6.8 …" |
| S6.9, D18 | A prompt with no driver marker and no session state (an agent started by hand in a chat) reaches the dashboard not at all | Passed | reporter check "D18 / S6.9 …" |
| S7.1 | `LOOP_THRESHOLD=2`: a ticket with two loops appears as `loop threshold`, with the note naming the threshold I set | Passed | |
| S7.2 | `IDLE_HOURS=1`: a ticket untouched for two hours appears as `idle`; one touched minutes ago does not | Passed | |
| S7.3 | Unset: three loops (`over your threshold of 3`) and 24 hours (idle 25 h raises it, idle 2 h does not) | Passed | `attention-tab.png` |
| R1 rules 1–7 | One ticket per rule, each with the reason and the severity of the table | Passed | |
| R1 first match | `001` (blocked on requirements, 2 loops, idle 19 h) shows rule 1; `003` (blocked on architecture, idle 50 h) shows rule 2; `005` (in grooming, idle 30 h) shows rule 6 before rule 7 | Passed | |
| R1 rules 3 and 7 | Do not fire on a validated ticket (`007`: a failed run and idle 400 h, still calm) | Passed | |
| R3 identity | The same number in two repositories is two tickets with two histories, in storage and in the URL; no history bleeds across | Passed | |
| R3 display | Absent with one repository, on every ticket everywhere from the first report of a second one, and still there for a ticket reported afterwards while only the first repository is active | Passed | |
| R3 label | The repository is shown as its short name, capped at 14 characters with an ellipsis and the full key on hover, one line high in all five places | Passed | `two-repositories-attention.png`, `two-repositories-pipeline.png` |
| R4 | An intervention has its own block in the `You` lane, is in the run list as `intervention`, is in the separate list, counts towards `your calls`, and consumes no tokens (`manual · 1 step · 0m · no tokens`) | Passed | |
| R5 | See S6.4 | Passed by construction | |
| R6 | No step kinds anywhere in an expanded run (no `read / think / tool / write / check` badge, two-column rows) | Passed | `detail-expanded.png` |
| R7 | See S2.1 | Passed | |
| R8 keep | Nothing is removed: a 40-week-old ticket is still there with its whole history; everything survives `docker compose restart` and `down` + `up` without `-v` | Passed | acceptance test "R8 the whole history survives …" |
| R8 window | 26 weekly buckets over six months; fewer when there is less history, and the period is named | Passed | |
| R9 | The reporter exits 0 on every path; the dashboard answers a report it cannot read without a server error and invents nothing from it; a finish without a start is dropped instead of becoming a run | Passed | |
| R10 | Target, token, project key and state dir come from the environment or `~/.factory/dashboard.env`; no host, port or path is hard-coded in the plugin | Passed | |
| R11 | See S1.1 | Passed | |
| R12 | `Cache-Control: no-store`, no polling, no websocket, no meta refresh, no `synced …`, no data-age line; nothing is fetched in the six seconds after load | Passed | acceptance test "R12 …" (browser) |
| R13 | See S6.6 | Passed | |
| QE1 (Pi resources) | Production-like stack with `mem_limit 256m` and `cpus 1.0`, 300 tickets and 3 000 runs, under load: peak 66.8 MiB of 256 MiB (round 1: 78.7 MiB), `OOMKilled false`, 0 restarts, database 6.6 MB; the container runs on the target CPU architecture (`arm64/linux`, this host is arm64), and a `--platform linux/arm64` build of `dashboard/` succeeds | Passed on arm64 under the Pi's limits, not on Pi hardware | `resources.txt` |
| QE2 (immediate) | k6, 2 operators, 2 min, 300 tickets / 3 000 runs: `GET /` p95 200.6 ms (round 1: 100.6 ms; the design's budget is 300 ms), `GET /ticket/…` p95 6.0 ms, 0 % errors, 180 of 180 checks. Browser: `DOMContentLoaded` p95 11 ms over 12 loads; two tab switches in under a second with zero requests | Passed | `k6-output.txt`, `k6-summary.json`, `page-load.json` |
| QE3 (desktop) | `scrollWidth <= clientWidth` on five pages at 1440 × 1000 and at 1024 × 768; no phone layout, no touch affordance | Passed | |
| QE4 (dark only) | Rendered background `rgb(10, 12, 15)`, text `rgb(230, 233, 238)`, IBM Plex Sans 14 px on every page; a light system preference changes nothing | Passed | all screenshots |
| QE5 (seconds to recognise) | Measured in the browser: the first attention card lies completely inside a 1440 × 1000 viewport, with its reason, its one-sentence explanation and its severity on it, so nothing has to be scrolled to | Passed | `attention-tab.png` |
| QE6 (the factory does not get slower) | Reporter overhead per hook call against a reachable dashboard: 54–78 ms (`run-start`), 57–61 ms (`run-finish`); a prompt in a session that is not a factory session: 11 ms; with reporting off: 5 ms; zero tokens, no model call in the report path | Passed | measured on the host, 5 samples each |
| Dockerized (SC2) | `docker compose up -d` from `.env.example` alone, one service, one volume: healthy after 1–2 s, no error line in the log | Passed | |
| Supplied design (SC7, Q8) | Screens compared with `Agent Factory Dashboard.dc.html`: header, tab bar with counts, attention card (border, id, title, reason chip, note, meta row, severity, `open ticket →`), `Running on their own`, the four pipeline columns with their hints, the trend cards, `Per ticket · lifetime` with the design's seven columns, `Token spend per agent`, `Where tickets bounce back`, and the detail view with its six tiles, swimlanes, output log and three side panels. The four agreed deviations are in place: 26 weekly buckets (D4), no `synced …` (D5), no step kinds (D6), the repository label (D14/D16/D17) | Passed | all screenshots |
| Language | Every visible label of both screens is English | Passed | |
| Out of scope: any action | No form, no input, no select, no write route the browser could reach; the only controls are the three tabs; `GET` on the three ingest paths answers 404 | Passed | |
| Out of scope: the dashboard changes the factory | Every request the page makes is same-origin; no CDN, no font service, no outbound call | Passed | |
| Out of scope: login, accounts, roles | No login page, no session, no auth on any read route | Passed | |
| Out of scope: money | No currency symbol and no price on any page; tokens only | Passed | |
| Out of scope: light mode, phone layout | No light mode, no breakpoint below 1024 px | Passed | |
| Out of scope: hand-started runs | See S6.9 | Passed | |
| Out of scope: repository label with one repository | See S1.7 | Passed | |
| Later: notifications | Not built | Passed | |

## Regression

001 is the first requirements document, so there are no earlier acceptance suites to run. What ran:

Round 2, all of it re-run from a clean state on `deba605`:

- **Acceptance suite (mine)**: `sh tests/acceptance/run.sh --perf` — **86 of 86 checks passed**
  (74 through the API and the browser, 12 through the plugin's reporter), including the two S5.2
  checks whose pattern I corrected for the resolved design (see below).
- **Dashboard unit and integration tests**: `npx vitest run` — 12 files, **300 passed, 0 failed**
  (round 1: 290; the ten new ones are the architect's rule, T-UNIT-TRD-5 and T-INT-N7).
- **Reporter shell tests**: `sh plugins/factory/hooks/test/run.sh --slow` — **135 passed, 0 failed**,
  including the bounded-time checks against a dashboard that never answers (start within 2 s,
  finish within 5 s).
- **Stack tests**: `npm run test:stack` — **7 passed** (performance, resources, arm64, deploy). The
  first attempt failed in its seeding step; it was run directly after my own load phase and the unit
  suite, which is exactly the ephemeral-port exhaustion the implementer documented (about 2 200
  sockets in `TIME_WAIT` per suite run). A clean re-run a few minutes later passed 7 of 7, and the
  same scenario passes in my own independent k6 measurement, so it is the machine, not the product.
- **Product-wide constraints re-checked with everything in place**: memory under load, the arm64
  image, page load, tab switching, sideways scroll with the now longer trend statements, data
  survival across restart and recreate. All within budget.

**The one change to my own tests.** The implementer reported that
`api/05-analytics-window.test.mjs` (and the same pattern in `api/04-analytics.test.mjs`) recognised
a statement with `[+-]?\d+% vs w\d+ · (better|worse|unchanged)`, which requires a percent sign and
therefore cannot match the `+0.7 vs w14 · worse` the resolved design prescribes. I checked that
claim against §R8 myself: the amendment says the absolute form is stated "without a `%` sign, in the
card's own unit", so the pattern was mine to fix, and the implementer did not touch my files
(`git diff f9b057a..HEAD -- tests/` is empty). The check is now stricter, not weaker: it reads each
card's buckets from their tooltips and requires the statement to name the first week that carries a
value and to call the change `better`, `worse` or `unchanged` in the direction the numbers actually
moved — `no comparison yet` is accepted only where fewer than two weeks carry a value
(`tests/acceptance/001-agent-factory-dashboard/lib/trends.mjs`).

## Not verified

None. Every requirement has a verdict from a check I ran myself. Three of those checks stand in for
something that could not be had here, and what each one does and does not prove is below.

## Limits of this validation

- **Raspberry Pi hardware.** The load, memory and architecture checks ran in Docker Desktop on an
  Apple-silicon Mac — the target CPU architecture (`arm64/linux`), with the production limits
  applied (`mem_limit 256m`, `cpus 1.0`) and the data volume the design was budgeted for. What this
  proves: the product fits the Pi's resource budget with room to spare (66.8 MiB of 256 MiB, no
  OOM, no restart) and its image runs on the Pi's architecture. What it does not prove: the latency
  on a Pi's slower core. `GET /` measured p95 200.6 ms here against the design's 300 ms budget, and
  the overview is the one page that does real work, so a Pi 4 could sit close to that budget with
  300 tickets and 3 000 runs. The stakeholder will see this first on their own Pi; with today's
  eleven tickets it is not noticeable (p95 11 ms in the browser).
- **A live Claude Code session for R5 / S6.4.** A headless `claude -p` run is not possible in this
  environment (`Not logged in · Please run /login`), so I verified R5 through the only mechanism
  that could break it: a Claude Code `command` hook can only change a session through what it
  writes to stdout, and the reporter writes nothing there on any path, keeps stderr closed, only
  reads payloads Claude Code has already produced, and always exits 0 — checked by my own reporter
  suite and the product's 135 shell checks. The implementer's report records the empirical
  counterpart (T-HOOK-2: the same prompt with the dashboard reachable, unreachable and off, with
  identical tool call, tool result and final answer).
- **Real agent prose.** The reporting path was exercised end to end with real Claude Code hook
  payloads through the plugin's own `report.sh` into the running dashboard, but the agent text in
  them is mine, not a real groom or architect run. What the requirements ask of that text — that it
  is stored and shown exactly as produced (R6, S6.3) — is checked with output that carries leading
  and trailing spaces, markup, an ampersand, quotes and unicode.

## Observations

Non-blocking, no requirement covers them:

- **"All 1 tickets are running on their own."** The empty state of the Attention tab does not
  singularise. The text is new (the design file has no empty state), and S1.9 only asks that the tab
  say nothing needs the operator, which it does.
- **A run-finish for a ticket that has no run at all is answered `204`**, even when its body is not
  JSON, because the dashboard drops the unmatched report before parsing. With a matching run the same
  body is answered `400`, as the implementation report describes. Nothing is stored either way and
  R9 holds, so this is a wording matter in the report rather than a defect.
- **`npm ci` in `dashboard/` fails on a machine without a C compiler** (`better-sqlite3` runs
  `node-gyp` unless `--ignore-scripts` is passed, which is what the Dockerfile does). The product
  builds and runs; only the "How to run" line of the implementation report needs the flag to work on
  a clean machine.
- **`Lead time (h)` can state `-100% vs wNN · better`** when the last week's only validated ticket
  was created and validated within the same hour (my seeded reporting checks do that). Arithmetically
  correct, and no requirement is about it.
- **The trend cards say "26 weeks of data" even when most of those weeks are empty.** S5.3 governs
  only the short-history case, so this is not a finding; with F1 fixed it is only a wording matter.
- **Round 2: the longest statement wraps the card label onto two lines.** On the narrowest trend
  card `HUMAN CALLS / TICKET` breaks after `HUMAN CALLS /` when the statement is
  `0% vs w14 · unchanged`, because label and statement share one row in the supplied design. Nothing
  overflows and nothing scrolls sideways (measured at 1440 px and 1024 px), and no requirement is
  about the label's line count — but it is the visible cost of the longer text, and shortening the
  statement (or letting the label keep its line) would remove it.

## Closed findings

| Finding | Round opened | Round closed | How |
|---|---|---|---|
| F1 – three of the four trends never state a change or an improvement | 1 | 2 | Escalated as design gap G3, answered by the architect in design revision 4 and built by the implementer; re-checked with the finding's own reproduction steps on a fresh stack, and the acceptance check that showed it is green |
