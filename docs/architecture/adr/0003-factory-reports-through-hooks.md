# 0003 – The factory reports through Claude Code hooks, not through a skill the agents call

- Status: Accepted (revised 2026-09-20 for R13; the driver-independent part is ADR-0008)
- Date: 2026-09-20
- Requirements: 001 S6, R5, R6, R9, R10, R13, QE6, SC5, SC6, LTA1–LTA5

## Context

Every agent run has to reach the dashboard: that it started, on which ticket, by which agent, and
when it ends, with the agent's output, its result, its duration and its tokens (S6). Three
requirements constrain how:

- **R9**: if reporting fails for any reason, the run continues and finishes. The dashboard never
  costs work, only history.
- **R6 / R5**: what the dashboard shows is what the agent produced, not a summary rewritten for
  the dashboard, and the same output still appears in Claude Code.
- **QE6**: the factory must not become noticeably slower or less reliable because it reports.

The stakeholder leaned towards "a skill the agents call at the end" and explicitly handed the
decision to the architect (SC5, D3).

## Options

### A – A reporting skill (or an instruction in each agent file) the agent invokes at the end
Matches the stakeholder's leaning. But the reporter is then the same LLM whose work is being
reported: it can forget the call (a missing run silently disappears from history), it costs tokens
and wall-clock time on every run (QE6), and it must re-state its own output as an argument — which
is a rewrite by construction and puts R6 at the mercy of a model's copy-paste discipline. It also
cannot report the *start* of a run (S6.1, R7): the agent's first act would have to be a call, and
a crashed or skipped call leaves the dashboard blind.

### B – Claude Code hooks shipped with the plugin (`PreToolUse`, `PostToolUse`, `SubagentStop`)
Deterministic: the harness fires them, not the model. Zero tokens. The payload carries the agent's
final message as text, so the output is copied byte for byte (R6) and nothing about the Claude Code
output changes (R5). A hook that always exits 0 cannot fail a run (R9). Configuration is per
installation, which is exactly R10. The cost: the hook payload shapes are Claude Code's, not ours,
so the parser must tolerate their variation, and hooks only see agents spawned through the Agent
tool.

### C – A wrapper process around Claude Code that tails the session transcript
Reports everything, including manual runs, but replaces the way the operator starts Claude Code,
which is far outside what was asked, and breaks as soon as they start it another way.

## Decision

Option B. R9 and R6 are hard requirements and option A meets both only if a model reliably
remembers to do something and copies text without touching it; option B meets both by
construction, at zero token cost. The stakeholder's leaning was a preference, explicitly handed
over, and the need behind it — "the agents must report" — is met.

Six hooks, registered by the plugin in `plugins/factory/hooks/hooks.json`:

| Hook | Matcher | Purpose |
|---|---|---|
| `PreToolUse` | `Agent\|Task` | run start of a subagent: ticket, agent, start time, status before |
| `PostToolUse` | `Agent\|Task` | run finish for foreground subagents, including the tool's own usage numbers |
| `SubagentStop` | – | run finish for background subagents, from the subagent's transcript |
| `UserPromptSubmit` | – | run start of a stage that is the session's main agent, or an operator intervention |
| `Stop` | – | run finish of such a main-session run |
| `SessionEnd` | – | closes a main-session run that never finished, and cleans up the session state |

All six call the same POSIX shell script, which always exits 0 and never writes to stdout. Which of
the six fire depends only on how the agent was started, not on who started it; ADR-0008 covers the
three session-level hooks, the operator's interventions and the command-line mode for a driver that
never touches Claude Code. Interventions are *not* reported by the coordinate skill: the first
revision of this design did that, and R13 made it the one part of reporting that would disappear
with the coordinator.

## Consequences

- The factory's agent files stay unchanged; the coordinate skill gains one guaranteed line in every
  task message (`Requirements: NNN (docs/requirements/NNN-<slug>.md)`), which improves the ticket
  detection but is not what makes reporting work.
- A stage the operator types into a chat by hand is deliberately not reported (D18, S6.9); its
  effect on the ticket's status is picked up by the next reported run. See ADR-0008 for how that is
  told apart from a stage a script started the same way.
- The hook payload field names are an external contract the product does not own. Build slice 1
  captures real payloads and commits them as test fixtures; every parser has a defined fallback and
  a defined "unknown" outcome.
- A worst case of 2 s (start) plus 5 s (finish) is added to a run when the dashboard is
  unreachable, on runs that take minutes. Verified by T-R9-2.
- If Claude Code ever changes or drops these hook events, reporting stops and the factory keeps
  working — which is exactly the failure mode R9 asks for.
