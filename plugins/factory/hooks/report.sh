#!/bin/sh
# report.sh - the factory's reporter (docs/architecture/001-agent-factory-dashboard.md, section R13).
#
# Hook mode (arguments: the event only, the Claude Code hook payload on stdin):
#   run-start       PreToolUse(Agent|Task)   a subagent stage starts
#   run-finish      PostToolUse, SubagentStop  a subagent stage ends
#   prompt          UserPromptSubmit         a driven stage starts in a session, or the operator intervenes
#   session-finish  Stop                     a driven main-session stage ends
#   session-end     SessionEnd               closes a driven run that never finished, removes the state file
# CLI mode (flags after the event; no stdin), for a driver that does not use Claude Code hooks:
#   report.sh run-start    --agent A --ticket NNN --repo DIR [--session-id X]
#   report.sh run-finish   --ticket NNN --repo DIR [--session-id X] [--agent A] [--result R] [--output-file F]
#   report.sh intervention --ticket NNN --repo DIR --what "text"
#
# Reporting never breaks a run (R9): this script writes nothing to stdout, keeps stderr closed, and
# exits 0 on every path. It uses only sh, cat, grep, sed, awk, date, base64, tr, head, tail, mkdir,
# find, mktemp, git and curl. Configuration: environment first, then ~/.factory/dashboard.env (R10).

exec 2>/dev/null

EVENT=${1:-}
[ $# -gt 0 ] && shift
HOOK_MODE=1
[ $# -gt 0 ] && HOOK_MODE=0

TMP=""
HDR=""
# shellcheck disable=SC2329  # invoked by the EXIT trap below
cleanup() {
  [ -n "$TMP" ] && rm -f "$TMP" "$TMP.body"
  [ -n "$HDR" ] && rm -f "$HDR"
  return 0
}
trap cleanup EXIT
trap 'exit 0' INT TERM HUP

# ---------------------------------------------------------------- flags (CLI mode)
F_AGENT=""
F_TICKET=""
F_REPO=""
F_SESSION=""
F_RESULT=""
F_OUTPUT_FILE=""
F_TOKENS=""
F_WHAT=""
while [ $# -gt 0 ]; do
  case $1 in
    --agent) [ $# -ge 2 ] || break; F_AGENT=$2; shift 2 ;;
    --ticket) [ $# -ge 2 ] || break; F_TICKET=$2; shift 2 ;;
    --repo) [ $# -ge 2 ] || break; F_REPO=$2; shift 2 ;;
    --session-id) [ $# -ge 2 ] || break; F_SESSION=$2; shift 2 ;;
    --result) [ $# -ge 2 ] || break; F_RESULT=$2; shift 2 ;;
    --output-file) [ $# -ge 2 ] || break; F_OUTPUT_FILE=$2; shift 2 ;;
    --tokens) [ $# -ge 2 ] || break; F_TOKENS=$2; shift 2 ;;
    --what) [ $# -ge 2 ] || break; F_WHAT=$2; shift 2 ;;
    *) shift ;;
  esac
done

# ---------------------------------------------------------------- configuration (R10)
# The environment wins over ~/.factory/dashboard.env; a value set to the empty string counts as set.
CONFIG_VARS="FACTORY_DASHBOARD_URL FACTORY_INGEST_TOKEN FACTORY_PROJECT_KEY FACTORY_REPORT_LOG FACTORY_TRANSCRIPT_TAIL_BYTES FACTORY_DRIVER FACTORY_AGENT FACTORY_TICKET FACTORY_STATE_DIR"
for v in $CONFIG_VARS; do
  eval "if [ \"\${$v+x}\" = x ]; then KEEP_SET_$v=1; KEEP_VAL_$v=\$$v; fi"
done
CONFIG_FILE="${HOME:-}/.factory/dashboard.env"
# The file is probed in a subshell first: a broken file must never end this shell (R9).
# shellcheck disable=SC1090  # the file is per installation, so it cannot be followed statically
if [ -n "${HOME:-}" ] && [ -f "$CONFIG_FILE" ] && ( . "$CONFIG_FILE" ) >/dev/null 2>&1; then
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
fi
for v in $CONFIG_VARS; do
  eval "if [ \"\${KEEP_SET_$v-}\" = 1 ]; then $v=\$KEEP_VAL_$v; export $v; fi"
done

[ -n "${FACTORY_DASHBOARD_URL:-}" ] || exit 0

LOG=${FACTORY_REPORT_LOG:-${HOME:-}/.factory/report.log}
STATE_DIR=${FACTORY_STATE_DIR:-${HOME:-}/.factory/sessions}
TAIL_BYTES=${FACTORY_TRANSCRIPT_TAIL_BYTES:-262144}
case $TAIL_BYTES in *[!0-9]* | '') TAIL_BYTES=262144 ;; esac

case $EVENT in
  run-start | run-finish | prompt | session-finish | session-end | intervention) ;;
  *) exit 0 ;;
esac

# ---------------------------------------------------------------- helpers
now_ms() {
  _t=$(date +%s%3N)
  case $_t in
    '' | *[!0-9]*) _t=$(date +%s)000 ;;
  esac
  printf '%s' "$_t"
}

log_line() {
  [ -n "$LOG" ] || return 0
  mkdir -p "$(dirname "$LOG")" || return 0
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" >>"$LOG" || return 0
  if [ "$(wc -l <"$LOG" | tr -d ' ')" -gt 200 ]; then
    tail -n 200 "$LOG" >"$LOG.tmp.$$" && mv "$LOG.tmp.$$" "$LOG"
  fi
  return 0
}

# JSON string body (no surrounding quotes) of $1: backslash, quote, tab, CR and newline escaped.
json_escape() {
  printf '%s' "$1" | awk '
    function esc(s,   i, c, o) {
      o = ""
      for (i = 1; i <= length(s); i++) {
        c = substr(s, i, 1)
        if (c == "\\") o = o "\\\\"
        else if (c == "\"") o = o "\\\""
        else if (c == "\t") o = o "\\t"
        else if (c == "\r") o = o "\\r"
        else if (c < " ") o = o " "
        else o = o c
      }
      return o
    }
    { printf "%s%s", (NR > 1 ? "\\n" : ""), esc($0) }'
}

# First string value of a key of the hook payload (compact JSON, as Claude Code writes it).
json_first() {
  case $PAYLOAD in
    *\""$1"\":\"*)
      _rest=${PAYLOAD#*\""$1"\":\"}
      printf '%s' "${_rest%%\"*}"
      ;;
    *)
      printf '%s' "$PAYLOAD" | grep -o "\"$1\"[ ]*:[ ]*\"[^\"]*\"" | head -1 | sed 's/^"[^"]*"[ ]*:[ ]*"//; s/"$//'
      ;;
  esac
}

# The state value KEY of the session state file, empty when there is none.
state_get() {
  [ -f "$STATE_FILE" ] || return 0
  sed -n "s/^$1=//p" "$STATE_FILE" | head -1
}

# Sums the four usage counters of every API response once. One response is split over several
# transcript lines that repeat its `usage` block (the first line carries a partial output count, the
# last the final one) and `iterations` repeats it once more, so the last block per requestId counts.
sum_usage() {
  awk '
    index($0, "\"type\":\"assistant\"") == 0 { next }
    (u = index($0, "\"usage\":{")) == 0 { next }
    {
      key = "line" NR
      if (match($0, /"requestId":"[^"]*"/)) key = substr($0, RSTART, RLENGTH)
      rest = substr($0, u)
      t = 0
      n = split("input_tokens output_tokens cache_creation_input_tokens cache_read_input_tokens", names, " ")
      for (i = 1; i <= n; i++) {
        if (match(rest, "\"" names[i] "\":[0-9]+")) {
          v = substr(rest, RSTART, RLENGTH)
          sub(/^[^:]*:/, "", v)
          t += v
        }
      }
      last[key] = t
    }
    END {
      for (k in last) total += last[k]
      printf "%.0f\n", total + 0
    }'
}

# Cumulative token counter of a transcript. $2: main = the lines of the session itself (no
# sidechain), sidechain = the subagent lines (the whole file when there are none), all = every line.
count_tokens() {
  [ -n "$1" ] && [ -r "$1" ] || return 0
  case $2 in
    main) grep -v '"isSidechain":true' "$1" | sum_usage ;;
    sidechain)
      if grep -q '"isSidechain":true' "$1"; then
        grep '"isSidechain":true' "$1" | sum_usage
      else
        sum_usage <"$1"
      fi
      ;;
    *) sum_usage <"$1" ;;
  esac
}

# Project key: FACTORY_PROJECT_KEY, else origin remote reduced to host/owner/repo, else the directory name.
derive_project() {
  if [ -n "${FACTORY_PROJECT_KEY:-}" ]; then
    printf '%s' "$FACTORY_PROJECT_KEY"
    return 0
  fi
  _url=$(git -C "$1" remote get-url origin 2>/dev/null)
  if [ -n "$_url" ]; then
    _key=$(printf '%s' "$_url" | sed -E 's#\.git/?$##; s#^[A-Za-z][A-Za-z0-9+.-]*://##; s#^[^@/]*@##; s#^([^:/]+):[0-9]+/#\1/#; s#^([^:/]+):#\1/#; s#/+$##')
    if [ -n "$_key" ]; then
      printf '%s' "$_key"
      return 0
    fi
  fi
  basename "$1"
}

# ---------------------------------------------------------------- input
PAYLOAD=""
if [ "$HOOK_MODE" = 1 ]; then
  # Run by hand from a terminal there is no payload to wait for.
  [ -t 0 ] && exit 0
  PAYLOAD=$(cat)
fi

SESSION=$F_SESSION
if [ "$HOOK_MODE" = 1 ]; then
  SESSION=$(json_first session_id)
fi
SESSION=$(printf '%s' "$SESSION" | tr -cd 'A-Za-z0-9_-')
STATE_FILE=""
[ -n "$SESSION" ] && [ -n "${STATE_DIR%/}" ] && STATE_FILE="${STATE_DIR%/}/$SESSION.state"

# ---------------------------------------------------------------- what is this invocation?
# The three session hooks fire in every Claude Code session, so they decide from the environment
# and the state file alone and leave before reading any file or touching the network (D18).
S_MODE=""
[ -n "$STATE_FILE" ] && [ -f "$STATE_FILE" ] && S_MODE=$(state_get MODE)

ACTION=""       # start | finish | session-end | intervention
ORIGIN=subagent
SOURCE=subagent-hook
META_EVENT=""
case $EVENT in
  run-start)
    ACTION=start
    META_EVENT=run-start
    ;;
  run-finish)
    ACTION=finish
    META_EVENT=run-finish
    ;;
  intervention)
    ACTION=intervention
    META_EVENT=intervention
    ;;
  prompt)
    ORIGIN=main
    SOURCE=session-hook
    # A task notification is the harness reporting a finished background agent, not the operator.
    case $PAYLOAD in *'"prompt":"<task-notification>'*) exit 0 ;; esac
    HAS_MARKER=0
    case $PAYLOAD in *Factory-Run:*) HAS_MARKER=1 ;; esac
    if [ "$HAS_MARKER" = 1 ] || { [ -n "${FACTORY_DRIVER:-}" ] && [ "$S_MODE" != run ]; }; then
      ACTION=start
      META_EVENT=run-start
    elif [ "$S_MODE" = observe ]; then
      ACTION=intervention
      META_EVENT=intervention
    else
      exit 0
    fi
    ;;
  session-finish)
    [ "$S_MODE" = run ] || exit 0
    ORIGIN=main
    SOURCE=session-hook
    ACTION=finish
    META_EVENT=run-finish
    ;;
  session-end)
    ORIGIN=main
    SOURCE=session-hook
    if [ "$S_MODE" = run ]; then
      ACTION=session-end
      META_EVENT=session-end
    else
      [ -n "$STATE_FILE" ] && rm -f "$STATE_FILE"
      exit 0
    fi
    ;;
esac
if [ "$HOOK_MODE" = 0 ]; then
  SOURCE=cli
  ORIGIN=subagent
fi

# ---------------------------------------------------------------- repository, ticket, agent
# The prompt text with JSON escapes turned into spaces, for searching only.
PROMPT_RAW=""
PROMPT_SEARCH=""
if [ "$EVENT" = prompt ]; then
  PROMPT_RAW=$(printf '%s' "$PAYLOAD" | head -c 20000 | sed -nE 's/.*"prompt"[ ]*:[ ]*"(([^"\\]|\\.)*)("|$).*/\1/p' | head -1)
  PROMPT_SEARCH=$(printf '%s' "$PROMPT_RAW" | sed 's/\\[nrt"\\]/ /g')
fi

REPO=$F_REPO
if [ -z "$REPO" ] && [ "$ACTION" = intervention ] && [ -n "$STATE_FILE" ]; then
  REPO=$(state_get REPO)
fi
if [ -z "$REPO" ] && [ "$HOOK_MODE" = 1 ]; then
  # The convention of the coordinate skill: the task message starts with `Product repo: <abs path>`.
  _pr=$(printf '%s' "$PAYLOAD" | grep -o 'Product repo: [^\\"]*' | head -1 | sed 's/^Product repo: //; s/[ ]*$//')
  [ -n "$_pr" ] && [ -d "$_pr" ] && REPO=$_pr
fi
[ -z "$REPO" ] && [ "$HOOK_MODE" = 1 ] && REPO=$(json_first cwd)
[ -z "$REPO" ] && REPO=$PWD

# Ticket: flag, FACTORY_TICKET, Factory-Run marker, docs/requirements/NNN in the payload, a standalone
# NNN in the prompt; for finishes the agent's transcript and the state file; for interventions the state file.
TICKET=$F_TICKET
[ -z "$TICKET" ] && TICKET=${FACTORY_TICKET:-}
# A driven main-session run keeps the ticket it started with: a final message may name other documents.
if [ -z "$TICKET" ] && [ -n "$STATE_FILE" ] && { [ "$EVENT" = session-finish ] || [ "$EVENT" = session-end ]; }; then
  TICKET=$(state_get TICKET)
fi
if [ -z "$TICKET" ] && [ "$HOOK_MODE" = 1 ]; then
  TICKET=$(printf '%s' "$PAYLOAD" | grep -oE 'Factory-Run:[ ]*(factory:)?(groom|architect|implementer|validator)[ ]+[0-9]{3,}' | head -1 | grep -oE '[0-9]{3,}$')
fi
FROM_PAYLOAD=""
# The final message of a stopped subagent may name other documents: its own transcript is asked instead.
case $PAYLOAD in *'"hook_event_name":"SubagentStop"'*) SKIP_PAYLOAD_TICKET=1 ;; *) SKIP_PAYLOAD_TICKET=0 ;; esac
if [ "$HOOK_MODE" = 1 ] && [ "$SKIP_PAYLOAD_TICKET" = 0 ]; then
  FROM_PAYLOAD=$(printf '%s' "$PAYLOAD" | grep -oE 'docs\\?/requirements\\?/[0-9]{3,}' | head -1 | grep -oE '[0-9]{3,}$')
fi
if [ "$ACTION" = intervention ] && [ "$HOOK_MODE" = 1 ]; then
  # A session that reports one ticket keeps reporting it; only an explicit path in the prompt moves it.
  _named=$(printf '%s' "$PROMPT_SEARCH" | grep -oE 'docs/requirements/[0-9]{3,}' | head -1 | grep -oE '[0-9]{3,}$')
  [ -z "$TICKET" ] && TICKET=$_named
  [ -z "$TICKET" ] && [ -n "$STATE_FILE" ] && TICKET=$(state_get TICKET)
fi
[ -z "$TICKET" ] && TICKET=$FROM_PAYLOAD
if [ -z "$TICKET" ] && [ "$EVENT" = prompt ] && [ "$ACTION" = start ]; then
  TICKET=$(printf ' %s ' "$PROMPT_SEARCH" | grep -oE '(^|[^0-9A-Za-z])[0-9]{3}([^0-9A-Za-z]|$)' | head -1 | grep -oE '[0-9]{3}')
fi

AGENT_TRANSCRIPT=""
TRANSCRIPT=""
if [ "$HOOK_MODE" = 1 ] && { [ "$ACTION" = finish ] || [ "$ACTION" = session-end ]; }; then
  TRANSCRIPT=$(json_first transcript_path)
  if [ "$ORIGIN" = subagent ]; then
    AGENT_TRANSCRIPT=$(json_first agent_transcript_path)
  fi
  if [ -z "$TICKET" ] && [ "$ACTION" = finish ]; then
    if [ -n "$AGENT_TRANSCRIPT" ] && [ -r "$AGENT_TRANSCRIPT" ]; then
      TICKET=$(grep -m1 -oE 'docs\\?/requirements\\?/[0-9]{3,}' "$AGENT_TRANSCRIPT" | head -1 | grep -oE '[0-9]{3,}$')
    fi
    [ -z "$TICKET" ] && [ -n "$STATE_FILE" ] && TICKET=$(state_get TICKET)
    if [ -z "$TICKET" ] && [ -n "$TRANSCRIPT" ] && [ -r "$TRANSCRIPT" ]; then
      TICKET=$(grep -oE 'docs\\?/requirements\\?/[0-9]{3,}' "$TRANSCRIPT" | tail -1 | grep -oE '[0-9]{3,}$')
    fi
  fi
fi
if [ -z "$TICKET" ] && [ "$ACTION" = session-end ] && [ -n "$STATE_FILE" ]; then
  TICKET=$(state_get TICKET)
fi
if [ -z "$TICKET" ]; then
  if [ "$EVENT" = prompt ] && [ "$ACTION" = start ]; then
    log_line "prompt: driven session without a ticket (name it with Factory-Run: <agent> <ticket>, FACTORY_TICKET or docs/requirements/NNN in the prompt)"
    if ! printf '%s' "$PROMPT_SEARCH" | grep -qE '(factory:|/)(groom|architect|implementer|validator)' && [ -z "$F_AGENT${FACTORY_AGENT:-}" ]; then
      log_line "prompt: driven session without an agent either (FACTORY_AGENT, Factory-Run: <agent> <ticket> or factory:<agent> in the prompt)"
    fi
  fi
  exit 0
fi

# Agent, needed for a start. Hook mode of a subagent: the Agent tool's subagent_type only, so a
# helper subagent of a driven session is never reported as a factory run. Main session and CLI:
# flag, FACTORY_AGENT, the marker, then factory:<agent> or /<agent> in the prompt.
AGENT=""
AGENT_RE='(groom|architect|implementer|validator)'
if [ "$ACTION" = start ]; then
  AGENT=$F_AGENT
  if [ "$HOOK_MODE" = 1 ] && [ "$EVENT" = run-start ]; then
    AGENT=$(printf '%s' "$PAYLOAD" | grep -oE "\"subagent_type\"[ ]*:[ ]*\"(factory:)?$AGENT_RE\"" | head -1 | grep -oE "$AGENT_RE")
    if [ -z "$AGENT" ]; then
      # Not a factory agent (an Explore or general-purpose helper): nothing to report.
      exit 0
    fi
  else
    [ -z "$AGENT" ] && AGENT=${FACTORY_AGENT:-}
    if [ -z "$AGENT" ] && [ "$HOOK_MODE" = 1 ]; then
      AGENT=$(printf '%s' "$PAYLOAD" | grep -oE "Factory-Run:[ ]*(factory:)?$AGENT_RE" | head -1 | grep -oE "$AGENT_RE")
    fi
    if [ -z "$AGENT" ] && [ "$HOOK_MODE" = 1 ]; then
      AGENT=$(printf '%s' "$PROMPT_SEARCH" | grep -oE "(factory:|/)$AGENT_RE" | head -1 | grep -oE "$AGENT_RE")
    fi
    if [ -z "$AGENT" ]; then
      log_line "$EVENT: no agent named for ticket $TICKET (use Factory-Run: <agent> <ticket>, FACTORY_AGENT or /factory:<agent> in the prompt)"
      exit 0
    fi
  fi
fi

if [ "$HOOK_MODE" = 0 ] && [ "$ACTION" != start ]; then
  AGENT=$F_AGENT
fi

# Finish hooks of subagents only report factory agents.
if [ "$HOOK_MODE" = 1 ] && [ "$EVENT" = run-finish ]; then
  _named=$(printf '%s' "$PAYLOAD" | grep -oE "\"(subagent_type|agent_type)\"[ ]*:[ ]*\"[^\"]*\"" | head -1 | sed 's/.*:[ ]*"//; s/"$//')
  case $_named in
    groom | architect | implementer | validator | factory:groom | factory:architect | factory:implementer | factory:validator) ;;
    *) exit 0 ;;
  esac
fi

# ---------------------------------------------------------------- requirements document, project
TITLE=""
REQ_STATUS=""
SLUG=""
REQ_FILE=""
for _f in "$REPO"/docs/requirements/"$TICKET"-*.md; do
  [ -f "$_f" ] && REQ_FILE=$_f && break
done
if [ -n "$REQ_FILE" ]; then
  TITLE=$(head -1 "$REQ_FILE" | sed -E 's/^#[ ]+[0-9]+[ ]+(–|—|-)[ ]+//; s/^#[ ]+//; s/[ ]+$//')
  REQ_STATUS=$(grep -m1 '^- Status:' "$REQ_FILE" | sed 's/^- Status:[ ]*//; s/[ ]*$//')
  SLUG=$(basename "$REQ_FILE" .md | sed -E "s/^$TICKET-//")
fi
PROJECT=$(derive_project "$REPO")
if [ "$ACTION" = intervention ] && [ "$HOOK_MODE" = 1 ] && [ -n "$STATE_FILE" ]; then
  _sp=$(state_get PROJECT)
  [ -n "$_sp" ] && [ -z "$F_REPO" ] && PROJECT=$_sp
fi

# ---------------------------------------------------------------- meta
TS=$(now_ms)
META="{\"v\":1,\"event\":\"$META_EVENT\",\"ts\":$TS,\"project\":\"$(json_escape "$PROJECT")\",\"ticket\":\"$(json_escape "$TICKET")\""
add_str() { [ -n "$2" ] && META="$META,\"$1\":\"$(json_escape "$2")\""; return 0; }
add_str repo_path "$REPO"
add_str title "$TITLE"
add_str slug "$SLUG"
add_str req_status "$REQ_STATUS"
add_str agent "$AGENT"
META="$META,\"source\":\"$SOURCE\",\"origin\":\"$ORIGIN\""
add_str driver "${FACTORY_DRIVER:-}"
add_str session_id "$SESSION"
if [ "$HOOK_MODE" = 1 ]; then
  add_str tool_use_id "$(json_first tool_use_id)"
fi
META_TRANSCRIPT=${AGENT_TRANSCRIPT:-$TRANSCRIPT}
add_str transcript_path "$META_TRANSCRIPT"

# The cumulative token counter: the subagent's own transcript when the payload names one, the
# session's own lines for a main-session run. A PostToolUse carries its usage in the payload.
if [ "$HOOK_MODE" = 1 ] && [ "$ACTION" = finish ]; then
  _cum=""
  if [ -n "$AGENT_TRANSCRIPT" ]; then
    _cum=$(count_tokens "$AGENT_TRANSCRIPT" all)
  elif [ "$ORIGIN" = main ]; then
    _cum=$(count_tokens "$TRANSCRIPT" main)
  elif [ "$(json_first hook_event_name)" = SubagentStop ]; then
    _cum=$(count_tokens "$TRANSCRIPT" sidechain)
  fi
  [ -n "$_cum" ] && META="$META,\"cum_tokens\":$_cum"
fi

BODY_KIND=none
case $ACTION in
  start) [ "$HOOK_MODE" = 1 ] && BODY_KIND=payload ;;
  finish | session-end) [ "$HOOK_MODE" = 1 ] && BODY_KIND=payload ;;
esac

case $ACTION in
  finish)
    if [ "$HOOK_MODE" = 0 ]; then
      add_str result "$F_RESULT"
      [ -n "$F_TOKENS" ] && log_line "run-finish: --tokens is not supported yet and was ignored"
    fi
    ;;
  intervention)
    if [ "$HOOK_MODE" = 1 ]; then
      # The prompt as Claude Code delivered it is already a JSON string body: embed it untouched,
      # capped at 4 KiB without cutting an escape sequence in half.
      _what=$(printf '%s' "$PROMPT_RAW" | head -c 4096 | sed -E 's/\\u[0-9A-Fa-f]{0,3}$//' | awk '
        { s = s $0 } END {
          n = 0
          while (n < length(s) && substr(s, length(s) - n, 1) == "\\") n++
          if (n % 2 == 1) s = substr(s, 1, length(s) - 1)
          printf "%s", s
        }')
      [ -n "$_what" ] || exit 0
      META="$META,\"what\":\"$_what\""
    else
      [ -n "$F_WHAT" ] || exit 0
      _what=$(printf '%s' "$F_WHAT" | head -c 4096)
      META="$META,\"what\":\"$(json_escape "$_what")\""
    fi
    ;;
esac
META="$META}"

# ---------------------------------------------------------------- send
command -v curl >/dev/null 2>&1 || { log_line "$EVENT: curl is not installed"; exit 0; }
TMP=$(mktemp "${TMPDIR:-/tmp}/factory-report.XXXXXX") || exit 0

case $ACTION in
  start) URL_PATH=/api/hook/run-start; MAX_TIME=2 ;;
  finish | session-end) URL_PATH=/api/hook/run-finish; MAX_TIME=5 ;;
  intervention) URL_PATH=/api/intervention; MAX_TIME=2 ;;
esac

case $BODY_KIND in
  payload)
    printf '%s' "$PAYLOAD" >"$TMP.body"
    if [ "$ACTION" = finish ] && [ -n "$AGENT_TRANSCRIPT" ] && [ -r "$AGENT_TRANSCRIPT" ]; then
      printf '\n%s\n' '---8<---' >>"$TMP.body"
      tail -c "$TAIL_BYTES" "$AGENT_TRANSCRIPT" >>"$TMP.body"
    elif [ "$ACTION" = finish ] && [ "$ORIGIN" = main ] && [ -n "$TRANSCRIPT" ] && [ -r "$TRANSCRIPT" ]; then
      printf '\n%s\n' '---8<---' >>"$TMP.body"
      tail -c "$TAIL_BYTES" "$TRANSCRIPT" >>"$TMP.body"
    fi
    ;;
  *)
    : >"$TMP.body"
    if [ "$ACTION" = finish ] && [ -n "$F_OUTPUT_FILE" ] && [ -r "$F_OUTPUT_FILE" ]; then
      cat "$F_OUTPUT_FILE" >"$TMP.body"
    fi
    ;;
esac

URL=${FACTORY_DASHBOARD_URL%/}
if [ -n "${FACTORY_INGEST_TOKEN:-}" ]; then
  HDR=$(mktemp "${TMPDIR:-/tmp}/factory-report-hdr.XXXXXX") || exit 0
  printf 'Authorization: Bearer %s\n' "$FACTORY_INGEST_TOKEN" >"$HDR"
  HTTP=$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 1 --max-time "$MAX_TIME" -X POST \
    -H 'Content-Type: text/plain; charset=utf-8' -H "X-Factory-Meta: $(printf '%s' "$META" | base64 | tr -d '\n')" \
    -H "@$HDR" --data-binary @"$TMP.body" "$URL$URL_PATH")
else
  HTTP=$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 1 --max-time "$MAX_TIME" -X POST \
    -H 'Content-Type: text/plain; charset=utf-8' -H "X-Factory-Meta: $(printf '%s' "$META" | base64 | tr -d '\n')" \
    --data-binary @"$TMP.body" "$URL$URL_PATH")
fi
case $HTTP in
  2??) ;;
  *) log_line "$EVENT ticket $TICKET: dashboard answered ${HTTP:-none} ($URL$URL_PATH)" ;;
esac

# ---------------------------------------------------------------- session state (R13)
if [ "$HOOK_MODE" = 1 ] && [ -n "$STATE_FILE" ]; then
  case $ACTION in
    start)
      _mode=observe
      [ "$ORIGIN" = main ] && _mode=run
      # A driven main session that spawns factory subagents stays MODE=run.
      [ "$S_MODE" = run ] && _mode=run
      if mkdir -p "$STATE_DIR"; then
        find "$STATE_DIR" -name '*.state' -mtime +7 -exec rm -f {} + 2>/dev/null
        {
          printf 'MODE=%s\n' "$_mode"
          printf 'AGENT=%s\n' "$AGENT"
          printf 'TICKET=%s\n' "$TICKET"
          printf 'REPO=%s\n' "$REPO"
          printf 'PROJECT=%s\n' "$PROJECT"
          printf 'STARTED=%s\n' "$TS"
        } >"$STATE_FILE"
      fi
      ;;
    session-end) rm -f "$STATE_FILE" ;;
  esac
fi

exit 0
