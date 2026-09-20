# 001 – Agent Factory Dashboard: implementation

- Requirements: docs/requirements/001-agent-factory-dashboard.md
- Design: docs/architecture/001-agent-factory-dashboard.md
- Status: Needs architect (one gap, G1; everything else built and self-validated)
- Branch: feature/001-agent-factory-dashboard, commits 95c95af..(the commit that adds this report)
- Date: 2026-09-20
- Round: 1

The requirements status line stays `Designed – ready for implementation` and the index in
`docs/product.md` stays `Designed`, because a gap is open (see "Open gaps").

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

Not done: the failed-Agent-call path of the reporter (G1, blocked on the architect). The seventh hook is one
`hooks.json` entry; the dashboard side already handles its payload.

`tests/acceptance/` does not exist and was not touched.

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
| S4.2 | swimlanes in `buildDetail` | pages.test > T-INT-D2 (3), running and abandoned runs | Passed (`failed` from the Agent-tool error path: G1) |
| S4.3 | run log | pages.test > T-INT-D3 (2) | Passed |
| S4.4, R5, R6 | `ingest/payload.ts`, `outputLines`, `<details>` | payload.test::output handling (T-UNIT-OUT-1); pages.test > T-INT-D4 (3) | Passed |
| S4.5, R4 | `actor = 'human'` runs | pages.test > T-INT-D5 (4); ingest.test > T-DRV-4 (5) | Passed |
| S4.6 | `ticket_status_event` | pages.test > T-INT-D6; ingest.test::run-start (status events) | Passed |
| S5.1 | `domain/trends.ts` | trends.test (T-UNIT-TRD-1…4); pages.test > T-INT-N1 | Passed |
| S5.2 | `deltaOf` | trends.test::delta; pages.test > T-INT-N2 | Passed |
| S5.3 | `weekBuckets`, `periodLine` | trends.test::naming the period; pages.test > T-INT-N3 | Passed |
| S5.4 | table in `analytics.ejs` | pages.test > T-INT-N4 (2) | Passed |
| S5.5 | agent spend | pages.test > T-INT-N5 | Passed |
| S5.6 | five bounce rows | pages.test > T-INT-N6 | Passed (the `agent run failed` count includes Agent-tool errors only after G1) |
| S6.1, S6.2 | `ingest/*`, hooks, `report.sh` | payload.test (T-HOOK-1); ingest.test::run-start, run-finish, T-DRV-1, T-DRV-5; shell::subagent hooks, main-session finish; live runs below | Passed |
| S6.3, S6.4 | verbatim storage; hooks write nothing to stdout | payload.test::output handling; ingest.test::stores the output verbatim; shell::T-R9-1 (no output on any path); live T-HOOK-2 | Passed |
| S6.5 | prompt hook, CLI intervention, merge rule | shell::T-DRV-2, T-DRV-3; ingest.test > T-DRV-4; live intervention | Passed |
| S6.6 | plugin hooks and CLI, no line in the coordinate skill | shell (T-DRV-1…3 halves); ingest.test::a driver that is not the coordinator; live main-session run | Passed |
| S6.7 | `report.sh exit 0` everywhere | shell::T-R9-1, T-R9-2, T-R9-3 | Passed |
| S6.8 | project key derivation | shell::T-CFG-1; ingest.test::two repositories | Passed |
| S6.9 | prompt hook decision table | shell::T-DRV-2 | Passed |
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
| SC9 | exact pins | deps.test > T-DEP-1 (7 tests) | Passed |
| LTA1–LTA10 | ADR-0003, 0004, 0008, 0001, 0002 | as their requirement rows | Passed |
| D4, D5, D6 | 26 buckets; no `synced`; no step kinds | trends.test; pages.test > T-UI-1 | Passed |
| D13 | loops | metrics.test (7) | Passed |
| D14, D16, D17 | repository label | pages.test::repository label; Chrome measurement | Passed (chip truncation: G2) |
| D15, D18 | driver independence, hand-started runs unreported | shell::T-DRV-2 | Passed |
| Out of scope: any action from the dashboard | no write route, no form | ingest.test > T-INT-9; pages.test > T-UI-1 | Passed |
| Out of scope: the dashboard changing the factory | no outbound connection | pages.test (no host in any page); the service has no client code | Passed |
| Out of scope: login, roles | no such table | migrations.test (six tables only) | Passed |
| Out of scope: cost in a currency | none | pages.test > T-UI-1 | Passed |
| Out of scope: light mode, phone layout | none | pages.test > T-UI-1 | Passed |
| Out of scope: hand-started runs; repository label with one repository | not built | shell::T-DRV-2; pages.test > T-REPO-2 | Passed |
| Later: notifications | Not built | – | – |

## Self-validation

Run against a fresh `git clone` of the branch at 4703efa (plus the checks that need a running stack on
the stack below). Project names of my own: `selfcheck-001`, `dash-stack-<pid>`.

| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Build and static | clone: `npm ci`, `tsc --noEmit`, `rm -rf dist && npm run build`; `docker compose build`; `claude plugin validate plugins/factory --strict`; `lint.sh` | Passed | typecheck clean, build emits `dist/` with 7 fonts; shellcheck v0.11.0 clean on `report.sh`, `run.sh`, `lint.sh`; plugin validation passed |
| 2 | Tests | Node 26.9.0 container: `npx vitest run`; `run.sh --slow`; `npm run test:stack` | Passed | 272 passed, 0 failed, 0 skipped (before my work: no tests); shell 115 passed, 0 failed; stack 7 passed |
| 3 | Traceability | table above | Passed | every row names a test that ran green |
| 4 | Real stack starts | `docker compose up -d` from `.env.example` only | Passed | healthy after 5.3 s (limit 60 s); logs: 0 lines matching error/stack/exception; migration `001_init.sql` applied on the empty database; there was no earlier schema to migrate from |
| 5 | Use it like a user | see below | Passed | see below |
| 6 | Data survives | `docker compose restart`; `down` then `up -d` (no `-v`) | Passed | healthz `tickets:32, openRuns:3` before, after restart and after down/up; also after three image rebuilds |
| 7 | Hard constraints | `npm run test:stack` | Passed | T-PERF-1 p95 90 ms (limit 300), T-PERF-2 p95 34 ms (limit 200), T-RES-1 peak 96 MiB of 256, OOMKilled false, restarts 0; T-ARCH-1 `linux/arm64` build with `--no-cache`: no `node-gyp`/compiler in the log, the container loads `better-sqlite3/prebuilds/linux-arm64.node`, no `gcc g++ make python3` in the image |
| 8 | Own diff review | `git diff c49506b..HEAD` | Passed | no debug output, TODO, commented-out code or secrets (`.env` untracked; the zip and `todo` not committed); one scope note: the Dockerfile passes `--ignore-scripts` to `npm ci` and `npm prune` (see choices) |
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

Stand-in agents: the real factory agents would have run a whole stage each, so the runs used `--agents` with a
prompt that answers two lines. The hooks and the payloads are the same; what was not exercised is a real
groom/architect/implementer/validator stage and the coordinate skill itself. (Once the first prompt also
selected `factory:groom`, the real agent, which only read files; `git status` showed nothing changed.)

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

Screenshots were looked at (Attention, Detail, Analytics, two repositories). Two defects came out of them and
were fixed and tested before hand-over: a first switch to Pipeline fetched a font (now preloaded), and the
label sat against the id (` · factory` lost its space in an inline-block; now a 4 px margin).

### Not run

- **A real coordinator round with the real factory agents** (T-HOOK-2 as the design words it): stand-in agents
  were used, see above. The reporter and the hook payloads are the same; the agents' own final messages
  (`STATUS:`, `SUMMARY:`) are exercised only by fixtures and the stand-ins.
- **A Raspberry Pi.** T-PERF, T-RES and T-ARCH ran in Docker Desktop on an Apple-silicon Mac, `--cpus=1`
  `--memory=256m` applied, `linux/arm64` image. The CPU of a Pi 4/5 is slower than this Mac's, so the latency
  margin (90 ms against 300 ms) is a Mac number; the memory number does not depend on it.
- **Previous-schema migration**: there is no previous schema (design, Migration from the current state).
- **Fail-mid-run of a real subagent** (rate limit, crash): could not be provoked cheaply; see G1.

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
- **Hooks manifest key**: the design says to add `"hooks": "./hooks/hooks.json"` to `plugin.json` and to fall
  back if the installed Claude Code rejects it. It does: 2.1.278 loads `hooks/hooks.json` by itself and reports
  `Duplicate hooks file detected … hook-load-failed` for the manifest key. The key is removed; the six hooks
  register (`claude plugin details factory` lists them; debug log: `Registered 6 hooks`). `claude plugin
  validate` passes with and without the key, so it does not catch this.
- **Payload facts the design did not have** (all from captures, all in `test/fixtures/hooks/README.md`): a
  subagent runs in the background by default, and then `PostToolUse` is an `async_launched` acknowledgement;
  `SubagentStop` fires before `PostToolUse` for a foreground agent and carries `last_assistant_message` and
  `agent_transcript_path`; both are used (design fallback order kept, `last_assistant_message` added after
  `tool_response`). A `<task-notification>` that the harness injects when a background agent ends arrives as a
  `UserPromptSubmit`; the prompt hook ignores it, so it is never an intervention.
- **`tool_response.usage`/`totalTokens` is the last API response only** (34 098 against 55 345 for the whole
  agent in one capture). The design's order (usage first) is kept. In practice `SubagentStop`, which carries the
  transcript sum, arrives first and `PostToolUse` only fills what is still `NULL`; if the order ever flipped,
  tokens would be under-counted. Architect: worth a line in ADR-0004.
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
- The stack tests seed 3 010 runs through the ingest endpoints (so the seed is also a load test of ingest).
- **G2** (chip truncation) is built per §R3; see the gaps file.

## Tests changed

None. No test existed before this work.

## Open gaps

`docs/architecture/.gaps/001-agent-factory-dashboard.md`:

- **G1 – a failed Agent call arrives as `PostToolUseFailure`**, which none of the six hooks listens to. Blocks
  the `failed` marking of a run that ends as an Agent-tool error (S4.2), the `agent run failed` bounce row
  (S5.6) and R1 rule 3 for that case. Everything else is built; a `STATUS: failed` run works.
- **G2 – the design says two things about the label in a chip** (14-character ellipsis versus "never
  truncated"). Blocks nothing; §R3's reading is built.

## Validator findings

None yet (round 1).
