# Captured hook payloads

Real payloads written by the installed Claude Code (2.1.278, entrypoint `claude -p`, model haiku)
on 2026-09-20 with a hook that dumped stdin to a file for every event. They are the fixtures of
T-HOOK-1 and T-DRV-1 (design, Build order, slice 1); every parser in `src/ingest/payload.ts` is
written against them.

Sanitised for the repository: the operator's home directory became `/home/operator`, the scratch
directory `/tmp/claude`; the transcripts keep only `user` and `assistant` entries, opaque thinking
signatures are emptied and long tool results are cut. Nothing else was changed, in particular no
field name, no usage counter and no message text.

| File | Event | What it shows |
|---|---|---|
| `pre-tool-use.json` | `PreToolUse` (Agent) | `tool_name: "Agent"`, `tool_input.subagent_type`, `tool_input.prompt`, `tool_use_id` |
| `post-tool-use-foreground.json` | `PostToolUse` (Agent, `run_in_background: false`) | `tool_response.content[]` text blocks, `usage`, `totalTokens`, `agentId` |
| `post-tool-use-background-ack.json` | `PostToolUse` (Agent, default mode) | `tool_response` is `{isAsync: true, status: "async_launched", agentId, ...}`: an acknowledgement, not a finish |
| `subagent-stop-foreground.json` | `SubagentStop` (foreground agent) | `last_assistant_message`, `agent_transcript_path`, `agent_type`, no `tool_use_id`; fires **before** the `PostToolUse` |
| `subagent-stop-background.json` | `SubagentStop` (background agent) | the same for an agent that ran in the background |
| `subagent-*.transcript.jsonl` | the agent's own transcript | every entry `isSidechain: true`; one API response is split over several entries that repeat one `usage` block |
| `post-tool-use-failure.json` | `PostToolUseFailure` (Agent) | a failed Agent call arrives here with a top-level `error` string, **not** as `PostToolUse` |
| `user-prompt-submit-driver.json` | `UserPromptSubmit` | `prompt`, run with `FACTORY_DRIVER` set |
| `user-prompt-submit-task-notification.json` | `UserPromptSubmit` | a `<task-notification>` the harness injects when a background agent ends: not typed by the operator |
| `stop-main.json` | `Stop` | `last_assistant_message` of the main agent |
| `session-end.json` | `SessionEnd` | `reason`, no transcript content |
| `main-session.transcript.jsonl` | the session transcript | non-sidechain entries |

The transcripts were captured by three `claude -p --settings <hooks>` runs in the factory
repository: a background subagent (`general-purpose`), a foreground subagent, an unknown
`subagent_type` (the error case), and a main-session run started with `FACTORY_DRIVER=capture`
and a `Factory-Run: architect 001` line. The agents were `general-purpose`, not the factory agents:
running a real groom/architect/implementer/validator stage only to see its payload would have cost
a full stage; the payload shape does not depend on which agent ran.
