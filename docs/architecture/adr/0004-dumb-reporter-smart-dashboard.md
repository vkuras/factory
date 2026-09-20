# 0004 – The reporter ships raw payloads; the dashboard parses them, and tokens are a cumulative delta

- Status: Accepted (extended 2026-09-20 to main-session runs, see ADR-0008)
- Date: 2026-09-20
- Requirements: 001 S6.2, S6.3, R6, R9, R13, QE6, LTA2

## Context

The hook script runs on the operator's machine, inside a run that must not break (R9). What it has
to deliver is a JSON hook payload containing the agent's final message — arbitrary text with
quotes, newlines and Unicode — plus the token usage of the run.

Parsing that JSON in POSIX shell means `sed` against escaped strings, or a dependency on `jq`,
`python3` or `node` being installed on the operator's machine. Every one of those is a way for the
report to be wrong or for the script to fail.

Token usage is the hardest part: the Agent tool's response carries usage numbers in a shape that
differs between Claude Code versions, and a backgrounded agent's finish arrives through
`SubagentStop`, where the only handle is the transcript file. In some layouts that transcript is
the subagent's own file; in others the subagent's entries are sidechain lines inside the parent
session file, so the counters accumulate across every run of the session.

## Options

### A – Parse in the shell script and POST a clean JSON document
Needs `jq` or an interpreter, and any escaping bug corrupts the very text R6 says must be verbatim.

### B – POST the payload unchanged; the dashboard parses it in TypeScript
The script only reads stdin and pipes it into `curl --data-binary @-`. Small metadata it *can*
determine cheaply (ticket number, repo, title, requirements status, timestamps, a token total) goes
into one base64-encoded header, which is ASCII by construction and needs no escaping. All fragile
parsing happens in one place, in a typed language, against committed fixtures, with unit tests.

### C – Have the agents state their own token use in their final message
The model does not know its own usage reliably, and it would be a rewrite of the output (R6).

## Decision

Option B.

- The script sends the raw hook payload as the request body and a base64 `X-Factory-Meta` header
  with: event, project key, ticket number, ticket title, requirements status, epoch-ms timestamp,
  agent (when the payload names one), session id and the cumulative token counter.
- The dashboard extracts the output text, the result, the usage numbers and the error flag from the
  body, with a documented resolution order and a documented "unknown" outcome for each field.
- **Tokens are a cumulative delta.** The script sums every `input_tokens`,
  `output_tokens`, `cache_creation_input_tokens` and `cache_read_input_tokens` occurrence in the
  transcript file (restricted to `"isSidechain":true` lines when any exist) with `grep -o` and
  `awk`. The dashboard stores the last value seen per `(session_id, transcript_path)` and charges
  the run the difference, clamped at ≥ 0. This is correct whether the transcript is per-subagent
  (previous value 0) or shared (counters accumulate).

For a stage that runs as the session's main agent (ADR-0008) the same rule applies with the
sidechain filter inverted: the counters of non-sidechain lines are the run's own, and its
subagents' lines are excluded. The output text comes from the last non-sidechain assistant entry
for the same reason.

A run's tokens are the sum of all four counters, i.e. total tokens processed including cache reads.
When no source yields a number, tokens are stored as `NULL` and the UI shows `—`; such runs are
excluded from token sums rather than counted as zero.

## Consequences

- The reporter needs only `sh`, `curl`, `grep`, `awk`, `sed`, `date` and `base64`. No `jq`, no
  interpreter, no dependency the operator has to install.
- Hook payload shapes can change without touching the machines the factory runs on: only the
  dashboard's parser changes.
- Two agent runs overlapping inside one session would misattribute the token delta to whichever
  finishes first. The coordinator runs stages one at a time, so this does not occur in the
  pipeline; it is recorded as an assumption.
- The transcript's last 256 KB travel over the network per finished run (a few hundred ms on a
  LAN). The body limit is 2 MB; anything larger is rejected with 413 and the run keeps its start
  row, which the sweeper closes later.
- Parser behaviour is pinned by fixtures captured from real runs in build slice 1, not by a guess
  at field names.
