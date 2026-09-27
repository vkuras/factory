#!/bin/sh
# The factory side of S6, checked through the only interface it has: the reporter the plugin ships,
# called the way Claude Code calls it (a hook payload on stdin) and the way a driver calls it (CLI).
#   R9  an unreachable or unconfigured dashboard never breaks a run, and the reporter stays silent
#   R10 where to report is configuration, and the repository is derived, never typed
#   R13 every run and every intervention reaches the dashboard whatever drives the pipeline
#   D18 a run the operator starts by hand in a chat reaches the dashboard not at all
#
# Usage: BASE=http://127.0.0.1:8792 sh reporter/report-sh.test.sh
set -u

BASE=${BASE:-http://127.0.0.1:8787}
SUITE=$(cd "$(dirname "$0")/.." && pwd)
ROOT=$(cd "$SUITE/../../.." && pwd)
REPORT="$ROOT/plugins/factory/hooks/report.sh"
PROJECT_A=${PROJECT_A:-github.com/vkuras/invoice-service}

WORK=$(mktemp -d)
export HOME="$WORK/home"
export FACTORY_STATE_DIR="$WORK/state"
export FACTORY_REPORT_LOG="$WORK/report.log"
mkdir -p "$HOME" "$FACTORY_STATE_DIR"

# Ticket numbers of this run only, so the checks hold when the same stack is used twice.
N=$(( ($$ % 8000) + 1000 ))
T_CLI=$N
T_DRIVEN=$((N + 1))
T_SUBAGENT=$((N + 2))
T_HAND=$((N + 3))
T_DERIVED=$((N + 4))
T_UNREACHABLE=$((N + 5))
SESSION=$$

REPO="$WORK/repo"
mkdir -p "$REPO/docs/requirements"
printf '# %s - Reporter check\n\n- Status: Designed - ready for implementation\n' "$T_CLI" > "$REPO/docs/requirements/$T_CLI-reporter-check.md"
printf '# %s - Driven session\n\n- Status: Groomed - ready for architecture\n' "$T_DRIVEN" > "$REPO/docs/requirements/$T_DRIVEN-driven-session.md"
printf '# %s - Subagent run\n\n- Status: Designed - ready for implementation\n' "$T_SUBAGENT" > "$REPO/docs/requirements/$T_SUBAGENT-subagent-run.md"
(cd "$REPO" && git init -q . && git remote add origin https://github.com/acme/derived-key-check.git) >/dev/null 2>&1

fail=0
pass() { printf 'ok   %s\n' "$1"; }
bad() { printf 'FAIL %s\n' "$1"; fail=1; }
check() { if [ "$1" = 0 ]; then pass "$2"; else bad "$2"; fi }

page() { curl -s "$BASE$1"; }
# the rendered text, so a check reads what the operator reads and not the markup around it
page_text() { curl -s "$BASE$1" | sed -e 's/<[^>]*>/ /g' | tr -s ' \t\n' ' '; }
ticket_url() { printf '/ticket/%s/%s' "$(printf '%s' "$1" | sed 's|/|%2F|g')" "$2"; }

run_hook() { # event payload [extra env is already exported]
  _ev=$1; _payload=$2
  printf '%s' "$_payload" | sh "$REPORT" "$_ev" > "$WORK/out" 2> "$WORK/err"
  _code=$?
  return $_code
}

# ---------------------------------------------------------------- R9: nothing configured
unset FACTORY_DASHBOARD_URL
export FACTORY_PROJECT_KEY="$PROJECT_A"
run_hook prompt '{"session_id":"s0-'"$SESSION"'","cwd":"'"$REPO"'","prompt":"hello"}'
code=$?
[ "$code" = 0 ] && [ ! -s "$WORK/out" ] && [ ! -s "$WORK/err" ]
check $? 'R9 with no dashboard configured the reporter exits 0 and says nothing'

# ---------------------------------------------------------------- R9: dashboard unreachable
export FACTORY_DASHBOARD_URL=http://127.0.0.1:9    # discard port, nothing listens
start=$(date +%s)
sh "$REPORT" run-start --agent groom --ticket "$T_UNREACHABLE" --repo "$REPO" > "$WORK/out" 2> "$WORK/err"
code=$?
spent=$(( $(date +%s) - start ))
[ "$code" = 0 ] && [ ! -s "$WORK/out" ] && [ ! -s "$WORK/err" ] && [ "$spent" -le 6 ]
check $? "R9 an unreachable dashboard costs the run nothing: exit 0, silent, ${spent}s"

# ---------------------------------------------------------------- R10 / R13: a driver on the CLI
export FACTORY_DASHBOARD_URL="$BASE"
printf 'STATUS: designed\nSUMMARY: A driver that is not the coordinator reported this.\n' > "$WORK/output.txt"
sh "$REPORT" run-start --agent architect --ticket "$T_CLI" --repo "$REPO" --session-id "cli-1-$SESSION" > "$WORK/out" 2>&1
code_a=$?
sh "$REPORT" run-finish --ticket "$T_CLI" --repo "$REPO" --session-id "cli-1-$SESSION" --result designed --output-file "$WORK/output.txt" >> "$WORK/out" 2>&1
code_b=$?
body=$(page_text "$(ticket_url "$PROJECT_A" "$T_CLI")")
[ "$code_a" = 0 ] && [ "$code_b" = 0 ] && [ ! -s "$WORK/out" ] &&
  printf '%s' "$body" | grep -q 'A driver that is not the coordinator reported this' &&
  printf '%s' "$body" | grep -q 'Architect'
check $? 'R13 a driver outside Claude Code reports a whole run through the CLI'

sh "$REPORT" intervention --ticket "$T_CLI" --repo "$REPO" --what 'ja, so passt das' >/dev/null 2>&1
page_text "$(ticket_url "$PROJECT_A" "$T_CLI")" | grep -q 'ja, so passt das'
check $? 'R4 / S6.5 the same driver reports my intervention, with what I did'

# ---------------------------------------------------------------- D18: a hand-started chat run
unset FACTORY_DRIVER
run_hook prompt '{"session_id":"chat-1-'"$SESSION"'","cwd":"'"$REPO"'","prompt":"/factory:architect please design docs/requirements/'"$T_HAND"'-hand-started.md"}'
code=$?
status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$(ticket_url "$PROJECT_A" 780)")
[ "$code" = 0 ] && [ "$status" = 404 ]
check $? 'D18 / S6.9 an agent the operator starts by hand in a chat reaches the dashboard not at all'

# ---------------------------------------------------------------- R13 case B: a driven session
export FACTORY_DRIVER=acceptance-shell-script
run_hook prompt '{"session_id":"drv-1-'"$SESSION"'","cwd":"'"$REPO"'","prompt":"Factory-Run: architect '"$T_DRIVEN"'\nPlease design it."}'
code=$?
body=$(page_text "$(ticket_url "$PROJECT_A" "$T_DRIVEN")")
[ "$code" = 0 ] && printf '%s' "$body" | grep -q 'runs 1' && page "$(ticket_url "$PROJECT_A" "$T_DRIVEN")" | grep -q 'title="Architect · running'
check $? 'R13 a shell script that drives one stage per session gets its run reported'

run_hook prompt '{"session_id":"drv-1-'"$SESSION"'","cwd":"'"$REPO"'","prompt":"carry on"}'
page_text "$(ticket_url "$PROJECT_A" "$T_DRIVEN")" | grep -q 'runs 1'
check $? 'a follow-up turn inside a driven run is not a second run'
unset FACTORY_DRIVER

# ---------------------------------------------------------------- R13 case A: a subagent, then me
run_hook run-start '{"session_id":"sub-1-'"$SESSION"'","cwd":"'"$REPO"'","transcript_path":"'"$WORK/t.jsonl"'","tool_name":"Agent","tool_use_id":"toolu_acc_'"$SESSION"'","tool_input":{"subagent_type":"factory:implementer","prompt":"Product repo: '"$REPO"'\nRequirements: '"$T_SUBAGENT"' (docs/requirements/'"$T_SUBAGENT"'-subagent-run.md)"}}'
code=$?
body=$(page "$(ticket_url "$PROJECT_A" "$T_SUBAGENT")")
[ "$code" = 0 ] && printf '%s' "$body" | grep -q 'title="Implementer · running' && page_text "$(ticket_url "$PROJECT_A" "$T_SUBAGENT")" | grep -q 'runs 1'
check $? 'S6.1 a subagent stage is reported as in progress, with its agent and its ticket'

run_hook prompt '{"session_id":"sub-1-'"$SESSION"'","cwd":"'"$REPO"'","prompt":"warte, erst die Migration"}'
page_text "$(ticket_url "$PROJECT_A" "$T_SUBAGENT")" | grep -q 'warte, erst die Migration'
check $? 'R4 / D19 every message I type in a running session is an intervention on that ticket'

# ---------------------------------------------------------------- R10: the repository is derived
unset FACTORY_PROJECT_KEY
sh "$REPORT" run-start --agent groom --ticket "$T_DERIVED" --repo "$REPO" --session-id "cli-2-$SESSION" >/dev/null 2>&1
status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$(ticket_url github.com/acme/derived-key-check "$T_DERIVED")")
[ "$status" = 200 ]
check $? 'R10 / S6.8 the repository a run comes from is derived from the repository itself'
export FACTORY_PROJECT_KEY="$PROJECT_A"

# ---------------------------------------------------------------- R13: nothing of this is the coordinator's
grep -rl 'report\.sh\|FACTORY_DASHBOARD_URL' "$ROOT/plugins/factory/skills" "$ROOT/plugins/factory/agents" 2>/dev/null | grep -v '/hooks/' > "$WORK/leaks"
[ ! -s "$WORK/leaks" ]
check $? 'R13 no skill and no agent carries a line of the report path (it lives in the plugin hooks)'

# ---------------------------------------------------------------- R5: the reporter stays out of the way
grep -q 'exec 2>/dev/null' "$REPORT" && ! grep -qE '^[^#]*printf.*>&1' "$REPORT"
check $? 'R5 the reporter writes nothing to stdout, so nothing it does can change what Claude Code shows'

rm -rf "$WORK"
[ "$fail" = 0 ] || { printf '\nreporter checks failed\n'; exit 1; }
printf '\nall reporter checks passed\n'
