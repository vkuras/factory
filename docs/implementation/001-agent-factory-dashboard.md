# 001 – Agent Factory Dashboard: implementation

- Requirements: docs/requirements/001-agent-factory-dashboard.md
- Design: docs/architecture/001-agent-factory-dashboard.md
- Status: Ready for validation
- Branch: feature/001-agent-factory-dashboard, commits 95c95af..de36c51, plus the commit that adds this report
- Date: 2026-09-20
- Round: 2 (round 1 ended in `needs-architect` with gaps G1 and G2; the architect resolved both in design revision 3)

The requirements status line is `Implemented – ready for validation` and `docs/product.md` lists 001 as
`Implemented`. No gap is open.

## Round 2: what changed since round 1

The architect's delta (design revision 3, commit 267d083), built in 7569274 and de36c51:

| Delta | Built |
|---|---|
| Seventh hook `PostToolUseFailure` (`Agent\|Task`, timeout 15) calling `report.sh run-failed` | `plugins/factory/hooks/hooks.json`; `report.sh` accepts `run-failed` |
| `run-failed` sends the payload alone: no transcript read, no `cum_tokens`, no `transcript_path` in the meta; ticket from the payload or from the session state file | `report.sh` (action `failed`); a named pipe with no writer proves the transcript is never opened |
| The top-level `error` string is the error flag and, with no `tool_response`, the run's output verbatim; the transcript steps of the output resolution are skipped in that case | `dashboard/src/ingest/payload.ts` |
| A later delivery with the error flag set upgrades `unreported` or `NULL` to `failed`, never an agent's own `STATUS`; `ended_at` and the other fields keep the fill-only-NULL rule | `ingest/handlers.ts`, `db/queries.ts upgradeResultToFailed` |
| Token resolution leads with the transcript delta (`cum_tokens` minus `hook_cursor`); `tool_response.usage`, `totalTokens`, `total_tokens` are the fallback | `ingest/handlers.ts` |
| An ignored or dropped payload writes no `hook_cursor` row | `ingest/handlers.ts` (the cursor write is after the ignore and drop returns) |
| `.af-repo` is `max-width: 14ch` with ellipsis and `title` in all five places | already built in round 1; now tested in all five places and shown to be rendered only by the one partial |
| `plugin.json` has no `hooks` key; the Dockerfile uses `npm ci --ignore-scripts` | already so; the Dockerfile no longer adds `--foreground-scripts`; tests pin both |
| T-HOOK-1 (failure fixture), T-HOOK-3 (delta wins, ignored payload leaves the cursor), T-HOOK-4, T-HOOK-5, T-HOOK-6 | `payload.test`, `ingest.test`, `plugins/factory/hooks/test/run.sh` |

One change beyond the delta, from looking at the failed run in the browser: a per-agent token sum with no known
count showed `0` in `Tokens per agent` while the ticket tile showed `—`. It now shows `—`
(`domain/metrics.ts`, `web/pages.ts`; design: "`NULL` renders as `—`", "`NULL` values are skipped, not counted as 0").

## What was built

The six build-order slices were built in three passes; the dashboard slices 2 to 5 share the view models and
the domain rules, so they were committed together.

| Slice | What exists | Where |
|---|---|---|
| 1 Skeleton and ingest | Node 26 / Express 5 / EJS 6 / better-sqlite3 13 app in TypeScript 7, config validation, forward-only migrator and `001_init.sql` (six tables), the three ingest endpoints, `/healthz`, optional bearer token, Dockerfile, compose service, `.env.example`, the plugin's `hooks.json` and `report.sh`. The captured real payloads are the fixtures. | `dashboard/`, `docker-compose.yml`, `.env.example`, `plugins/factory/hooks/` |
| 2 Domain and Attention tab | `domain/` (R1, R2, R3 label and flag, metrics, trends, formatters), the `ticketId` partial, layout, header with R7, tab bar, Attention tab with both empty states | `dashboard/src/domain/`, `src/web/pages.ts`, `src/views/` |
| 3 Pipeline tab | four columns, cards, R2 placement incl. the unknown-status fallback | same |
| 4 Detail page | six tiles, swimlanes, run log with native `<details>`, interventions panel, status trail; the intervention endpoint; prompt / Stop / SessionEnd hooks; CLI mode of the reporter | same, `plugins/factory/hooks/report.sh` |
| 5 Analytics tab | four trend cards, per-ticket table, per-agent spend, five bounce rows | same |
| 6 Operations | sweeper, JSON request log, log caps in compose, stack tests (perf, memory, arm64, deploy), README section incl. the driver contract, the coordinate skill's two lines | `src/jobs/`, `test/stack/`, `README.md`, `plugins/factory/skills/coordinate/SKILL.md` |

Everything in the design's build order is built. `tests/acceptance/` does not exist and was not touched.

## How to run

```bash
cp .env.example .env          # optional, every variable has a default
docker compose up -d          # http://localhost:8787, healthy after about 5 s
# a machine that reports:
mkdir -p ~/.factory && echo 'FACTORY_DASHBOARD_URL=http://localhost:8787' > ~/.factory/dashboard.env
# tests
cd dashboard && npm ci && npm test && npm run test:stack   # Node 26; the stack tests need Docker
sh plugins/factory/hooks/test/run.sh --slow                # the reporter (macOS sh and Debian dash both pass)
sh plugins/factory/hooks/test/lint.sh                      # shellcheck v0.11.0 in a container
```

No test users; there are no accounts. The seed used for the UI measurements is not committed.

## Traceability

Test names are `file::describe > it`; "shell" is `plugins/factory/hooks/test/run.sh`.

| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S1.1, R11 | `web/pages.ts parseTab`, `views/overview.ejs`, `public/app.js` | pages.test::overview page > T-INT-A1 | Passed |
| S1.2, S1.4 | `views/attention.ejs`, `domain/rules.ts` | pages.test::Attention tab > T-INT-A2 (two); rules.test::R1 attention rules | Passed |
| S1.3, R1 ordering | `domain/rules.ts compareAttention` | rules.test::R1 ordering; pages.test > T-INT-A3 | Passed |
| S1.5 | `views/attention.ejs` (chips) | pages.test > T-INT-A4 | Passed |
| S1.6 | `ticket` key `(project_key, number)`, `ticketId` partial | ingest.test::two repositories; pages.test > S1.6 / S3.4 | Passed |
| S1.7 | `domain/repository.ts`, short link form | pages.test > T-REPO-2, T-REPO-6 | Passed |
| S1.8 | `repository` table, flag per request | pages.test > T-REPO-3, T-REPO-4 | Passed |
| S1.9, S1.10 | `views/attention.ejs`, `views/empty.ejs` | pages.test > T-INT-A5, T-INT-A6 | Passed |
| S2.1, S2.2, R7 | `domain/rules.ts onlineIndicator`, `queries.countOnline` | pages.test > T-INT-A7 (2), stale-run test; rules.test::R7 wording | Passed |
| S3.1–S3.4 | `views/pipeline.ejs`, `domain/rules.ts stageOf` | pages.test::Pipeline tab (6); rules.test::R2 | Passed |
| S4.1 | `views/detail.ejs`, `web/pages.ts buildDetail` | pages.test > T-INT-D1 (+ loops tile colour) | Passed |
| S4.2 | swimlanes in `buildDetail`; `PostToolUseFailure` hook, `run-failed`, error-flag path | pages.test > T-INT-D2 (3), running and abandoned runs; ingest.test > T-HOOK-4, T-HOOK-5; shell::T-HOOK-6; live failed Agent call | Passed |
| S4.3 | run log | pages.test > T-INT-D3 (2) | Passed |
| S4.4, R5, R6 | `ingest/payload.ts`, `outputLines`, `<details>` | payload.test::output handling (T-UNIT-OUT-1); pages.test > T-INT-D4 (3) | Passed |
| S4.5, R4 | `actor = 'human'` runs | pages.test > T-INT-D5 (4); ingest.test > T-DRV-4 (5) | Passed |
| S4.6 | `ticket_status_event` | pages.test > T-INT-D6; ingest.test::run-start (status events) | Passed |
| S5.1 | `domain/trends.ts` | trends.test (T-UNIT-TRD-1…4); pages.test > T-INT-N1 | Passed |
| S5.2 | `deltaOf` | trends.test::delta; pages.test > T-INT-N2 | Passed |
| S5.3 | `weekBuckets`, `periodLine` | trends.test::naming the period; pages.test > T-INT-N3 | Passed |
| S5.4 | table in `analytics.ejs` | pages.test > T-INT-N4 (2) | Passed |
| S5.5 | agent spend | pages.test > T-INT-N5 | Passed |
| S5.6 | five bounce rows | pages.test > T-INT-N6; ingest.test > T-HOOK-4 (the row counts a real failure) | Passed |
| S6.1, S6.2 | `ingest/*`, seven hooks, `report.sh` | payload.test (T-HOOK-1, incl. the failure fixture); ingest.test::run-start, run-finish, T-HOOK-3, T-HOOK-4, T-HOOK-5, T-DRV-1, T-DRV-5; shell::subagent hooks, T-HOOK-6, main-session finish; live runs below | Passed |
| S6.3, S6.4 | verbatim storage; hooks write nothing to stdout | payload.test::output handling; ingest.test::stores the output verbatim; shell::T-R9-1 (no output on any path); live T-HOOK-2 | Passed |
| S6.5 | prompt hook, CLI intervention, merge rule | shell::T-DRV-2, T-DRV-3; ingest.test > T-DRV-4; live intervention | Passed |
| S6.6 | seven plugin hooks and CLI, no line in the coordinate skill | shell (T-DRV-1…3 halves); ingest.test::a driver that is not the coordinator; live main-session run | Passed |
| S6.7 | `report.sh exit 0` everywhere | shell::T-R9-1, T-R9-2, T-R9-3 | Passed |
| S6.8 | project key derivation | shell::T-CFG-1; ingest.test::two repositories | Passed |
| S6.9 | prompt hook decision table | shell::T-DRV-2 | Passed |
| R1 rule 3 | `attentionOf`, fed by `failed` runs from a real failure | rules.test rule 3; ingest.test > T-HOOK-4 | Passed |
| S7.1–S7.3, R1 rules 5 and 7 | `config.ts`, `rules.ts` | config.test (12); rules.test rules 5/7; pages.test S7.1, S7.2; stack T-DEPLOY-1 (defaults) | Passed |
| R2 | `stageOf` | rules.test::R2 | Passed |
| R3 | `domain/repository.ts` | repository.test (T-REPO-1, 8); pages.test::repository label (10) | Passed |
| R8 | append-only tables, 26 buckets | pages.test > T-DATA-1; trends.test | Passed |
| R9 | `report.sh` | shell::T-R9-1…3 | Passed |
| R10 | `report.sh` configuration | shell::T-CFG-1 | Passed |
| R12 | no refresh, `no-store` | pages.test > shows no "synced"…, client script test | Passed |
| R13 | plugin only | shell::T-DRV-2; ingest.test::a driver that is not the coordinator; live main-session run | Passed |
| QE1 | 256 MB / 1 CPU, heap 192 MB | stack::T-RES-1, T-PERF-1 | Passed: peak 96 MiB |
| QE2 | one response, client tabs | stack::T-PERF-1, T-PERF-2; Chrome tab-switch measurement | Passed |
| QE3, QE4 | one stylesheet, no media query | pages.test > T-UI-1 (6); Chrome measurements at 1440 and 1024 px | Passed |
| QE5 | Attention is the landing tab | pages.test > T-INT-A1…A3 | Passed |
| QE6 | zero tokens, bounded time | shell::T-R9-2 (a server that never answers: start within 3 s, finish within 6 s, whole seconds, 5 runs each), T-R9-3; live T-HOOK-2 | Passed |
| SC1 | arm64 image, budget | stack::T-ARCH-1, T-RES-1 | Passed |
| SC2 | one service, one volume | stack::T-DEPLOY-1 | Passed |
| SC3, SC4 | project key, `.env` and `~/.factory/dashboard.env` | shell::T-CFG-1; stack::T-DEPLOY-1 | Passed |
| SC5, SC6 | ADR-0003, ADR-0008 | shell::T-DRV-*; live runs | Passed |
| SC7 | design kept as EJS | pages.test > T-UI-1; screenshots compared with the design by eye | Passed |
| SC8 | no backup | pages.test > T-DATA-1 | Passed |
| SC9 | exact pins | deps.test > T-DEP-1 (9 tests: pins, lockfile, Dockerfile, compose, shellcheck, `--ignore-scripts`, seven hooks) | Passed |
| LTA1–LTA10 | ADR-0003, 0004, 0008, 0001, 0002 | as their requirement rows | Passed |
| D4, D5, D6 | 26 buckets; no `synced`; no step kinds | trends.test; pages.test > T-UI-1 | Passed |
| D13 | loops | metrics.test (7) | Passed |
| D14, D16, D17 | repository label, 14 ch cap and full-key title in all five places | pages.test::repository label (incl. the five-places test); Chrome measurement | Passed |
| D15, D18 | driver independence, hand-started runs unreported | shell::T-DRV-2 | Passed |
| Out of scope: any action from the dashboard | no write route, no form | ingest.test > T-INT-9; pages.test > T-UI-1 | Passed |
| Out of scope: the dashboard changing the factory | no outbound connection | pages.test (no host in any page); the service has no client code | Passed |
| Out of scope: login, roles | no such table | migrations.test (six tables only) | Passed |
| Out of scope: cost in a currency | none | pages.test > T-UI-1 | Passed |
| Out of scope: light mode, phone layout | none | pages.test > T-UI-1 | Passed |
| Out of scope: hand-started runs; repository label with one repository | not built | shell::T-DRV-2; pages.test > T-REPO-2 | Passed |
| Later: notifications | Not built | – | – |

## Self-validation

Round 2 was run against a fresh `git clone` of the branch at de36c51, the whole procedure again (the round 1
numbers are kept where they were not affected). Project names of my own: `selfcheck-001`, `dash-stack-<pid>`.

| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Build and static | clone: `npm ci`, `tsc --noEmit`, `rm -rf dist && npm run build`; `docker compose build`; `claude plugin validate plugins/factory --strict`; `lint.sh` | Passed | typecheck clean, build emits `dist/` with 6 font files; shellcheck v0.11.0 clean on `report.sh`, `run.sh`, `lint.sh`; plugin validation passed; `claude plugin details factory` lists 7 hooks and the debug log says `Registered 7 hooks` |
| 2 | Tests | Node 26.9.0 container: `npx vitest run`; `run.sh --slow`; `npm run test:stack` | Passed | 290 passed, 0 failed, 0 skipped (before my work: no tests); shell 135 passed, 0 failed (macOS `sh`, `--slow` included); stack 7 passed |
| 3 | Traceability | table above | Passed | every row names a test that ran green |
| 4 | Real stack starts | `docker compose up -d` from `.env.example` only | Passed | healthy after 5.3 s (limit 60 s); logs: 0 lines matching error/stack/exception; migration `001_init.sql` applied on the empty database; there was no earlier schema to migrate from |
| 5 | Use it like a user | see below | Passed | see below |
| 6 | Data survives | `docker compose restart`; `down` then `up -d` (no `-v`) | Passed | round 1: healthz `tickets:32, openRuns:3` before, after restart and after down/up; round 2: stack test T-DEPLOY-1 (down without `-v`, then up: the ticket is still there) |
| 7 | Hard constraints | `npm run test:stack` | Passed | T-PERF-1 p95 85 ms (limit 300), T-PERF-2 p95 40 ms (limit 200), T-RES-1 peak 92 MiB of 256, OOMKilled false, restarts 0; T-ARCH-1 `linux/arm64` build with `--no-cache`: no `node-gyp`/compiler in the log, the container loads `better-sqlite3/prebuilds/linux-arm64.node`, no `gcc g++ make python3` in the image |
| 8 | Own diff review | `git diff c49506b..HEAD` | Passed | no debug output, TODO, commented-out code or secrets (`.env` untracked; the zip and `todo` not committed); one addition beyond the delta, named above (per-agent tokens `—`) |
| 9 | Tear down | `docker compose -p selfcheck-001 down -v`, volume and image removed | Done | no leftover containers or volumes |

### 5. Use it like a user

**API** against the running container (curl): `run-start` 204; missing meta 400; hook finish with a non-JSON
body 400; 3 MB body 413 (the limit is 2 MiB); `GET` on an ingest path 404; `PUT /` 404; unknown ticket 404
with the dark page; `/` sends `Cache-Control: no-store`, the CSP of the design, `nosniff`, no `X-Powered-By`.
Token 401 and "ignored without a token": ingest.test (curl against a token-less stack). Configuration error:
`LOOP_THRESHOLD=0` and `TZ=Mars/Olympus` make the container exit 1 with one line naming the variable.

**Real Claude Code 2.1.278** (`claude -p --plugin-dir plugins/factory`, Haiku, `FACTORY_STATE_DIR` and
`FACTORY_REPORT_LOG` pointed at scratch so `~/.factory` was not touched), against the container:

| Run | Result |
|---|---|
| Subagent run (a stand-in agent named `groom`, first two task lines as the coordinate skill writes them) | one run, `groom`, `groomed`, output verbatim, 21 k tokens, ticket title and status read from the requirements document; `PostToolUse` and `SubagentStop` both fired and made one run |
| Main-session run (`FACTORY_DRIVER=live-test`, `Factory-Run: architect 001`) | one run, `architect`, `designed`, the whole final message stored verbatim (the model added a prose line before `STATUS:`; it is line 01 of the list), 211 k tokens, state file removed at `SessionEnd` |
| Two-turn session in one process (`--input-format stream-json`): turn 1 spawns a `validator` subagent, turn 2 is typed by the operator | turn 1 was not an intervention; turn 2 is one intervention with the text verbatim (quotes, tab, newline, ✓); state file gone after the session |
| T-HOOK-2: the same prompt with the dashboard reachable, unreachable (closed port) and reporting off | the model's tool call, the tool result (modulo agent id, duration, tokens) and the final answer `done` are identical in all three; the unreachable run left three lines in the reporter's log and finished normally |
| CLI against the container: `report.sh intervention`, `run-start`, `run-finish --result --output-file` | all exit 0; the intervention text, and the file body as run output, are on the ticket |
| **Round 2, a real failed Agent call** (`Agent` with `subagent_type factory:groom` and `isolation: worktree`, started from a directory that is not a git repository, hooks from `--settings`): the harness answered `Cannot create agent worktree: not in a git repository …` | `PreToolUse` reported the start, `PostToolUseFailure` reported the failure through `run-failed`: one run, `groom`, `failed`, `ended_at` set, tokens `—`, output = the error string verbatim (line 01 and the Final output box), swimlane block bordered `rgb(255, 107, 107)` with `#FF9B9B` text, `no agents running` in the header, and the ticket on the Attention tab as `agent run failed` / `check`. Before the hook existed this run stayed open |
| Round 2, main-session run again with the final reporter (`FACTORY_DRIVER`, `Factory-Run: architect 001`) | one run, `architect`, `designed`, output verbatim, 31 k tokens |

Stand-in agents (round 1): the real factory agents would have run a whole stage each, so those runs used
`--agents` with a prompt that answers two lines (their outputs, `live test A`, are not what a real agent writes).
The hooks and the payloads are the same; what was not exercised is a real groom/architect/implementer/validator
stage and the coordinate skill itself. Twice a bare `subagent_type groom` resolved to the real `factory:groom`
(round 1 once, round 2 once, seen from `agent_type` in the payload); it only read files and answered
`nothing-to-do`, and `git status` showed nothing changed.

The plugin marketplace on this machine is a directory source (`/Users/vicokuras/IdeaProjects/factory`), so the
installed `factory` plugin now loads the working copy's `hooks/hooks.json` as well: with `--settings` hooks and
the plugin both active, every report arrived twice, which the dashboard absorbs (one run). Reporting stays off on
this machine until `FACTORY_DASHBOARD_URL` is set.

**UI** in Chrome 153 headless (DevTools protocol), against 16 seeded tickets in one repository, then 31 in two. Numbers read
from the page, not from the CSS:

| Requirement | Threshold | Measured |
|---|---|---|
| No sideways scroll (QE3), 6 pages at 1440 px and at 1024 px | `scrollWidth <= clientWidth` | 1440/1440 and 1024/1024 on all 12; 0 elements past the right edge |
| Dark background, fonts | `#0A0C0F`, IBM Plex, self-hosted | `rgb(10, 12, 15)`; Plex Sans 14 px / 20.3 px, title 26 px 600; Sans 400/500/600 and Mono 400/600 `loaded`; every request same-origin (7 on the overview) |
| Tab switch (QE2) | < 50 ms, no network | 29.6 to 33.3 ms in the first measurement, two animation frames (33 ms) included; after the font fix: resource entries 7 before and 7 after five switches (before the fix 6 then 7: one font weight was fetched on the first Pipeline visit) |
| Landing tab (R11) | Attention; `?tab=` honoured, unknown falls back | `["attention"]`, `["analytics"]`, `["attention"]` for `?tab=nonsense` |
| Header (S2) | pulsing green dot 7 px, text | `rgb(158, 232, 75)`, `af-pulse`, 7 x 7 px, "1 agent online"; grey static dot and "no agents running": pages.test |
| Attention card | left border 3 px in the severity colour, badge at 12 % alpha, id 12 px, title 15 px | `rgb(255, 107, 107)` / `rgba(255, 107, 107, 0.12)` / 12 px / 15 px (six reasons, four colours) |
| Calm chips | one row, id not truncated | 10 of 10: one row, 39 px high, id not truncated |
| Pipeline | four columns of 335 px | x = 32, 379, 726, 1073; counts 3 / 4 / 2 / 7 |
| Analytics | 4 cards, 7 buckets, labels on first / middle / last | `w32 – w38 · 7 weeks of data`; labels `w32 w35 w38`; last bar full colour |
| Per-ticket row | one row, design columns | one row; widths 120, 658, 92, 92, 108, 108, 96 px |
| Detail swimlane | blocks inside the lane, min 3.5 %, failure marked | all inside; 3.5 % for a zero-length human run; `failed` and `blocked-environment` blocks bordered `rgb(255, 107, 107)`; label only when wider than 11 % |
| Run expansion | native `<details>`, toggle labels swap | closed: two "show" labels visible, "hide" hidden; after a click: reverse, two numbered rows on one line each |
| JavaScript disabled | all three panels visible, links work | `["attention","pipeline","analytics"]` |
| Repository label (R3), 2 repositories, 3 tabs | on every ticket; 11 px Plex Mono `#6E7887`; one row; 14 ch cap | 31 of 31 tickets labelled on Attention, Pipeline and Analytics; `11px`, `rgb(110, 120, 135)`, one row, `max-width: 92.4px`, `text-overflow: ellipsis`; `title` = the full key; every link canonical; `/ticket/101` answered 302 to the canonical URL of the newest 101; the label is not on the page with one repository (pages.test) |
| 404 | dark page with a way back | "That ticket is not here. ← back to the overview" |

Screenshots were looked at (Attention, Detail, Analytics, two repositories, and in round 2 the detail page of the
failed run). Three defects came out of them and were fixed and tested: a first switch to Pipeline fetched a font
(now preloaded), the label sat against the id (` · factory` lost its space in an inline-block; now a 4 px margin),
and `Tokens per agent` showed `0` for a run with no token count (now `—`).

### Not run

- **A real coordinator round with the real factory agents** (T-HOOK-2 as the design words it): stand-in agents
  were used, see above. The reporter and the hook payloads are the same; the agents' own final messages
  (`STATUS:`, `SUMMARY:`) are exercised only by fixtures and the stand-ins.
- **A Raspberry Pi.** T-PERF, T-RES and T-ARCH ran in Docker Desktop on an Apple-silicon Mac, `--cpus=1`
  `--memory=256m` applied, `linux/arm64` image. The CPU of a Pi 4/5 is slower than this Mac's, so the latency
  margin (90 ms against 300 ms) is a Mac number; the memory number does not depend on it.
- **Previous-schema migration**: there is no previous schema (design, Migration from the current state).
- **A subagent that dies mid-run** (rate limit, crash): could not be provoked cheaply. The dashboard accepts
  either finish (`SubagentStop` with a half message, `PostToolUseFailure`) in any order (T-HOOK-5); which one a
  given Claude Code version fires is not known from here.
- **The full suite run back to back many times**: a run opens about 2 200 short-lived TCP connections
  (supertest, one per request); more than about 7 runs within 30 s exhaust the ephemeral port range through
  `TIME_WAIT` (measured: 2 179 sockets after one run; 2 of 25 consecutive container runs, and 2 of 6 on the host,
  failed with `Cannot read properties of null (reading 'port')` or a timeout). One run, or runs a minute apart, is
  reliable: 15 single runs in a row before that, and every run in the procedure above, passed.

## Implementation choices

- **Tests run on Node 26 in a container and on the host.** The host has Node 25.8.1; the whole suite also
  passes there, but the reported numbers are from `node:26.9.0-trixie-slim`.
- **`npm ci --ignore-scripts` in the Dockerfile.** `better-sqlite3` 13.0.3 has a `binding.gyp` and an `install`
  script (`node-gyp rebuild`), which npm runs when `--ignore-scripts` is absent and which fails without Python
  and a compiler (it did). The package's `gypfile: false` and its `prebuilds/` folder are what the design relies
  on; with scripts ignored, the prebuilt `linux-arm64.node` is what gets loaded (T-ARCH-1 proves it). The design
  says `npm ci --foreground-scripts`, which starts the failing build.
- The builder also deletes the other platforms' prebuilds and the C++ sources from the final `node_modules`
  (image size only).
- **Hooks manifest key** (design revision 3 now says the same): 2.1.278 loads `hooks/hooks.json` by itself and
  reports `Duplicate hooks file detected … hook-load-failed` for a manifest key. No key; the seven hooks register.
  `claude plugin validate` passes with and without the key, so it does not catch this.
- **Payload facts the design did not have** (all from captures, all in `test/fixtures/hooks/README.md`): a
  subagent runs in the background by default, and then `PostToolUse` is an `async_launched` acknowledgement;
  `SubagentStop` fires before `PostToolUse` for a foreground agent and carries `last_assistant_message` and
  `agent_transcript_path`; both are used (design fallback order kept, `last_assistant_message` added after
  `tool_response`). A `<task-notification>` that the harness injects when a background agent ends arrives as a
  `UserPromptSubmit`; the prompt hook ignores it, so it is never an intervention.
- **`tool_response.usage`/`totalTokens` is the last API response only** (34 098 against 55 345 for the whole
  agent in one capture); ADR-0004 now leads with the transcript delta, which is what is built.
- **Token counting** takes the last `usage` block per `requestId`: one API response is written as several
  transcript lines that repeat its usage (the first with a partial output count).
- Ticket detection in hook mode also reads `Product repo: <path>` (the coordinate skill's first line) to find
  the requirements document, and skips helper subagents (`general-purpose`, `Explore`): only `subagent_type`
  `groom|architect|implementer|validator`, with or without `factory:`, is reported.
- Views: `<a>` instead of `<div onClick>` for cards, chips and rows, so the links work without JavaScript; the
  design's `style-hover` became `:hover` rules keyed by a class, as ADR-0002 says.
- The `noscript` block re-shows the three panels; the inactive ones carry the `hidden` attribute.
- The empty data URL as the page icon keeps the browser from requesting `/favicon.ico`.
- `supertest` ships no types and `@types/supertest` is not in the design's list; `test/types-supertest.d.ts`
  declares what the tests call, likewise `src/types/vendor.d.ts` for `better-sqlite3` and `ejs`. No dependency
  was added.
- **`run-failed` and non-factory Agent calls.** The reporter's existing filter (only `subagent_type`
  `groom|architect|implementer|validator`, with or without `factory:`) also applies to `run-failed`, so a failing
  helper subagent sends nothing. The design lets the dashboard drop such a failure ("finds no run"); it would only
  do so when no run of the ticket is open, because the dashboard's third matching rule is "the newest open run for
  `(project, number)`", which a helper's failure could otherwise finish as `failed` while a factory run of the same
  ticket is in flight. Nothing is stored either way (T-HOOK-4 tests the dashboard side, shell::T-HOOK-6 the filter).
- **`run-failed` as a CLI call is a no-op**: a driver states a failure with `run-finish --result failed`.
- **Failure first, then `SubagentStop`**: the second delivery has no `tool_use_id`, and the matching rules only
  consider open runs, so it is dropped and logged (`report_drop`); the run is already `failed` and closed. The
  design's T-HOOK-5 is met (one run, `failed`, one `ended_at`); what the late delivery would have filled (tokens)
  stays `NULL`. Claude Code did not fire a `SubagentStop` after a failed call in any capture.
- The stack tests seed 3 010 runs through the ingest endpoints (so the seed is also a load test of ingest).
- **G2** (chip truncation) is built per §R3; see the gaps file.

## Tests changed

Two tests written in round 1 encoded what design revision 3 replaced; both are changed, not weakened:

- `payload.test`: "a failed Agent call (PostToolUseFailure) sets the error flag and has no output" became "…the
  error flag comes from the top-level error string, which is also the output" (design: the `error` string is the
  output), plus two new tests (no transcript output for a failed call; an empty or non-string `error` is no error).
- `ingest.test`: "the tool payload's own usage wins over the delta" became "the delta leads: it wins over a
  tool_response.usage block" (ADR-0004), plus a test of the fallback order.
- `metrics.test`: an agent whose runs have no token count now has `tokens: null`, not `0` (the `—` fix above).

## Open gaps

None. `docs/architecture/.gaps/001-agent-factory-dashboard.md` holds G1 and G2, both marked resolved by the
architect and built as answered.

## Validator findings

None yet (round 1 of validation).
