#!/bin/sh
# Acceptance suite of the Agent Factory Dashboard — owned by the validator.
#
# It starts the product from a clean state with its own compose project name, drives it only
# through its published interfaces (the reporting API, the reporter the plugin ships, and a real
# browser) and tears everything down again. Nothing here imports product code or touches the
# database.
#
#   sh tests/acceptance/run.sh              functional suite (about 6 minutes)
#   sh tests/acceptance/run.sh --perf       plus the load, memory and platform measurements
#   sh tests/acceptance/run.sh --keep       leave the stacks running for a look
#
# Requirements: docker, curl, and a network the two test images can be pulled from.
set -eu

PERF=0
KEEP=0
for arg in "$@"; do
  case $arg in
    --perf) PERF=1 ;;
    --keep) KEEP=1 ;;
    *) printf 'unknown argument: %s\n' "$arg"; exit 2 ;;
  esac
done

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
SUITE="$ROOT/tests/acceptance/001-agent-factory-dashboard"
EVIDENCE=${ACC_EVIDENCE:-$ROOT/docs/validation/001-agent-factory-dashboard}
PROJECT=${ACC_PROJECT:-acc001}
PORT=${ACC_PORT:-8792}
AUX_PROJECT="${PROJECT}aux"
AUX_PORT=$((PORT + 1))
PERF_PROJECT="${PROJECT}perf"
PERF_PORT=$((PORT + 2))
NODE_IMAGE=${ACC_NODE_IMAGE:-node:26.9.0-trixie-slim}
PW_IMAGE=${ACC_PW_IMAGE:-mcr.microsoft.com/playwright:v1.56.0-noble}
PW_VERSION=1.56.0
PW_VOLUME=acc-playwright-modules

WORK=$(mktemp -d)
mkdir -p "$EVIDENCE"

cleanup() {
  [ "$KEEP" = 1 ] && { printf '\nstacks left running: %s (%s), %s (%s)\n' "$PROJECT" "$PORT" "$AUX_PROJECT" "$AUX_PORT"; return 0; }
  for p in "$PROJECT" "$AUX_PROJECT" "$PERF_PROJECT"; do
    docker compose -p "$p" --env-file "$WORK/$p.env" down -v >/dev/null 2>&1 || true
  done
  rm -rf "$WORK"
}
trap cleanup EXIT INT TERM

say() { printf '\n=== %s\n' "$1"; }

# A failing check must not hide the checks behind it: every phase runs, the run fails at the end.
FAILURES=0
FAILED_LIST=''
step() { # label command...
  _label=$1
  shift
  say "$_label"
  if "$@"; then
    return 0
  fi
  FAILURES=$((FAILURES + 1))
  FAILED_LIST="$FAILED_LIST
  - $_label"
  printf '!!! checks failed in: %s\n' "$_label"
  return 0
}

env_file() { # project port [KEY=VALUE ...]
  _p=$1; _port=$2; shift 2
  cp "$ROOT/.env.example" "$WORK/$_p.env"
  printf '\nDASHBOARD_PORT=%s\nDASHBOARD_BIND=127.0.0.1\n' "$_port" >> "$WORK/$_p.env"
  for kv in "$@"; do printf '%s\n' "$kv" >> "$WORK/$_p.env"; done
}

up() { # project port
  _p=$1; _port=$2
  docker compose -p "$_p" --env-file "$WORK/$_p.env" up -d --build >/dev/null
  _n=0
  while [ "$_n" -lt 60 ]; do
    if curl -fs "http://127.0.0.1:$_port/healthz" >/dev/null 2>&1; then return 0; fi
    _n=$((_n + 1)); sleep 1
  done
  printf 'the stack %s did not become healthy\n' "$_p"
  docker compose -p "$_p" --env-file "$WORK/$_p.env" logs --tail 40
  exit 1
}

node_in() { # project command...
  _p=$1; shift
  docker run --rm --network "${_p}_default" \
    -v "$SUITE":/suite:ro -v "$WORK":/work \
    -e BASE=http://dashboard:8787 -e WORK=/work \
    -w /suite "$NODE_IMAGE" "$@"
}

tests_in() { # project file...
  _p=$1; shift
  node_in "$_p" node --test --test-concurrency=1 "$@"
}

ui_in() { # project file...
  _p=$1; shift
  _files=$*
  docker volume create "$PW_VOLUME" >/dev/null
  docker run --rm --network "${_p}_default" \
    -v "$SUITE":/suite:ro -v "$EVIDENCE":/evidence -v "$PW_VOLUME":/pw \
    -e BASE=http://dashboard:8787 -e SHOTS=/evidence \
    -e PLAYWRIGHT_MODULE=/pw/node_modules/playwright \
    -w /suite "$PW_IMAGE" sh -c \
    "cd /pw && [ -d node_modules/playwright ] || npm i --no-save --silent playwright@$PW_VERSION >/dev/null 2>&1; cd /suite && node --test --test-concurrency=1 $_files"
}

# ------------------------------------------------------------------ the product, from scratch
say "starting the product from a clean state ($PROJECT on $PORT)"
env_file "$PROJECT" "$PORT"
docker compose -p "$PROJECT" --env-file "$WORK/$PROJECT.env" down -v >/dev/null 2>&1 || true
started=$(date +%s)
up "$PROJECT" "$PORT"
printf 'healthy after %s s\n' "$(( $(date +%s) - started ))"

say 'an installation that has never received a report'
step 'empty installation' tests_in "$PROJECT" api/01-empty.test.mjs

say 'the factory reports a history of ten tickets'
node_in "$PROJECT" node seed/seed.mjs main

step 'what needs me, the pipeline, one ticket, the trends' \
  tests_in "$PROJECT" api/02-attention.test.mjs api/03-pipeline-detail.test.mjs api/04-analytics.test.mjs

step 'the same, in a browser' ui_in "$PROJECT" ui/10-overview.test.mjs ui/11-look-and-feel.test.mjs

say 'the state before a second repository has ever reported'
node_in "$PROJECT" node seed/seed.mjs snapshot

say 'a ticket with forty weeks of history'
node_in "$PROJECT" node seed/seed.mjs old
step 'the six-month window, and what a report does' \
  tests_in "$PROJECT" api/05-analytics-window.test.mjs api/06-reporting.test.mjs

say 'a second repository reports'
node_in "$PROJECT" node seed/seed.mjs second
step 'two repositories' tests_in "$PROJECT" api/07-two-repositories.test.mjs
step 'two repositories, in a browser' ui_in "$PROJECT" ui/13-two-repositories.test.mjs

say 'the history survives a restart and a recreated container'
curl -fs "http://127.0.0.1:$PORT/healthz" > "$WORK/health-before-restart.json"
docker compose -p "$PROJECT" --env-file "$WORK/$PROJECT.env" restart >/dev/null
up "$PROJECT" "$PORT"
docker compose -p "$PROJECT" --env-file "$WORK/$PROJECT.env" down >/dev/null
up "$PROJECT" "$PORT"
step 'the history survives' tests_in "$PROJECT" api/08-persistence.test.mjs

# ------------------------------------------------------------------ the operator's own thresholds
say "a second installation with my own thresholds ($AUX_PROJECT on $AUX_PORT)"
env_file "$AUX_PROJECT" "$AUX_PORT" 'LOOP_THRESHOLD=2' 'IDLE_HOURS=1'
docker compose -p "$AUX_PROJECT" --env-file "$WORK/$AUX_PROJECT.env" down -v >/dev/null 2>&1 || true
up "$AUX_PROJECT" "$AUX_PORT"
step 'my own thresholds, and agents online' tests_in "$AUX_PROJECT" api/19-nothing-needs-me.test.mjs api/20-thresholds.test.mjs

step 'the reporter the plugin ships (hooks and CLI, no coordinator)' \
  env BASE="http://127.0.0.1:$AUX_PORT" sh "$SUITE/reporter/report-sh.test.sh"

# ------------------------------------------------------------------ load, memory, platform
if [ "$PERF" = 1 ]; then
  step 'load, memory and target platform' \
    sh "$SUITE/perf/measure.sh" "$PERF_PROJECT" "$PERF_PORT" "$WORK" "$EVIDENCE" "$ROOT" "$SUITE" "$NODE_IMAGE"
fi

if [ "$FAILURES" = 0 ]; then
  say 'every acceptance check passed'
else
  printf '\n=== %s phase(s) had failing checks:%s\n' "$FAILURES" "$FAILED_LIST"
  exit 1
fi
