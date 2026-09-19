# 0002 – Offline reading via PWA service worker with network-first API caching

- Status: Accepted
- Date: 2026-09-19
- Requirements: 001 S10, R9, QE4, LA2, S6, S5, OOS6

## Context
Recipes opened before on a device must open offline with photo, scaling and cooking mode (S10). Creating, editing and deleting need a connection (R9, OOS6). The kitchen Wi-Fi is poor, which means connections are often slow rather than cleanly absent. Viewers must still see fresh data when online, because edits by the owner must reach everybody (S1.3).

## Options
### A – Service worker: precached app shell; network-first with a 4 s timeout for recipe GETs, falling back to Cache Storage; cache-first for immutable photos
It works in every current browser on a secure origin. It caches exactly what was opened. The client stays simple: it just calls the API, and the SW decides.
### B – Client stores opened recipes in IndexedDB and reads them when fetch fails
More code in the UI layer. Photos would need blob handling. It still needs a SW for the app shell.
### C – Prefetch all recipes for full offline sync
More than the requirement asks ("opened before"). It adds sync logic and storage.

## Decision
A. It meets S10 with the least code and doesn't add capability. The 4 s timeout turns a hanging poor-Wi-Fi request into a fast cache fallback.

## Consequences
- Needs HTTPS on the LAN, because service workers and the Wake Lock API require a secure context (ADR 0005).
- Cached responses are marked with the header `X-Served-From: cache` so the UI can show an offline hint.
- Mutations are never cached or queued (OOS6). Failures surface to the user with input kept (R9).
- iOS Safari deletes site storage after 7 days without use unless the app is installed to the home screen. The app shows an install hint on iOS (see design 001, UI).
- Logout clears all runtime caches.
