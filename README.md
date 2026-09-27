# factory

A software factory: four autonomous stages that turn an idea into validated software.

```
groom → architect → implementer → validator
```

Each stage is a **skill** (the method) plus an **agent** (the autonomous runner of that method).
Grooming is the one stage meant to be run interactively with a human; the `groom` agent exists
for the return path, when the validator or the architect sends a change request back to
requirements.

The repository is both a Claude Code **plugin** and the **marketplace** that serves it, so the
factory installs on any machine without absolute paths.

## Layout

```
.claude-plugin/marketplace.json     the marketplace index
plugins/factory/
  .claude-plugin/plugin.json        the plugin manifest
  agents/                           groom, architect, implementer, validator
  skills/                           the same four, as skills with references/
  hooks/                            hooks.json and report.sh: the factory's reporting
dashboard/                          the dashboard application (Node, SQLite)
docker-compose.yml                  starts it
evals/                              every skill eval: cases, fixtures, runs (see evals/README.md)
```

## Install on a machine

```bash
claude plugin marketplace add vkuras/factory
claude plugin install factory@factory
```

Then restart Claude Code. `claude plugin details factory` lists what got registered: four skills
and four agents, available in every project on that machine.

For work on the factory itself, point the marketplace at the working copy instead, so edits take
effect without pushing:

```bash
claude plugin marketplace add ./
claude plugin install factory@factory
```

## How the agents find their skill

An agent invokes its skill by name (`factory:validator`), never by file path. Plugin skills
resolve the same way on every machine, which is why the agents carry `Skill` in their tool list
and no path anywhere.

## Models

| Stage | Model | Why |
|---|---|---|
| groom | opus | Requirements are the most expensive place to be wrong |
| architect | opus | Design decisions bind everything downstream |
| implementer | sonnet | Bounded work against an explicit design |
| validator | opus | Last check before the stakeholder sees the product |

## Dashboard

`dashboard/` is a small web application that shows what the factory does: which tickets need you
and why (Attention), where every ticket sits (Pipeline), whether the factory improves (Analytics),
and one ticket's whole life (detail view). It only shows; every action stays in Claude Code. It is
one Docker container with one volume, built for a Raspberry Pi (`linux/arm64`, limited to 256 MB
and one CPU).

```bash
cp .env.example .env        # optional: every variable has a default
docker compose up -d        # http://localhost:8787
```

`.env` variables (all optional, defaults in `.env.example`): `DASHBOARD_PORT`, `DASHBOARD_BIND`
(`127.0.0.1` locks it to the machine), `TZ` (the zone every time and week is shown in),
`LOOP_THRESHOLD` and `IDLE_HOURS` (when a ticket needs you), `RUN_STALE_HOURS` (when an unfinished
run counts as abandoned) and `FACTORY_INGEST_TOKEN` (a bearer token the reports must carry).

### Point a machine at it

The plugin ships the seven hooks that report (`PreToolUse`, `PostToolUse`, `PostToolUseFailure`,
`SubagentStop`, `UserPromptSubmit`, `Stop`, `SessionEnd`; `claude plugin details factory` lists them).
A machine reports when it has a file `~/.factory/dashboard.env`:

```
FACTORY_DASHBOARD_URL=http://pi.local:8787
# FACTORY_INGEST_TOKEN=...        must match the dashboard's, when it has one
# FACTORY_PROJECT_KEY=...         overrides the repository name derived from the git remote
```

Environment variables of the Claude Code process win over the file. Without
`FACTORY_DASHBOARD_URL` reporting is off and the hooks return immediately. To check it: open
`http://<host>:8787/healthz`, run one coordinator round, reload the page. If nothing arrives,
read `~/.factory/report.log`: every failed report leaves one line there, and reporting never fails
a run (a dashboard that is down costs history, never work).

The repository a ticket comes from is derived from the git `origin` remote (`host/owner/repo`) or
the directory name. While only one repository has reported, no repository is shown anywhere. From
the moment a second one reports, every ticket shows the repository it comes from, by itself.

### Driving the factory without the coordinator

Reporting lives entirely in the plugin (`plugins/factory/hooks/`), so switching the coordinator off
changes nothing about it. A script that runs one stage per Claude Code session has a four-point
contract:

1. Have the `factory` plugin installed and enabled in the session it starts.
2. Export `FACTORY_DRIVER=<a name>` for the Claude Code process, and either name the agent and the
   requirements document in the prompt or export `FACTORY_AGENT` and `FACTORY_TICKET`.
3. Have `~/.factory/dashboard.env` on that machine.
4. When it takes an answer from the operator outside Claude Code, call
   `report.sh intervention` with that answer.

```sh
export FACTORY_DRIVER=my-script
claude -p "Factory-Run: architect 001
Requirements: 001 (docs/requirements/001-agent-factory-dashboard.md)
Run /factory:architect."

sh plugins/factory/hooks/report.sh intervention --ticket 001 --repo "$PWD" \
   --what "answered the open question on R3 in the merge request"
```

A driver that never touches Claude Code reports with the same script:
`report.sh run-start --agent architect --ticket 001 --repo DIR`, then `report.sh run-finish
--ticket 001 --repo DIR --result designed --output-file out.txt`. Check `~/.factory/report.log`
once after wiring a driver up: a missing agent or ticket is logged there. A stage you start by hand
in a chat is deliberately not reported, and every message you type into a session that is already
running the pipeline counts as one intervention.

### No backup

There is none, by decision. The history lives in the `dashboard-data` volume and the application
never deletes anything, but if the SD card dies the history is gone; the factory keeps working,
because the dashboard is a read-only mirror of what it already did. To copy the volume by hand,
with the stack stopped: `docker run --rm -v dashboard-data:/d -v "$PWD":/out busybox cp
/d/factory.sqlite /out/` (the volume is named `<project>_dashboard-data` under compose).

### Tests

```bash
cd dashboard && npm ci && npm test        # unit, integration, DOM (Node 26)
npm run test:stack                        # performance, memory, arm64 and deploy tests (need Docker)
sh plugins/factory/hooks/test/run.sh      # the reporter (add --slow for the timeout test)
sh plugins/factory/hooks/test/lint.sh     # shellcheck v0.11.0 in a container
```

## Evaluating a skill

Everything that evaluates a skill lives in [`evals/`](evals/README.md), and nowhere else: the
cases, the fixtures they run against, and every run with its benchmark. New evals, for an
existing skill or a new one, go there too.
