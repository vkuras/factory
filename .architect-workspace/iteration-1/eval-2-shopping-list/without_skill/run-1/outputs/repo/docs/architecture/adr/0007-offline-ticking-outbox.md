# ADR 0007 – Offline shopping list: IndexedDB snapshot + tick outbox

- Status: Accepted
- Date: 2026-09-19
- Context: 002 S4 (view and tick without reception; nothing ticked offline is lost)

## Context
Recipes are made offline-capable by the service worker's stale-while-revalidate cache (001). The shopping list additionally needs local writes (ticks) that survive app restarts, and an optimistic view.

## Decision
- The last server snapshot is persisted in IndexedDB. The service worker treats `/api/shopping-list/**` as NetworkOnly.
- Ticks are stored as set-semantics ops `{lineId, ticked, seenQuantity}` in an IndexedDB outbox, coalesced per line, and applied on top of the snapshot. All ticks go through the outbox, online and offline.
- The outbox is flushed on SSE open, `online`, visibility change and a 30 s timer (no Background Sync; iOS lacks it). A 404 drops the op (the line was deleted or removed by finishing shopping).
- The server resolves "ticked offline while someone merged more into the line" with a split (design 002 §5.4). Last write wins between two members ticking the same line.
- Only ticking works offline. Add, delete, move and finish are disabled, since the product does not require them offline and they would need real conflict resolution.

## Consequences
- Small, testable client code, and no CRDT/sync library.
- The device must have opened the list online at least once.
- Supporting offline adds later would require a proper op log with client-generated line IDs. Idempotency keys are already in place.
