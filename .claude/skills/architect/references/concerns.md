# Cross-cutting concerns

A thinking aid for step 4. Go through it and address every concern that applies to the product or feature. For a concern that clearly does not apply, skip it. Don't pad the design with "not applicable" lines, except for a concern a reader would expect to see covered.

## Identity and access
- How do users get an account or access, and who can invite whom? What happens when access is lost (password reset, lost device)?
- Map every role and permission from the requirements to a check. Where is each one enforced? Enforce on the server; the UI only hides things.
- What do non-members see? The answer must be nothing, not an error that leaks data.

## Data
- Who owns each record, and who can see it?
- What happens on concurrent edits of the same record: last write wins, merge, or reject? Does the requirement tolerate that choice?
- Migrations from the current schema, and what happens to existing data.
- Import of existing material: its real format, its messy cases, and whether the import runs once or repeatedly.

## Connectivity, offline use and sync
- What must work without a connection? What is cached, where, and how is the cache kept fresh?
- Queued offline actions: how are they replayed, and what happens on conflict? Does nothing get lost, as the requirements demand?
- Retried writes: every write a client may send twice (after a timeout, offline replay or double tap) is idempotent, either by nature (set a value) or through a client-generated idempotency key the server deduplicates. "Add item" and "add recipe to list" are the classic duplicates.
- Live updates between users: which mechanism, how does a client reconnect, and what does a user see when it's stale?

## Time
- Time zones, daylight-saving transitions, calendars and holidays (movable ones such as Easter-based holidays are computed, not listed by hand).
- Scheduled jobs: exact trigger time and zone, what happens if the job runs twice (idempotency), and what happens after a missed run (server down at the trigger time).
- "Today", "tomorrow" and "N days overdue": in which zone, and counted how?

## Capacity and resource footprint
- Derive the load from the requirements: users, concurrent users, actions per minute, data volume and growth, file sizes.
- If target hardware is given: CPU architecture (check that every image or binary exists for it), RAM (limits per process, runtime heap settings, database buffers, headroom for the OS), storage medium and its wear, and CPU.
- A verification: a load test with the required concurrency and a pass threshold, run against the production-like configuration.

## Files and media
- Allowed types and maximum size, resizing and compression, storage location, backup, and cleanup when the owning record is deleted.

## Deployment and operation
- How the product is built and started (one command), configured and given its secrets (never in the repo).
- Containers: is every server-side part a compose service? Does every image exist for the target architecture? Is all persistent data in named volumes so it survives `docker compose down` and image updates? Do services wait for healthy dependencies instead of crashing on start? Is the only published port the one users need (usually the reverse proxy), with the database reachable only on the internal network?
- How users reach it from where they actually are: home network, mobile network, construction site. Covers TLS, domain and exposure.
- Backups and restore, updates without data loss, health checks and restart policy, logs.

## External services
- Credentials and config, rate limits and quotas, cost, failure behaviour, and what the user experiences when the service is down.
- Whether the service fits every hard constraint (self-hosting, privacy, target platform).

## Errors and user-visible failures
- Every failure case in the acceptance criteria gets a concrete mechanism, for example "input is kept when saving fails".
- One consistent API error format.

## Locale and accessibility
- UI language, number, date and unit formats (e.g. "1,5" in German), text size requirements.

## Testing
- Every acceptance criterion maps to an automated test at a named level.
- Business-rule examples from the requirements become test cases.
- Time-dependent logic is tested with an injectable clock.
- Hard constraints are verified automatically where possible.
