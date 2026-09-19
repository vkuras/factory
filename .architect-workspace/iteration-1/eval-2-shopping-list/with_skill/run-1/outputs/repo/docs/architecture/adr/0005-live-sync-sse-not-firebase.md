# 0005 – Live sync of the shopping list via Server-Sent Events from the existing backend, not Firebase

- Status: Accepted
- Date: 2026-09-19
- Requirements: 002 S1.2, S1.3, QE2, QE4, stakeholder technical constraint ("Sync am besten über Firebase"), Left to architecture 2; 001 stakeholder constraint 2 (Pi, Docker, 4 GB, 10 users)

## Context
Changes by one household member must appear on the other members' open lists without noticeable delay (≤ 1 s p95) and without manual refresh. 2–4 users, at most 10 concurrent clients, list typically ≤ 150 lines (≤ 20 KB JSON). The stakeholder prefers Firebase for sync. The product's frontend, backend and database must all run on the Raspberry Pi (001), and the list must be visible to household members only.

## Options
### A – Firebase (Firestore / Realtime Database)
Managed realtime sync and offline persistence. But the list data would live in Google's cloud, not on the Pi, violating 001's constraint; household-only access needs Firebase Auth next to the app's own login (custom tokens minted by the backend); merge rules (R1–R2b) would have to run in clients or Cloud Functions, i.e. outside Kotlin/the Pi.
### B – Firebase Cloud Messaging as a content-free ping, data on the Pi
Keeps data local, but the phone must still reach the Pi to fetch; adds a Google project, VAPID keys and push permission prompts (iOS only for installed PWAs) without delivering more than option C.
### C – Server-Sent Events from the Ktor backend, clients refetch
One long-lived HTTP GET per open list, `changed` events after commit, client refetches the full list. Built into Ktor 3 (`ktor-server-sse`), works through Caddy, auto-reconnect in the browser's `EventSource`. One-directional, which is sufficient because writes use the normal REST endpoints.
### D – WebSockets
Bidirectional, but needs its own message protocol and reconnect logic; no benefit over C here.
### E – Polling every few seconds
Simplest, but 10 clients × 1 req/2 s wastes Pi resources and still adds up to 2 s delay.

## Decision
C. It meets the ≤ 1 s target with no new component, keeps all data and rules on the Pi in Kotlin, and reuses the existing session auth. Hard constraints (runtime on the Pi, privacy) beat the tool preference, and the need behind the preference (live shared list) is fully met. The conflict is documented in design 002 (C1) and in `docs/requirements/.change-requests/002-shopping-list.md`.

## Consequences
- Events carry no data; the list endpoint is the single read path, so clients cannot drift.
- The event bus is in memory: this relies on exactly one backend instance. Scaling to several instances would require Postgres `LISTEN/NOTIFY` instead.
- Clients outside the home network need a path to the Pi (ADR 0007).
- Revisit if the stakeholder drops the "everything on the Pi" constraint via the change request.
