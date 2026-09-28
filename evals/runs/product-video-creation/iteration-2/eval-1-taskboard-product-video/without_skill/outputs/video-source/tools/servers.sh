#!/bin/bash
# start | stop | reset : runs Taskboard (8112) and the stage proxy (8212) from this scratch folder.
# reset wipes the demo data, restarts both servers and seeds the demo list through the real API.
set -euo pipefail
SCR="$(cd "$(dirname "$0")/.." && pwd)"
REPO=/Users/vicokuras/IdeaProjects/factory/evals/runs/product-video-creation/iteration-2/eval-1-taskboard-product-video/without_skill/repo

stop() {
  for f in "$SCR/app.pid" "$SCR/stage.pid"; do
    if [[ -f "$f" ]]; then kill "$(cat "$f")" 2>/dev/null || true; rm -f "$f"; fi
  done
  sleep 0.3
}

wait_for() {
  for _ in $(seq 1 50); do curl -sf "$1" >/dev/null && return 0; sleep 0.1; done
  echo "timeout waiting for $1" >&2; return 1
}

start() {
  PORT=8112 DATA_DIR="$SCR/data" nohup node "$REPO/src/server.js" >"$SCR/app.log" 2>&1 &
  echo $! >"$SCR/app.pid"
  nohup node "$SCR/tools/stage-server.mjs" "$SCR/stage" 8212 8112 >"$SCR/stage.log" 2>&1 &
  echo $! >"$SCR/stage.pid"
  wait_for http://127.0.0.1:8112/health
  wait_for http://127.0.0.1:8212/health
}

add() { curl -sf -X POST -H 'Content-Type: application/json' -d "{\"title\":\"$1\"}" http://127.0.0.1:8112/api/tasks | sed -E 's/.*"id":([0-9]+).*/\1/'; }
done_() { curl -sf -X PATCH -H 'Content-Type: application/json' -d '{"done":true}' "http://127.0.0.1:8112/api/tasks/$1" >/dev/null; }

seed() {
  add "Renew the website domain" >/dev/null
  add "Buy coffee beans" >/dev/null
  done_ "$(add "Take out the recycling")"
  add "Call back the customer about the late order" >/dev/null
  done_ "$(add "Water the plants")"
  add "Fix the Wi-Fi in the back corner" >/dev/null
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  reset) stop; rm -rf "$SCR/data"; mkdir -p "$SCR/data"; start; seed; curl -s http://127.0.0.1:8112/api/tasks; echo ;;
  *) echo "usage: $0 start|stop|reset" >&2; exit 2 ;;
esac
