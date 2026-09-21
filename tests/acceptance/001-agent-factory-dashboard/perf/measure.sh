#!/bin/sh
# Quality expectations that are numbers: "feels immediate" (QE2) and "lives within a Raspberry Pi's
# resources" (QE1, SC1). Measured against the production-like stack with its own memory and CPU
# limits and a history of the size the design was budgeted for.
#
#   sh perf/measure.sh <project> <port> <work-dir> <evidence-dir> <repo-root> <suite-dir> <node-image>
set -eu

PROJECT=$1; PORT=$2; WORK=$3; EVIDENCE=$4; ROOT=$5; SUITE=$6; NODE_IMAGE=$7
K6_IMAGE=${ACC_K6_IMAGE:-grafana/k6:1.3.0}
TICKETS=${PERF_TICKETS:-300}

cp "$ROOT/.env.example" "$WORK/$PROJECT.env"
printf '\nDASHBOARD_PORT=%s\nDASHBOARD_BIND=127.0.0.1\n' "$PORT" >> "$WORK/$PROJECT.env"
docker compose -p "$PROJECT" --env-file "$WORK/$PROJECT.env" down -v >/dev/null 2>&1 || true
docker compose -p "$PROJECT" --env-file "$WORK/$PROJECT.env" up -d --build >/dev/null
n=0; while [ $n -lt 90 ]; do curl -fs "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1 && break; n=$((n+1)); sleep 1; done

printf 'seeding %s tickets ...\n' "$TICKETS"
docker run --rm --network "${PROJECT}_default" -v "$SUITE":/suite:ro -e BASE=http://dashboard:8787 -e TICKETS="$TICKETS" \
  -w /suite "$NODE_IMAGE" node perf/seed-bulk.mjs | tail -2

CONTAINER=$(docker compose -p "$PROJECT" --env-file "$WORK/$PROJECT.env" ps -q dashboard)
printf 'image architecture: %s\n' "$(docker image inspect -f '{{.Architecture}}/{{.Os}}' "$(docker inspect -f '{{.Config.Image}}' "$CONTAINER")")" | tee "$EVIDENCE/resources.txt"
printf 'limits: %s bytes memory, %s cpus\n' "$(docker inspect -f '{{.HostConfig.Memory}}' "$CONTAINER")" "$(docker inspect -f '{{.HostConfig.NanoCpus}}' "$CONTAINER")" | tee -a "$EVIDENCE/resources.txt"

( while true; do docker stats --no-stream --format '{{.MemUsage}} {{.CPUPerc}}' "$CONTAINER"; sleep 5; done ) > "$WORK/stats.txt" 2>/dev/null &
STATS_PID=$!

docker run --rm --network "${PROJECT}_default" -v "$SUITE":/suite:ro -v "$EVIDENCE":/evidence \
  -e BASE=http://dashboard:8787 -e TICKETS="$TICKETS" -w /suite "$K6_IMAGE" \
  run --summary-export=/evidence/k6-summary.json perf/load.js 2>&1 | tee "$EVIDENCE/k6-output.txt"
K6_STATUS=$?

kill "$STATS_PID" 2>/dev/null || true
{
  printf '\npeak memory and cpu during the load test (docker stats, every 5 s):\n'
  sort -h "$WORK/stats.txt" | tail -3
  printf 'OOMKilled: %s, restarts: %s\n' "$(docker inspect -f '{{.State.OOMKilled}}' "$CONTAINER")" "$(docker inspect -f '{{.RestartCount}}' "$CONTAINER")"
  printf 'database size: %s\n' "$(docker exec "$CONTAINER" sh -c 'du -sh /data' 2>/dev/null || echo unknown)"
} | tee -a "$EVIDENCE/resources.txt"

printf 'building the image for the Raspberry Pi platform ...\n'
if docker buildx build --platform linux/arm64 -t "$PROJECT-arm64" "$ROOT/dashboard" >"$WORK/arm64.log" 2>&1; then
  printf 'linux/arm64 build: ok\n' | tee -a "$EVIDENCE/resources.txt"
else
  printf 'linux/arm64 build: FAILED (see the log)\n' | tee -a "$EVIDENCE/resources.txt"
  tail -20 "$WORK/arm64.log"
fi

docker compose -p "$PROJECT" --env-file "$WORK/$PROJECT.env" down -v >/dev/null 2>&1 || true
exit $K6_STATUS
