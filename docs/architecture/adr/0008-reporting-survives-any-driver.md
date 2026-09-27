# 0008 – Reporting is owned by the plugin and survives any driver of the pipeline

- Status: Accepted
- Date: 2026-09-20
- Requirements: 001 R13, R4, R9, S6.1, S6.2, S6.5, S6.6, S6.9, D15, D18, SC5, LTA4, LTA5

## Context

R13: "Whatever drives the pipeline — today's coordinator or the shell script that replaces it —
every agent run and every intervention of the operator must still reach the dashboard. A
requirement is never met by 'the coordinator does it' alone." The stakeholder intends to switch the
coordinator off (D15).

Two facts pull against each other:

- ADR-0003's hooks fire on the **Agent tool**. They see a stage the coordinator spawns as a
  subagent. A shell script that runs one stage per `claude -p` invocation runs that stage as the
  session's *main* agent, where no Agent-tool hook fires at all.
- D18/S6.9 say a stage the operator types into a chat by hand must **not** reach the dashboard. In
  the payload, `/factory:architect` typed by a person and `/factory:architect` sent by a script are
  the same string.

Plus R4: an intervention must be recorded whoever drives the pipeline — which the first revision of
this design did with a paragraph inside the coordinate skill, exactly the dependency R13 forbids.

The shell script does not exist yet, so its shape is an assumption. What can be relied on is that
it starts Claude Code with the `factory` plugin enabled — that is the only place these agents exist
— and that it must name the stage and the requirements document, because otherwise Claude Code
would not know what to run.

## Options

### A – Keep the Agent-tool hooks and ask the future script to spawn stages as subagents
Costs nothing today and makes the script's job harder tomorrow, for no reason the script's author
would understand. It also fails silently: a script that runs stages the natural way reports
nothing, and nobody notices until the dashboard is empty.

### B – Hook every level of the session as well, and let the driver declare itself with one
environment variable
`UserPromptSubmit`, `Stop` and `SessionEnd` cover a stage that runs as the main agent.
`FACTORY_DRIVER` in the environment (or a `Factory-Run:` line in the prompt) is what separates a
driven run from a person typing into a chat, which is the only way to honour R13 and D18 at the
same time. Interventions come from the same prompt hook: a prompt in a session that is already
running the pipeline *is* the operator acting on that ticket, and its text is literally "what I
did" (R4), with no paraphrase in between (in the spirit of R6). Nothing lives in the coordinate
skill.

### C – A wrapper the operator must start Claude Code through
Reports everything, including hand-started chats, and replaces how the operator works. Rejected in
ADR-0003 and still rejected; it would also break D18.

## Decision

Option B, in three layers, all shipped with the plugin:

1. **Subagent hooks** (`PreToolUse`, `PostToolUse`, `SubagentStop`) — the coordinator today, and any
   driver that asks a session to spawn a stage. No cooperation needed.
2. **Session hooks** (`UserPromptSubmit`, `Stop`, `SessionEnd`) — a stage that is the main agent of
   its own session. They act only when the driver has declared itself with `FACTORY_DRIVER` or a
   `Factory-Run:` line, and they record an intervention when the operator types into a session the
   factory is already running in. Without either signal they make no network call at all, which is
   exactly D18.
3. **CLI mode** of the same script — `run-start`, `run-finish`, `intervention` with flags — for a
   driver that collects the operator's answer on its own terminal, or that does not use Claude Code
   at all.

A future driver's whole contract is therefore: have the plugin enabled, export `FACTORY_DRIVER`,
name the agent and the ticket (in the prompt or in `FACTORY_AGENT`/`FACTORY_TICKET`), and call
`report.sh intervention` for answers it takes outside Claude Code. The design's §R13 states it as
four points, and the README repeats it with a worked example.

## Consequences

- The coordinate skill loses its intervention paragraph. Reporting now has no line outside
  `plugins/factory/hooks/`, so switching the coordinator off changes nothing about it.
- Three hooks now fire in **every** Claude Code session on that machine, including sessions that
  have nothing to do with the factory. They must therefore be cheap and silent: the decision is
  taken from the environment and one small state file, no network call is made in the common case,
  nothing is written to stdout, and every path exits 0 (R9, QE6). T-DRV-2 pins that.
- A per-session state file (`~/.factory/sessions/<session_id>.state`) is new state on the operator's
  machine. It is a few bytes, removed at session end, swept after seven days, and losing it costs at
  most one intervention.
- Every prompt in a session that is already running the pipeline counts as one intervention. That
  is deliberate (design assumption 10b) and it is what makes the number the stakeholder watches
  driver-independent.
- A driver that reports both by hook and by CLI does not double-count: runs are matched, and
  interventions within 120 s of each other on the same ticket are merged.
- If Claude Code renames or drops `UserPromptSubmit`, `Stop` or `SessionEnd`, main-session runs stop
  being reported while subagent runs continue. The failure mode is the one R9 prescribes — lost
  history, never lost work — and the implementer is told to raise it as a design gap rather than
  quietly dropping the event.
