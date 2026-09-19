# ADR 0005 – Shopping list sync on the Pi (Postgres + SSE), not Firebase

- Status: Proposed – needs stakeholder confirmation
- Date: 2026-09-19
- Context: 002 S1, S4; stakeholder technical constraint "Sync am besten über Firebase"

## Context
The shopping list must be shared live between household members, and viewing and ticking must work offline. The stakeholder prefers Firebase for the sync. The existing system runs entirely on the Pi with no external services (hard constraint from 001: frontend, backend and database dockerized on the Pi). Recipes and users already live in Postgres on the Pi.

## Options
1. **Firebase (Firestore + Firebase Auth custom tokens).** Pros: live sync and offline persistence built in, and reachable from the store over mobile data with no network setup. Cons:
   - The list database moves off the Pi, which breaks the 001 hard constraint and "no external services".
   - Household data is stored at Google.
   - It adds a second data store and a second auth system. The Ktor backend would have to mint custom tokens with a service-account key.
   - Merge rules R1–R2b and the area memory would run either in the client, where concurrent adds race, or in Cloud Functions. Cloud Functions need the paid Blaze plan and run JS/TS, not Kotlin.
   - The internet becomes a runtime dependency, even at home.
2. **Postgres on the Pi + SSE + client outbox (chosen).** Pros:
   - One source of truth and one auth.
   - Rules run transactionally in Kotlin.
   - Fits the existing PWA/offline approach.
   - No new container and no cost.

   Cons: offline reconciliation is our own code (kept small: set-semantics ticks only). Reaching the list from the store needs remote access to the home network (ADR 0006).
3. WebSockets instead of SSE: bidirectional, but not needed, since mutations use REST. SSE is simpler through Caddy, reconnects automatically and uses the session cookie as is.

## Decision
Option 2. The stakeholder's underlying need (live, shared list; offline ticking) is met without Firebase.

## Consequences
- Remote access from outside the home is required for the "live in the store" part of S1. See ADR 0006.
- If the stakeholder still wants Firebase, only the sync/hosting layer changes. Business rules, classifier and UI are reusable.
