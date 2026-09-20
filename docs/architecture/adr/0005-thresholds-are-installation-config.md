# 0005 – The two attention thresholds are installation configuration, not a screen

- Status: Accepted
- Date: 2026-09-20
- Requirements: 001 S7, R1, D1, Out of scope ("Any action taken from the dashboard: … editing")

## Context

S7 asks the operator to set two numbers: the loop threshold and the idle threshold, defaulting to
three loops and 24 hours. At the same time D1 and the out-of-scope list say the dashboard only
shows: no action is taken from it, nothing is edited in it, and there is no login that could tell
one editor from another.

The supplied design exposes both numbers as component properties of the design tool, which is not
a UI either.

## Options

### A – A settings screen (or an inline control) that writes to the database
Directly contradicts "any action taken from the dashboard … editing" and would be the only write
path from the browser in the whole product, on an installation with no login.

### B – Environment variables in the installation's `.env`, read at startup
"When the dashboard runs, it uses the design's defaults" (S7.3) reads naturally as runtime
configuration. The operator already edits `.env` to install (port, URL, timezone), so nothing new
is introduced. Changing a threshold costs `docker compose up -d`.

### C – A config file in a volume, re-read per request
Same as B without a restart, but adds a file format, a watcher and a failure mode (a typo makes the
page unrenderable) for a number that changes maybe twice a year.

## Decision

Option B. `LOOP_THRESHOLD` (default `3`) and `IDLE_HOURS` (default `24`), validated at startup:
integers ≥ 1; anything else aborts startup with a one-line error naming the variable. Both values
are shown where the design shows them — the loop-threshold note text of R1 rule 5 ("over your
threshold of 3").

## Consequences

- The browser makes no write request at all; the only writers are the factory's hooks.
- A threshold change needs a container restart, which is documented in `.env.example` and the
  README.
- There is no settings table and no settings screen to test, and the attention rules stay pure
  functions of (tickets, thresholds, now).
