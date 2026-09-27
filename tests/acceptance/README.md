# Acceptance tests

These tests belong to the validator. They are the product's regression suite: one folder per
requirements document, each check named after the requirement it proves.

- They talk to the product only through its published interfaces — the reporting API the factory
  uses, the reporter `plugins/factory/hooks/report.sh`, and a real browser. They never import
  product code and never read the database.
- The implementer runs them before handing work over and must not change them. A test that is
  wrong is a finding for the validator, not a file to edit.

## Running them

```sh
sh tests/acceptance/run.sh          # functional suite, about 6 minutes
sh tests/acceptance/run.sh --perf   # plus load, memory and target-platform measurements
sh tests/acceptance/run.sh --keep   # leave the stacks up afterwards
```

Needs `docker` and `curl`. The suite starts the product itself under its own compose project name
(`acc001`, ports 8792 and 8793 by default; override with `ACC_PROJECT` and `ACC_PORT`), so it never
touches another stack, and it removes both stacks and their volumes at the end.

The tests run in containers: the HTTP checks in `node:26.9.0-trixie-slim`, the browser checks in
`mcr.microsoft.com/playwright`, the load test in `grafana/k6`. Nothing has to be installed on the
host. Screenshots and measurements are written to `docs/validation/001-agent-factory-dashboard/`.

## What is where

| Path | What it covers |
|---|---|
| `001-agent-factory-dashboard/api/` | The dashboard over HTTP: attention, pipeline, detail, analytics, reporting, two repositories, thresholds, persistence |
| `001-agent-factory-dashboard/ui/` | The same screens in a browser: landing tab, tab switching, dark appearance, desktop layout, screenshots |
| `001-agent-factory-dashboard/reporter/` | The factory side: the reporter's hook and CLI modes, an unreachable dashboard, a driver that is not the coordinator |
| `001-agent-factory-dashboard/perf/` | Load, memory, database size and the target CPU architecture |
| `001-agent-factory-dashboard/seed/` | The dataset every check is written against, reported in through the ingest API |
