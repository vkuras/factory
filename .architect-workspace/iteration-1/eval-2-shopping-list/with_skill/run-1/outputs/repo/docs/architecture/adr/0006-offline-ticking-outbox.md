# 0006 – Offline viewing and ticking with an IndexedDB snapshot and an outbox of absolute tick states

- Status: Accepted
- Date: 2026-09-19
- Requirements: 002 S4.6, QE3, R1, R2a, Left to architecture 2 and 3; 001 S4

## Context
In a store without reception the shopper must see the list and tick/untick lines; the ticks must reach the others later and nothing ticked offline may be lost. Adding without connection is not required. Meanwhile other members may add recipes, which merges quantities into open lines (R1) – an offline tick of "2 Zwiebeln" must not silently cover a "+1 Zwiebeln" added at home. iOS Safari has no Background Sync API. 001 already caches opened recipes via the Workbox service worker.

## Options
### A – Service-worker cache of `GET /api/shopping-list` + Workbox Background Sync queue
Little app code, but Background Sync does not run on iOS; the cached response cannot show pending ticks, so the UI would revert after reload.
### B – App-level IndexedDB snapshot + outbox, absolute states, revision check on the server
The app renders snapshot + pending ticks, replays when online. Ticks are "set ticked = true/false" (idempotent). Each line carries a `revision` incremented on merges; a stale tick splits the line into the ticked part the shopper saw and an open remainder.
### C – Full offline-first replicated store (CRDT, PouchDB/CouchDB-style)
Handles every offline operation, but adds a replication stack and a second database for a requirement that only covers ticking.

## Decision
B. Works on iOS and Android, needs only `idb` in the frontend, and the revision split gives exactly the result as if the offline tick had reached the server first (R2a), so neither the tick nor the other member's addition is lost. Only tick/untick are queued; adding, deleting, moving and finishing stay online-only (LA3 answered: not supported).

## Consequences
- Tick requests carry `seenRevision` and `seenQuantity`; every merge must increment `revision`.
- Conflicting tick states from different members resolve by server arrival order.
- A device that never loaded the list cannot show it offline.
- The 001 service worker cache stays unchanged; shopping data is never put into the SW cache.
- Revisit if offline adding becomes a requirement.
