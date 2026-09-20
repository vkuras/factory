#!/bin/sh
# Runs shellcheck (pinned, ADR-0009) over the reporter and its tests in POSIX sh mode. Needs Docker.
#   sh plugins/factory/hooks/test/lint.sh
HERE=$(cd "$(dirname "$0")" && pwd)
exec docker run --rm -v "$HERE/..":/mnt:ro koalaman/shellcheck:v0.11.0 -s sh /mnt/report.sh /mnt/test/run.sh /mnt/test/lint.sh
