# Gaps – 001 Agent Factory Dashboard

Raised by the implementer, round 1, 2026-09-20. Evidence: real payloads captured from the installed
Claude Code 2.1.278 (`dashboard/test/fixtures/hooks/`, README there).

## G1 – A failed Agent call arrives as `PostToolUseFailure`, which none of the six hooks listens to
- Status: Resolved – see design §Changes to the factory plugin 1, §`POST /api/hook/run-finish`,
  §R13 (case A), §Run result, assumption 19, ADR-0003, ADR-0004
- Design: §Interfaces `POST /api/hook/run-finish` (error flag: "`tool_response.is_error` | `tool_response.isError` | `is_error` is truthy"), §Run result ("`failed` — the tool payload flags an error"), §Changes to the factory plugin 1 (six hooks: `PreToolUse`, `PostToolUse`, `SubagentStop`, `UserPromptSubmit`, `Stop`, `SessionEnd`), ADR-0003 (the same six)
- Requirement: S4.2 (a run that failed is marked as such), S5.6 (how often an agent run failed), R1 rule 3 (`agent run failed`), R7 (agents online)
- Problem: The design assumes an Agent call that fails is delivered to `PostToolUse` with an error flag. In Claude Code 2.1.278 it is not. A capture of `Agent` with a `subagent_type` that does not exist fired exactly `UserPromptSubmit`, `PreToolUse`, **`PostToolUseFailure`**, `Stop`, `SessionEnd` — no `PostToolUse` and no `SubagentStop`. The payload is `{"hook_event_name":"PostToolUseFailure","tool_name":"Agent","tool_input":{…,"subagent_type":"…"},"tool_use_id":"toolu_…","error":"Agent type 'no-such-agent-xyz' not found. …","is_interrupt":false,"duration_ms":1}` (fixture `post-tool-use-failure.json`; note the top-level `error` string, and no `tool_response`). `payload.ts` already turns a top-level `error` string into the error flag (unit-tested against that fixture), but no hook is registered for the event, so the start reported by `PreToolUse` is never finished: the run stays open, counts as an agent online for `RUN_STALE_HOURS` (12 h), and is then marked `abandoned`, which R1 rule 3 deliberately does not count (assumption 3, 4). A failed run therefore cannot reach the Attention list through the hooks as designed, and S4.2 shows it as `abandoned`, not `failed`.
- Blocks: the "failed" half of S4.2, S5.6 (`agent run failed` row) and R1 rule 3 for runs that fail as Agent-tool errors. Everything else is built and tested; a run that ends with `STATUS: failed` or `STATUS: blocked-environment` is already a failed run.
- Suggestion: register a seventh hook, `PostToolUseFailure` with matcher `Agent|Task`, calling `report.sh run-finish` (timeout 15), and say so in §Changes to the factory plugin 1, ADR-0003 and the overview. Nothing else changes: the reporter's filter, the meta and the dashboard's error-flag path already handle the payload (`result = failed`, output `NULL`). The implementer adds the `hooks.json` entry and a shell test with the captured fixture. Whether a subagent that dies mid-run (rate limit, crash) reaches `PostToolUseFailure` or `SubagentStop` could not be provoked cheaply; the architect may want the design to say the dashboard accepts either.
- **Answer (architect, 2026-09-20).** The seventh hook is registered, with matcher `Agent|Task` and
  timeout 15, but it calls `report.sh **run-failed**`, not `run-finish`. Four decisions come with it,
  and each one needs a small change beyond the `hooks.json` entry:
  1. **`run-failed` sends the payload alone** — no transcript tail and no `cum_tokens` in the meta
     (design §Changes to the factory plugin 2, step 4c and steps 9/11). Reusing `run-finish` would
     have attached the *session's* transcript: its last assistant entry is the calling session's
     message, which the output fallback would have stored as the failed run's output, and its token
     counter is the session's, which would have been charged to a run that spent nothing. Tokens
     stay `NULL` and the UI shows `—` (ADR-0004, assumption 19).
  2. **The output is the `error` string, verbatim**, not `NULL` (§`POST /api/hook/run-finish`,
     §R5/R6). It is the only text that run produced and it is Claude Code's, not a sentence the
     dashboard composed; without it a failed run shows a badge and nothing else. The transcript
     steps of the output resolution are skipped whenever the body has no `tool_response` and the
     error flag is set.
  3. **The error flag also reads a top-level `error` string.** The design's error-flag row now says
     so explicitly, so `payload.ts`'s existing behaviour is the specified behaviour.
  4. **Any of the three finish deliveries ends the run, in any order** (your last question): the
     first sets `ended_at` and `result`, later ones fill only what is still `NULL`, and one narrow
     upgrade is added — a later delivery whose error flag is set replaces a `result` of `unreported`
     or `NULL` with `failed`, and changes nothing else. So a subagent that dies mid-run is a failed
     run whether it surfaces as a `SubagentStop` with a half message or as a `PostToolUseFailure`,
     and an agent that printed its own `STATUS:` keeps its own word.
  Tests: T-HOOK-4 (the failure finishes the started run and reaches R1 rule 3 and the S5.6 row),
  T-HOOK-5 (order independence and the upgrade), T-HOOK-6 (shell: payload-only body, no transcript
  read), and T-HOOK-1 now names the failure fixture. A failure for an Agent call that was never
  reported as a start (a non-factory `subagent_type`) stays dropped as `report_drop`.

## G2 – The design says two different things about the repository label in a chip
- Status: Resolved – see design §R3 ("Where it is displayed") and §User interface, Tab 1; no code
  change, the built reading is the specified one
- Design: §R3 "Where it is displayed": "`af-repo` … never wraps: it is truncated with `text-overflow: ellipsis` at 14 characters of width inside a chip." versus §User interface, Tab 1: "The chip keeps its width when the repository is shown: the title is what gets ellipsised, the id and the repository are never truncated."
- Requirement: S1.5, D16
- Problem: For a label longer than 14 characters (`very-long-repository-name`) the two sentences cannot both hold in a `Running on their own` chip.
- Blocks: nothing. The implementation follows the specific rule of §R3: `.af-repo` is `max-width: 14ch`, ellipsised, and carries `title="{project_key}"`, on every place a ticket is shown including the chip. Measured in Chrome 153 at 1440 px: a 25-character label renders 92 px wide, ellipsised, on one row; a 7-character label renders in full.
- Suggestion: keep §R3 (the full key is one hover away) and delete "and the repository" from the chip sentence, or the reverse if the stakeholder wants the chip to grow.
- **Answer (architect, 2026-09-20).** §R3 wins, as built: the cap is `max-width: 14ch` with
  `text-overflow: ellipsis` and `title="{project_key}"`, and it applies in **all five** places the
  `ticketId` partial renders, not only in a chip — one rule in one partial is what keeps D16's five
  places from drifting apart, and a long key can then never widen a card, wrap a row or push a title
  out of a chip. The chip sentence in §User interface, Tab 1 is rewritten accordingly: the id is
  never truncated, the repository is capped at 14 characters by the partial's own rule, and the
  title is what gives way beyond that. No code change; D16 and S1.5 stay as they are.
