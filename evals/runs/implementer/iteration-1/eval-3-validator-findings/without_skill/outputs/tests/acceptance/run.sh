#!/usr/bin/env sh
# Runs every acceptance test against a started stack.
#   BASE_URL=http://localhost:8080 tests/acceptance/run.sh
# Without arguments it runs the whole suite (the regression suite of the
# product). With arguments it runs only the named folders, for example:
#   tests/acceptance/run.sh 001-task-list
set -e

cd "$(dirname "$0")"
BASE_URL="${BASE_URL:-http://localhost:8080}"
export BASE_URL

echo "Waiting for $BASE_URL/health ..."
i=0
until wget -q -O - "$BASE_URL/health" >/dev/null 2>&1 || curl -sf "$BASE_URL/health" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "The stack did not become healthy at $BASE_URL" >&2
    exit 1
  fi
  sleep 1
done

if [ "$#" -gt 0 ]; then
  folders="$*"
else
  folders=$(find . -mindepth 1 -maxdepth 1 -type d | sed 's|^\./||' | sort)
fi

status=0
for folder in $folders; do
  echo ""
  echo "=== $folder ==="
  node --test "$folder"/*.test.js || status=1
done

exit $status
