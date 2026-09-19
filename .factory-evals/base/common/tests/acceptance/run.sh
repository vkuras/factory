#!/bin/sh
# Runs all acceptance tests (every feature) against a running stack.
# BASE_URL defaults to http://localhost:8080.
set -e
cd "$(dirname "$0")"
node --test "**/*.test.mjs"
