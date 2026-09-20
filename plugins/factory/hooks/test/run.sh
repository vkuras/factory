#!/bin/sh
# Shell tests of report.sh (T-R9-1..3, T-CFG-1, T-DRV-2 and the reporter half of T-HOOK-1, T-DRV-1, T-DRV-3, T-DRV-4).
#
#   sh plugins/factory/hooks/test/run.sh           everything but the slow timeout test
#   sh plugins/factory/hooks/test/run.sh --slow    also T-R9-2 (a server that never answers, ~6 s)
#
# Needs sh, curl, git and node (for the stand-in dashboard and the JSON checks). Every test runs in its
# own HOME under a temporary directory; nothing outside it is read or written.

HERE=$(cd "$(dirname "$0")" && pwd)
REPORT="$HERE/../report.sh"
FIX="$HERE/../../../../dashboard/test/fixtures/hooks"
SLOW=0
[ "${1:-}" = "--slow" ] && SLOW=1

WORK=$(mktemp -d "${TMPDIR:-/tmp}/report-tests.XXXXXX")
FAKE_PID=""
PASSED=0
FAILED=0
CASE_NO=0
ENV_NO=0

cleanup() {
  [ -n "$FAKE_PID" ] && kill "$FAKE_PID" 2>/dev/null
  rm -rf "$WORK"
}
trap cleanup EXIT

pass() { PASSED=$((PASSED + 1)); printf 'ok   %s\n' "$1"; }
fail() { FAILED=$((FAILED + 1)); printf 'FAIL %s\n     %s\n' "$1" "$2"; }

# check <description> <expected> <actual>
check() {
  if [ "$2" = "$3" ]; then pass "$1"; else fail "$1" "expected [$2] got [$3]"; fi
}

# ---------------------------------------------------------------- fake dashboard
start_fake() {
  stop_fake
  CASE_NO=$((CASE_NO + 1))
  REQS="$WORK/requests-$CASE_NO.jsonl"
  PORT_FILE="$WORK/port-$CASE_NO"
  : >"$REQS"
  ( FAKE_STATUS=${1:-204} FAKE_HANG=${2:-0} node "$HERE/fake-dashboard.mjs" "$PORT_FILE" "$REQS" >/dev/null 2>&1 & )
  i=0
  while [ ! -s "$PORT_FILE" ] && [ $i -lt 200 ]; do sleep 0.05; i=$((i + 1)); done
  FAKE_PID=$(cat "$PORT_FILE.pid")
  PORT=$(cat "$PORT_FILE")
  URL="http://127.0.0.1:$PORT"
}

stop_fake() {
  [ -n "$FAKE_PID" ] && kill "$FAKE_PID" 2>/dev/null
  FAKE_PID=""
}

nreq() { grep -c . "$REQS" | tr -d ' '; }

# jget <request-index> <dot.path>  -> the value, empty when absent
jget() {
  node -e '
    const lines = require("fs").readFileSync(process.argv[1], "utf8").split("\n").filter(Boolean);
    let v = JSON.parse(lines[Number(process.argv[2])] ?? "null");
    for (const k of process.argv[3].split(".")) v = v == null ? undefined : v[k];
    process.stdout.write(v === undefined || v === null ? "" : String(v));
  ' "$REQS" "$1" "$2"
}

# ---------------------------------------------------------------- environment of one test
# new_env: fresh HOME, no FACTORY_* variables, the fake dashboard as the target.
new_env() {
  ENV_NO=$((ENV_NO + 1))
  H="$WORK/home-$ENV_NO"
  mkdir -p "$H/.factory"
  unset FACTORY_DRIVER FACTORY_AGENT FACTORY_TICKET FACTORY_PROJECT_KEY FACTORY_INGEST_TOKEN FACTORY_REPORT_LOG FACTORY_TRANSCRIPT_TAIL_BYTES FACTORY_STATE_DIR
  export HOME="$H"
  export FACTORY_DASHBOARD_URL="$URL"
  STATE="$H/.factory/sessions"
}

# A repository with a requirements document and an origin remote.
make_repo() { # make_repo <dir> <origin-url> [<status>]
  mkdir -p "$1/docs/requirements"
  git -C "$1" init -q 2>/dev/null
  [ -n "$2" ] && git -C "$1" remote add origin "$2" 2>/dev/null
  {
    printf '# 001 – Agent "Factory" Dashboard\n\n- Type: MVP\n- Status: %s\n' "${3:-Groomed – ready for architecture}"
  } >"$1/docs/requirements/001-agent-factory-dashboard.md"
}

REPO="$WORK/repo"
make_repo "$REPO" "https://github.com/vkuras/factory.git"

# fixture <name> [agent-type]: a copy of a captured payload pointed at this machine's paths.
fixture() {
  out="$WORK/payload-$1"
  sed -e "s|\"cwd\":\"[^\"]*\"|\"cwd\":\"$REPO\"|" \
      -e "s|\"agent_transcript_path\":\"[^\"]*subagent-stop-foreground[^\"]*\"|\"agent_transcript_path\":\"$FIX/subagent-foreground.transcript.jsonl\"|" \
      -e "s|\"agent_transcript_path\":\"[^\"]*subagent-stop-background[^\"]*\"|\"agent_transcript_path\":\"$FIX/subagent-background.transcript.jsonl\"|" \
      -e "s|\"agent_transcript_path\":\"[^\"]*agent-a34075d0b8a91898f.jsonl\"|\"agent_transcript_path\":\"$FIX/subagent-foreground.transcript.jsonl\"|" \
      -e "s|\"agent_transcript_path\":\"[^\"]*agent-a6f76355b46027ac5.jsonl\"|\"agent_transcript_path\":\"$FIX/subagent-background.transcript.jsonl\"|" \
      -e "s|\"transcript_path\":\"[^\"]*0fff8401[^\"]*\"|\"transcript_path\":\"$FIX/main-session.transcript.jsonl\"|" \
      -e "s|\"subagent_type\":\"general-purpose\"|\"subagent_type\":\"${2:-factory:architect}\"|" \
      -e "s|\"agent_type\":\"general-purpose\"|\"agent_type\":\"${2:-factory:architect}\"|" \
      "$FIX/$1" >"$out"
  printf '%s' "$out"
}

# nomarker: the driver fixture with its prompt replaced by ordinary chat.
nomarker() {
  sed 's|"prompt":"[^"]*|"prompt":"hello there, how are you|' "$FIX/user-prompt-submit-driver.json" >"$WORK/nomarker.json"
  printf '%s' "$WORK/nomarker.json"
}

run() { # run <event> [args...] < payload  (stdout and stderr must stay empty)
  out=$(sh "$REPORT" "$@" 2>&1)
  rc=$?
  [ -z "$out" ] || printf 'UNEXPECTED OUTPUT: %s\n' "$out"
  return $rc
}

# ================================================================= T-R9-1: exits 0 on every path
printf '\n== T-R9-1: always exit 0, never write a byte\n'
start_fake
new_env

exit_and_output() { # description, then the command via eval
  desc=$1; shift
  out=$("$@" 2>&1); rc=$?
  if [ "$rc" = 0 ] && [ -z "$out" ]; then pass "$desc"; else fail "$desc" "exit=$rc output=[$out]"; fi
}

exit_and_output "no configuration at all" env -u FACTORY_DASHBOARD_URL HOME="$H" sh "$REPORT" run-start </dev/null
exit_and_output "an unknown event" sh "$REPORT" bogus </dev/null
exit_and_output "no arguments at all" sh "$REPORT" </dev/null
exit_and_output "an empty stdin" sh "$REPORT" run-start </dev/null
exit_and_output "a malformed payload" sh -c "printf 'not json {{{' | sh '$REPORT' run-finish"
exit_and_output "a closed port" env FACTORY_DASHBOARD_URL=http://127.0.0.1:1 sh -c "sh '$REPORT' run-start < '$(fixture pre-tool-use.json)'"
exit_and_output "an unresolvable host" env FACTORY_DASHBOARD_URL=http://no-such-host.invalid sh -c "sh '$REPORT' run-start < '$(fixture pre-tool-use.json)'"
exit_and_output "a missing transcript" sh -c "sed 's|\"agent_transcript_path\":\"[^\"]*\"|\"agent_transcript_path\":\"/no/such/file\"|' '$(fixture subagent-stop-foreground.json)' | sh '$REPORT' run-finish"
exit_and_output "a missing curl" env PATH=/nonexistent /bin/sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO"
exit_and_output "a flag without a value" sh "$REPORT" run-start --agent
exit_and_output "an unwritable log and state directory" env FACTORY_REPORT_LOG=/proc/no/such/log FACTORY_STATE_DIR=/proc/no/such/dir sh -c "sh '$REPORT' run-start < '$(fixture pre-tool-use.json)'"

printf 'this is ( not valid sh\n' >"$H/.factory/dashboard.env"
exit_and_output "a broken ~/.factory/dashboard.env" sh -c "sh '$REPORT' run-start < '$(fixture pre-tool-use.json)'"
rm -f "$H/.factory/dashboard.env"

stop_fake
start_fake 401
new_env
exit_and_output "a 401 answer" sh -c "sh '$REPORT' run-start < '$(fixture pre-tool-use.json)'"
check "the 401 is written to the reporter's log" "1" "$(grep -c 'answered 401' "$H/.factory/report.log")"

# the log keeps its last 200 lines
i=0
while [ $i -lt 230 ]; do sh "$REPORT" run-start <"$(fixture pre-tool-use.json)"; i=$((i + 1)); done
check "the log is trimmed to its last 200 lines" "200" "$(wc -l <"$H/.factory/report.log" | tr -d ' ')"

# ================================================================= T-R9-3: no configuration and no session means no cost
printf '\n== T-R9-3: silent and fast when it is not a factory session\n'
start_fake
new_env
t=$(env -u FACTORY_DASHBOARD_URL node "$HERE/time-run.mjs" 5 "$(fixture pre-tool-use.json)" sh "$REPORT" run-start)
if [ "$t" -lt 50 ] 2>/dev/null; then pass "URL unset: run-start returns in ${t} ms (< 50 ms) and touches no network"; else fail "URL unset: run-start under 50 ms" "slowest run: $t"; fi
check "URL unset: no request was made" "0" "$(nreq)"

for ev in prompt session-finish session-end; do
  case $ev in
    prompt) p=$(nomarker) ;;
    session-finish) p=$(fixture stop-main.json) ;;
    session-end) p=$(fixture session-end.json) ;;
  esac
  t=$(node "$HERE/time-run.mjs" 5 "$p" sh "$REPORT" "$ev")
  if [ "$t" -lt 50 ] 2>/dev/null; then pass "$ev with the URL set, no driver marker and no state file returns in ${t} ms (< 50 ms)"; else fail "$ev under 50 ms" "slowest run: $t"; fi
done
check "and none of them made a network call" "0" "$(nreq)"

# ================================================================= T-CFG-1: configuration and the project key
printf '\n== T-CFG-1: configuration resolution and the project key\n'
start_fake
new_env
unset FACTORY_DASHBOARD_URL
printf 'FACTORY_DASHBOARD_URL=%s\n' "$URL" >"$H/.factory/dashboard.env"
sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO"
check "file only: the report reaches the dashboard from the file's URL" "1" "$(nreq)"

start_fake
new_env
sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO"
check "environment only: the report reaches the dashboard" "1" "$(nreq)"

start_fake
OTHER_URL=$URL
new_env
printf 'FACTORY_DASHBOARD_URL=http://127.0.0.1:1\nFACTORY_INGEST_TOKEN=from-file\n' >"$H/.factory/dashboard.env"
export FACTORY_DASHBOARD_URL="$OTHER_URL"
sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO"
check "environment overriding the file: the environment's URL is used" "1" "$(nreq)"
check "...and a value only the file has is still used (token)" "Bearer from-file" "$(jget 0 authorization)"

start_fake
new_env
export FACTORY_INGEST_TOKEN=sesame
sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO"
check "the ingest token is sent as a bearer token" "Bearer sesame" "$(jget 0 authorization)"
start_fake
new_env
sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO"
check "no token, no Authorization header" "" "$(jget 0 authorization)"
export FACTORY_DASHBOARD_URL="$URL/"
sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO"
check "a trailing slash on the URL is harmless" "/api/hook/run-start" "$(jget 1 path)"

for spec in \
  "https://github.com/vkuras/factory.git|github.com/vkuras/factory" \
  "git@github.com:vkuras/factory.git|github.com/vkuras/factory" \
  "ssh://git@github.com/vkuras/factory.git|github.com/vkuras/factory" \
  "ssh://git@git.example.org:2222/team/shop.git|git.example.org/team/shop" \
  "https://user:secret@gitlab.com/group/sub/proj|gitlab.com/group/sub/proj" \
  "https://github.com/vkuras/factory/|github.com/vkuras/factory"; do
  url=${spec%%|*}; want=${spec#*|}
  R="$WORK/repo-$(printf '%s' "$want" | tr '/.' '__')"
  make_repo "$R" "$url"
  start_fake
  new_env
  sh "$REPORT" run-start --agent groom --ticket 001 --repo "$R"
  check "project key from origin $url" "$want" "$(jget 0 meta.project)"
done

R="$WORK/plain-directory"
make_repo "$R" ""
start_fake
new_env
sh "$REPORT" run-start --agent groom --ticket 001 --repo "$R"
check "project key without a remote is the directory name" "plain-directory" "$(jget 0 meta.project)"
export FACTORY_PROJECT_KEY="my/own/key"
sh "$REPORT" run-start --agent groom --ticket 001 --repo "$REPO"
check "FACTORY_PROJECT_KEY overrides the derived key" "my/own/key" "$(jget 1 meta.project)"
unset FACTORY_PROJECT_KEY

start_fake
new_env
sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO"
check "title from the requirements heading, quotes escaped" 'Agent "Factory" Dashboard' "$(jget 0 meta.title)"
check "requirements status, verbatim with its en dash" "Groomed – ready for architecture" "$(jget 0 meta.req_status)"
check "slug from the file name" "agent-factory-dashboard" "$(jget 0 meta.slug)"
check "the repository path" "$REPO" "$(jget 0 meta.repo_path)"
check "a missing requirements document leaves title and status out" "" "$(sh "$REPORT" run-start --agent groom --ticket 777 --repo "$REPO"; jget 1 meta.title)$(jget 1 meta.req_status)"

# ================================================================= reporter half of T-HOOK-1: subagent hooks
printf '\n== subagent hooks (case A)\n'
start_fake
new_env
run run-start <"$(fixture pre-tool-use.json)"
check "PreToolUse of a factory agent: one start" "1" "$(nreq)"
check "  path" "/api/hook/run-start" "$(jget 0 path)"
check "  event" "run-start" "$(jget 0 meta.event)"
check "  agent from subagent_type" "architect" "$(jget 0 meta.agent)"
check "  ticket from the prompt's requirements path" "001" "$(jget 0 meta.ticket)"
check "  source and origin" "subagent-hook/subagent" "$(jget 0 meta.source)/$(jget 0 meta.origin)"
check "  tool_use_id" "toolu_01EzcEjqFV7PCpGZeAm26zGS" "$(jget 0 meta.tool_use_id)"
check "  session id" "86ee1fee-3239-4d92-a6c4-41ec734c4348" "$(jget 0 meta.session_id)"
check "  the body is the raw hook payload, unchanged" "$(cat "$(fixture pre-tool-use.json)")" "$(jget 0 body)"
check "  the state file marks the session as observed" "MODE=observe" "$(sed -n 1p "$STATE/86ee1fee-3239-4d92-a6c4-41ec734c4348.state")"
check "  ...with the ticket" "TICKET=001" "$(sed -n 3p "$STATE/86ee1fee-3239-4d92-a6c4-41ec734c4348.state")"
check "  Content-Type" "text/plain; charset=utf-8" "$(jget 0 contentType)"

start_fake
new_env
run run-start <"$(fixture pre-tool-use.json general-purpose)"
run run-start <"$(fixture pre-tool-use.json Explore)"
check "PreToolUse of a helper subagent (general-purpose, Explore) reports nothing" "0" "$(nreq)"
check "  and leaves no state file" "0" "$(find "$STATE" -name '*.state' 2>/dev/null | wc -l | tr -d ' ')"

start_fake
new_env
run run-finish <"$(fixture post-tool-use-foreground.json)"
check "PostToolUse (foreground): one finish, ticket from the prompt" "1/001" "$(nreq)/$(jget 0 meta.ticket)"
check "  no transcript is sent for a PostToolUse (its payload carries the usage)" "no" "$(jget 0 body | grep -q -- '---8<---' && echo yes || echo no)"
check "  no token counter (the payload has its own usage)" "" "$(jget 0 meta.cum_tokens)"
check "  tool_use_id for matching" "toolu_01EzcEjqFV7PCpGZeAm26zGS" "$(jget 0 meta.tool_use_id)"

start_fake
new_env
mkdir -p "$STATE"
printf 'MODE=observe\nAGENT=architect\nTICKET=001\nREPO=%s\nPROJECT=x\nSTARTED=1\n' "$REPO" >"$STATE/86ee1fee-3239-4d92-a6c4-41ec734c4348.state"
run run-finish <"$(fixture subagent-stop-foreground.json)"
check "SubagentStop: one finish; the ticket comes from the subagent's own transcript" "1/001" "$(nreq)/$(jget 0 meta.ticket)"
check "  the tokens are counted once per API response (55345), not per transcript line" "55345" "$(jget 0 meta.cum_tokens)"
check "  the transcript of the subagent, not the session, is named" "$FIX/subagent-foreground.transcript.jsonl" "$(jget 0 meta.transcript_path)"
check "  body: the payload, then the separator, then the transcript tail" "yes" "$(jget 0 body | grep -q '^---8<---$' && echo yes || echo no)"
check "  the tail carries the agent's last message" "yes" "$(jget 0 body | grep -q 'capture test fg' && echo yes || echo no)"
check "  no tool_use_id (SubagentStop has none)" "" "$(jget 0 meta.tool_use_id)"

start_fake
new_env
run run-finish <"$(fixture subagent-stop-background.json general-purpose)"
run run-finish <"$(fixture post-tool-use-foreground.json Explore)"
check "finish hooks of helper subagents report nothing" "0" "$(nreq)"

start_fake
new_env
FACTORY_TRANSCRIPT_TAIL_BYTES=2000 run run-finish <"$(fixture subagent-stop-foreground.json)"
check "FACTORY_TRANSCRIPT_TAIL_BYTES bounds the tail" "yes" "$([ "$(jget 0 body | wc -c | tr -d ' ')" -lt 4200 ] && echo yes || echo no)"

# ================================================================= T-DRV-2: the decision table of the prompt hook
printf '\n== T-DRV-2: the prompt hook decision table (D18, S6.9)\n'
SESSION_ID=0fff8401-d80d-4b90-ad84-caacceaeb87b

check "  and no state file is created" "no" "$([ -e "$STATE/$SESSION_ID.state" ] && echo yes || echo no)"

start_fake
new_env
FACTORY_DRIVER=capture run prompt <"$(fixture user-prompt-submit-driver.json)"
check "FACTORY_DRIVER set and a Factory-Run marker: one run-start" "1" "$(nreq)"
check "  agent and ticket from the marker" "architect/001" "$(jget 0 meta.agent)/$(jget 0 meta.ticket)"
check "  source session-hook, origin main, driver named" "session-hook/main/capture" "$(jget 0 meta.source)/$(jget 0 meta.origin)/$(jget 0 meta.driver)"
check "  the state file says MODE=run" "MODE=run" "$(sed -n 1p "$STATE/$SESSION_ID.state")"

start_fake
check "the marker alone (without FACTORY_DRIVER) also starts a driven run" "0" "$(nreq)"
# (the fixture's prompt carries 'Factory-Run: architect 001'; the previous line ran with no environment marker
#  and no session state, which is exactly the ordinary-chat case only when the prompt has no marker.)

# A prompt that contains the marker: the marker is the driver's declaration.
MARKED="$WORK/marked.json"
sed 's|"prompt":"[^"]*|"prompt":"Factory-Run: validator 002\\nplease go|' "$(fixture user-prompt-submit-driver.json)" >"$MARKED"
start_fake
new_env
run prompt <"$MARKED"
check "a Factory-Run line in the prompt starts a run without the environment variable" "1" "$(nreq)"
check "  for the agent and ticket the line names" "validator/002" "$(jget 0 meta.agent)/$(jget 0 meta.ticket)"

start_fake
new_env
mkdir -p "$STATE"
printf 'MODE=observe\nAGENT=architect\nTICKET=001\nREPO=%s\nPROJECT=github.com/vkuras/factory\nSTARTED=1\n' "$REPO" >"$STATE/$SESSION_ID.state"
UNPROMPT="$WORK/operator-prompt.json"
printf '%s\n' '{"session_id":"0fff8401-d80d-4b90-ad84-caacceaeb87b","cwd":"/elsewhere","hook_event_name":"UserPromptSubmit","prompt":"Yes, go with B.\nKeep \"quotes\", a \\ backslash and ✓ unicode."}' >"$UNPROMPT"
run prompt <"$UNPROMPT"
check "MODE=observe: the operator's prompt is one intervention" "1" "$(nreq)"
check "  path" "/api/intervention" "$(jget 0 path)"
check "  on the session's ticket" "001" "$(jget 0 meta.ticket)"
check "  in the session's repository, not the cwd" "$REPO" "$(jget 0 meta.repo_path)"
check "  with the prompt text verbatim (newline, quotes, backslash, unicode)" 'Yes, go with B.
Keep "quotes", a \ backslash and ✓ unicode.' "$(jget 0 meta.what)"
check "  source session-hook" "session-hook" "$(jget 0 meta.source)"

start_fake
new_env
mkdir -p "$STATE"
printf 'MODE=observe\nAGENT=architect\nTICKET=001\nREPO=%s\nPROJECT=p\nSTARTED=1\n' "$REPO" >"$STATE/$SESSION_ID.state"
run prompt <"$(fixture user-prompt-submit-task-notification.json | sed "s|86ee1fee-3239-4d92-a6c4-41ec734c4348|$SESSION_ID|;s|2461d4cf-49eb-488f-8dfa-4d018de3cd6b|$SESSION_ID|")"
check "MODE=observe: a task notification is not the operator and is not an intervention" "0" "$(nreq)"

start_fake
new_env
mkdir -p "$STATE"
printf 'MODE=run\nAGENT=architect\nTICKET=001\nREPO=%s\nPROJECT=p\nSTARTED=1\n' "$REPO" >"$STATE/$SESSION_ID.state"
run prompt <"$UNPROMPT"
check "MODE=run: a follow-up turn inside a driven run reports nothing" "0" "$(nreq)"
FACTORY_DRIVER=capture run prompt <"$UNPROMPT"
check "  not even with FACTORY_DRIVER set (no marker, the run is already reported)" "0" "$(nreq)"

start_fake
new_env
LONG="$WORK/long-prompt.json"
node -e '
  const p = "x".repeat(9000) + "\\nend";
  process.stdout.write(JSON.stringify({session_id: "0fff8401-d80d-4b90-ad84-caacceaeb87b", hook_event_name: "UserPromptSubmit", prompt: p}) + "\n");
' >"$LONG"
mkdir -p "$STATE"
printf 'MODE=observe\nAGENT=a\nTICKET=001\nREPO=%s\nPROJECT=p\nSTARTED=1\n' "$REPO" >"$STATE/$SESSION_ID.state"
run prompt <"$LONG"
check "an intervention text is capped at 4 KiB" "4096" "$(jget 0 meta.what | wc -c | tr -d ' ')"

start_fake
new_env
FACTORY_DRIVER=capture run prompt <"$(sed 's|"prompt":"[^"]*|"prompt":"just chat with no stage and no ticket|' "$(fixture user-prompt-submit-driver.json)" >"$WORK/nothing.json"; printf '%s' "$WORK/nothing.json")"
check "a driver that names neither agent nor ticket sends nothing" "0" "$(nreq)"
check "  and says in the log that the ticket is missing" "1" "$(grep -c 'without a ticket' "$H/.factory/report.log" | tr -d ' ')"
check "  and that the agent is missing too" "1" "$(grep -c 'without an agent either' "$H/.factory/report.log" | tr -d ' ')"

start_fake
new_env
FACTORY_DRIVER=capture FACTORY_AGENT=implementer FACTORY_TICKET=002 run prompt <"$WORK/nothing.json"
check "FACTORY_AGENT and FACTORY_TICKET state the run when the prompt does not" "implementer/002" "$(jget 0 meta.agent)/$(jget 0 meta.ticket)"

start_fake
new_env
mkdir -p "$STATE"
sed 's|"prompt":"[^"]*|"prompt":"Run /factory:validator for docs/requirements/001-agent-factory-dashboard.md please|' "$(fixture user-prompt-submit-driver.json)" >"$WORK/slash.json"
FACTORY_DRIVER=capture run prompt <"$WORK/slash.json"
check "agent and ticket found in the prompt text (factory:<agent>, docs/requirements/NNN)" "validator/001" "$(jget 0 meta.agent)/$(jget 0 meta.ticket)"

# ================================================================= reporter half of T-DRV-1: Stop and SessionEnd
printf '\n== main-session finish (case B)\n'
start_fake
new_env
run session-finish <"$(fixture stop-main.json)"
run session-end <"$(fixture session-end.json)"
check "Stop and SessionEnd without a state file report nothing" "0" "$(nreq)"

start_fake
new_env
mkdir -p "$STATE"
printf 'MODE=observe\nAGENT=architect\nTICKET=001\nREPO=%s\nPROJECT=p\nSTARTED=1\n' "$REPO" >"$STATE/$SESSION_ID.state"
run session-finish <"$(fixture stop-main.json)"
check "Stop in an observed (coordinator) session does nothing" "0" "$(nreq)"
run session-end <"$(fixture session-end.json)"
check "SessionEnd in an observed session reports nothing..." "0" "$(nreq)"
check "  ...and removes the state file" "no" "$([ -e "$STATE/$SESSION_ID.state" ] && echo yes || echo no)"

start_fake
new_env
mkdir -p "$STATE"
printf 'MODE=run\nAGENT=architect\nTICKET=001\nREPO=%s\nPROJECT=p\nSTARTED=1\n' "$REPO" >"$STATE/$SESSION_ID.state"
FACTORY_DRIVER=capture run session-finish <"$(fixture stop-main.json)"
check "Stop of a driven run: one finish" "1" "$(nreq)"
check "  path, origin and source" "/api/hook/run-finish/main/session-hook" "$(jget 0 path)/$(jget 0 meta.origin)/$(jget 0 meta.source)"
check "  the ticket of the run, from the state file" "001" "$(jget 0 meta.ticket)"
check "  tokens of the session's own lines only, once per response" "93744" "$(jget 0 meta.cum_tokens)"
check "  the body carries the transcript tail" "yes" "$(jget 0 body | grep -q '^---8<---$' && echo yes || echo no)"
check "  the state file stays until SessionEnd" "yes" "$([ -e "$STATE/$SESSION_ID.state" ] && echo yes || echo no)"
run session-end <"$(fixture session-end.json)"
check "SessionEnd of a driven run: a session-end report" "session-end/2" "$(jget 1 meta.event)/$(nreq)"
check "  and the state file is gone" "no" "$([ -e "$STATE/$SESSION_ID.state" ] && echo yes || echo no)"

start_fake
new_env
mkdir -p "$STATE"
touch -t 202001010000 "$STATE/ancient.state"
run run-start <"$(fixture pre-tool-use.json)"
check "a state file older than 7 days is removed when a new one is written" "no" "$([ -e "$STATE/ancient.state" ] && echo yes || echo no)"

# ================================================================= T-DRV-3: the CLI
printf '\n== T-DRV-3: the command-line mode\n'
start_fake
new_env
unset TERM_PROGRAM
sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO" --session-id cli-1
sh "$REPORT" run-finish --ticket 001 --repo "$REPO" --session-id cli-1 --result designed
printf 'Line one\nSTATUS: designed\nSUMMARY: from a file\n' >"$WORK/out.txt"
sh "$REPORT" run-finish --ticket 001 --repo "$REPO" --agent architect --output-file "$WORK/out.txt" --result designed
sh "$REPORT" intervention --ticket 001 --repo "$REPO" --what 'answered the "open" question on R3
and moved on'
check "CLI run-start: source cli, agent, session" "/api/hook/run-start/cli/architect/cli-1" "$(jget 0 path)/$(jget 0 meta.source)/$(jget 0 meta.agent)/$(jget 0 meta.session_id)"
check "CLI run-start: no body" "" "$(jget 0 body)"
check "CLI run-finish: --result travels in the meta" "run-finish/designed" "$(jget 1 meta.event)/$(jget 1 meta.result)"
check "CLI run-finish: --output-file is the body, byte for byte" "$(cat "$WORK/out.txt")" "$(jget 2 body)"
check "CLI intervention: text with quotes and a newline arrives intact" 'answered the "open" question on R3
and moved on' "$(jget 3 meta.what)"
check "CLI intervention: path" "/api/intervention" "$(jget 3 path)"
sh "$REPORT" intervention --ticket 001 --repo "$REPO"
check "CLI intervention without --what sends nothing" "4" "$(nreq)"
sh "$REPORT" run-start --ticket 001 --repo "$REPO"
check "CLI run-start without --agent sends nothing" "4" "$(nreq)"
sh "$REPORT" run-finish --ticket 001 --repo "$REPO" --tokens 42 --result designed
check "CLI --tokens is accepted and ignored, and the ignoring is logged" "1" "$(grep -c -- '--tokens is not supported' "$H/.factory/report.log" | tr -d ' ')"
check "  the finish itself still goes out" "5" "$(nreq)"

# ================================================================= T-R9-2: the reporter's own timeouts
if [ "$SLOW" = 1 ]; then
  printf '\n== T-R9-2: bounded time against a dashboard that never answers\n'
  start_fake 204 1
  new_env
  slowest_start=0
  slowest_finish=0
  for n in 1 2 3 4 5; do
    (
      s=$(date +%s)
      sh "$REPORT" run-start --agent architect --ticket 001 --repo "$REPO"
      e=$(date +%s)
      echo "$((e - s))" >"$WORK/start-$n"
    ) &
    (
      s=$(date +%s)
      sh "$REPORT" run-finish --ticket 001 --repo "$REPO" --result designed
      e=$(date +%s)
      echo "$((e - s))" >"$WORK/finish-$n"
    ) &
  done
  wait
  for n in 1 2 3 4 5; do
    a=$(cat "$WORK/start-$n"); b=$(cat "$WORK/finish-$n")
    [ "$a" -gt "$slowest_start" ] && slowest_start=$a
    [ "$b" -gt "$slowest_finish" ] && slowest_finish=$b
  done
  if [ "$slowest_start" -le 3 ]; then pass "run-start gives up within 2 s (slowest of 5: ${slowest_start} s, whole seconds, limit 3)"; else fail "run-start timeout" "${slowest_start} s"; fi
  if [ "$slowest_finish" -le 6 ]; then pass "run-finish gives up within 5 s (slowest of 5: ${slowest_finish} s, whole seconds, limit 6)"; else fail "run-finish timeout" "${slowest_finish} s"; fi
fi

printf '\n%s passed, %s failed\n' "$PASSED" "$FAILED"
[ "$FAILED" = 0 ]
