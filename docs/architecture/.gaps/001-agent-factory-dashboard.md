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

## G3 – Over the six-month window three of the four trends never state a change or an improvement
- Status: Resolved – see design §R8 "Delta and improvement (S5.2)"
- Raised by: validator, round 1, 2026-09-21
- Design: §R8 "Delta and improvement (S5.2)" — "`first` = the earliest rendered bucket with a
  non-null value … `first` is null, or `first = 0`, or `first === last` bucket → text
  `no comparison yet`, colour `#6E7887`, no improvement word"; together with §R8 "The four series",
  where `Human calls / ticket`, `Loops / ticket` and `Compute (h)` are defined as `0` for a week
  with no activity (`0 if active(W) is empty`), never `null`; and §R8 "Buckets", where the window is
  the last 26 weeks whenever the history reaches that far back (D4).
- Requirement: S5.2 – "Given a trend is shown, when I look at it, then it also states the change
  between the first and the last week shown, and whether that change is an improvement or not."
  (Product value 2, `docs/product.md`: "Over weeks, they can see whether the factory needs them
  less, loops less and finishes faster — so they know when to go and change the factory itself.")
- Problem: the three series that are `0` rather than `null` in an empty week make `first = 0`
  whenever the earliest rendered week had no activity of that kind. With a history older than six
  months the window always starts 26 weeks back, so that week is empty far more often than not —
  and then the card falls into the `first = 0` branch and prints `no comparison yet` instead of a
  change and an improvement word, for good. Measured on a fresh stack with the acceptance dataset
  plus a ticket whose history reaches 40 weeks back (26 buckets rendered, the window full):
  `Human calls / ticket` first `w14 = 0.0`, last `w39 = 0.0`; `Loops / ticket` first `w14 = 0.0`,
  last `w39 = 0.7`; `Compute (h)` first `w14 = 0.0`, last `w39 = 1.8` — all three say
  `no comparison yet`, only `Lead time (h)` states `+30% vs w35 · worse`
  (`docs/validation/001-agent-factory-dashboard/analytics-26-weeks-no-comparison.png`). The
  implementation follows the design exactly; the rule itself loses the requirement.
- Blocks: S5.2 for `Human calls / ticket`, `Loops / ticket` and `Compute (h)` in the ordinary case,
  and with it the operator's answer to "is the factory getting better", which is what the Analytics
  tab exists for. S5.1, S5.3, S5.4, S5.5 and S5.6 are met.
- Suggestion: the requirement asks for "the change" and for a verdict, not for a percentage, so the
  percentage is what needs a fallback rather than the statement. Two directions, the architect's
  choice: (a) when `first = 0` and `last > 0`, state the absolute change instead
  (`+0.7 vs w14 · worse`, and `-0.7 vs w14 · better` in the mirror case), keeping
  `no comparison yet` only for a single rendered bucket or an all-null series; or (b) compare the
  first and the last week **that have data**, i.e. treat a week with no runs at all as `null` for
  these three series the way `Lead time (h)` already does, and name those two weeks in the delta
  text. Either way, `0 → 0` is `0% · unchanged`, not "no comparison". Whatever is chosen, the period
  line and the bars stay as they are, and the acceptance check
  `tests/acceptance/001-agent-factory-dashboard/api/05-analytics-window.test.mjs::"S5.2 over the
  full six-month window every trend still states the change and whether it is an improvement"`
  is what closes it.
- **Answer (architect, 2026-09-21).** Direction (a), as the smaller change: the *statement* always
  stands, the *percentage* is what falls back. Nothing about the series, the buckets, the bars, the
  tooltips or the period line changes, so S5.1, S5.3 and R8 stay exactly as they are and an empty
  week keeps being `0` for the three per-ticket series. Direction (b) was rejected because it would
  have redefined "the first and the last week shown" of S5.2 into "the first and last week with
  data", removed 23 zero bars from the ordinary card, and needed a requirement change.
  §R8 "Delta and improvement (S5.2)" now reads:
  1. **`first ≠ 0` → unchanged**, the relative rule with `%` exactly as before.
  2. **`first = 0` → the absolute change `a = last − first`**, printed in the card's own value
     format and its own unit, without a `%` sign: `+0.7 vs w14 · worse`, `+1.8 vs w14 · worse`,
     and `{fmt(a)} vs {firstLabel} · better` for a fall. All four series are better when lower, so
     the verdict rule is the same on both bases.
  3. **`0 → 0` is `0% vs {firstLabel} · unchanged`**, the same wording as the relative `d = 0`
     case: a zero change is one statement, not two.
  4. **`no comparison yet` survives only for "there is no change to state"**: fewer than two
     rendered buckets carry a value, i.e. a dashboard in its first week or a `Lead time (h)` card
     with at most one validated week in the window. It can no longer be reached by the three
     per-ticket series once two buckets are rendered.
  `deltaOf` takes the card's digit count in addition to the values and the labels; `−0` prints as
  `0` on both bases. Tests: T-UNIT-TRD-5 (the `first = 0` bases and the two remaining
  `no comparison yet` cases) and T-INT-N7 (26 rendered buckets with an empty first week: all four
  cards state a change and an improvement word, none reads `no comparison yet`), plus the
  validator's `05-analytics-window.test.mjs` check, which closes the finding. No ADR is affected:
  none of the nine covers the trend arithmetic. No requirement conflict.
