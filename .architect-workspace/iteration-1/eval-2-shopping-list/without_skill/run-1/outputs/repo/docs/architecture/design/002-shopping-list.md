# 002 – Shopping list: technical design

- Requirement: docs/requirements/002-shopping-list.md
- Status: Designed – ready for implementation (one stakeholder confirmation pending, see "Open points")
- Date: 2026-09-19
- ADRs: 0005 (sync on the Pi, not Firebase), 0006 (remote access via WireGuard), 0007 (offline ticking via outbox)

## 1. Summary
The shopping list is a new backend module `shoppinglist` in the existing Ktor app, stored in the existing PostgreSQL. The Pi stays the single source of truth. Changes reach other members live via Server-Sent Events (SSE). Every change sends a full snapshot of the list, which is small. Offline viewing and ticking use a snapshot kept in IndexedDB plus a local outbox of tick operations. The outbox is replayed on reconnect. Area assignment runs on the server: household corrections first, then a built-in German keyword dictionary, then "Sonstiges". Phones reach the Pi from the store through a WireGuard VPN into the home network. The app itself stays unexposed to the internet.

The stakeholder's Firebase preference is not followed. Reasoning is in ADR 0005, and it needs his confirmation (see "Open points").

## 2. Constraints and how they are met
| Constraint / quality expectation | Source | How it is met | Verified by |
|---|---|---|---|
| All containers on the Pi, ≤ 1.5 GB total limits | 001 | No new container. WireGuard runs in the host kernel. Limits stay at 1.34 GB | `docker compose config` |
| p95 < 500 ms at 10 users | 001 QE1 | Small list (< 200 lines), one row lock per household per mutation, in-process fan-out | k6 `loadtest/shopping-list.js` (new) |
| Live updates without manual refresh | 002 S1, QE | SSE snapshot after each commit. Target: other devices show the change within 1 s | Playwright two-context test |
| View and tick without reception; nothing ticked offline is lost | 002 S4, QE | IndexedDB snapshot + outbox (ADR 0007), idempotent tick API, split rule (§5.4) | Playwright `context.setOffline` test |
| List reachable from the store | 002 S1 (wife adds at home, husband in store) | WireGuard VPN into the home network (ADR 0006) | Manual acceptance on mobile data |
| Only household members see the list | 002 S1, QE | Every query and SSE channel scoped by the session's `household_id`. App not internet-exposed | Backend auth tests |
| Kotlin backend | 001 | All logic (merge, classification) in Kotlin | – |
| German UI | 001 | New texts in `frontend/src/i18n/de.ts` | – |

## 3. Components
### Backend: module `backend/.../shoppinglist/`
- `ShoppingListRoutes`: REST + SSE endpoints (§6). Auth via existing session. `householdId` always taken from the session, never from the request.
- `ShoppingListService`: transactions and business rules R1–R3, split rule, finish shopping.
- `AreaClassifier`: area resolution (§7).
- `ShoppingListRepository`: Exposed tables (§4). Every query filtered by `household_id` (existing convention).
- `ShoppingListEvents`: in-memory broadcaster `ConcurrentHashMap<UUID, MutableSharedFlow<ListSnapshot>>` keyed by household. The service publishes the snapshot **after commit**. A single backend instance, so no Postgres LISTEN/NOTIFY is needed. Revisit if the backend is ever scaled out.
- `IdempotencyStore`: dedupes add requests (§6.2).

### Frontend
- New route `/shopping-list` (page "Einkaufsliste") plus a nav entry next to the recipe list.
- Recipe view `/recipes/:id`: button "Zur Einkaufsliste" opens the add sheet (§8.2).
- `shoppingList/store.ts`: state = last server snapshot ⊕ pending outbox ops (§8.3).
- `shoppingList/db.ts`: IndexedDB (library `idb`) with stores `snapshot` and `outbox`.
- `shoppingList/live.ts`: `EventSource` on `/api/shopping-list/events`, reconnect, outbox flush.

### Service worker (vite-plugin-pwa / Workbox)
- `/shopping-list` is served by the existing app-shell navigation fallback (precached), so the page opens offline.
- `/api/shopping-list/**` is **NetworkOnly** and not in the runtime cache. Offline data comes from IndexedDB, not the SW cache. Make sure no generic `/api` caching rule matches it, and never cache the SSE stream.

### Caddy
- `/api/shopping-list/events`: `reverse_proxy` with `flush_interval -1` (no buffering). HTTP/2 is already on (TLS), so the long-lived stream does not use up browser connection slots.

## 4. Data model (Flyway `V<next>__shopping_list.sql`)
```sql
create table shopping_list (
  household_id uuid primary key references household(id) on delete cascade,
  version      bigint not null default 0            -- bumped on every mutation
);

create sequence shopping_line_position_seq;

create table shopping_line (
  id           uuid primary key,
  household_id uuid not null references shopping_list(household_id) on delete cascade,
  kind         text not null check (kind in ('RECIPE','FREE')),
  name         text not null,          -- RECIPE: ingredient name as in recipe; FREE: text exactly as entered (trimmed)
  name_key     text not null,          -- normalized key (§5.1), used for merge (RECIPE) and area memory (both)
  quantity     numeric(10,3) null,     -- RECIPE only
  unit         text null,              -- RECIPE only, as in recipe
  unit_key     text not null default '',-- normalized unit ('' = no unit), RECIPE only
  area         text not null check (area in ('OBST_GEMUESE','KUEHLREGAL','BACKWAREN','TIEFKUEHL','GETRAENKE','SONSTIGES')),
  ticked       boolean not null default false,
  position     bigint not null default nextval('shopping_line_position_seq'),  -- "order added"
  created_by   uuid null references app_user(id) on delete set null,
  created_at   timestamptz not null default now(),
  check (kind = 'RECIPE' or (quantity is null and unit is null))
);
create index shopping_line_merge_idx on shopping_line (household_id, name_key, unit_key) where kind = 'RECIPE' and not ticked;
create index shopping_line_list_idx  on shopping_line (household_id, position);

create table area_override (
  household_id uuid not null references household(id) on delete cascade,
  name_key     text not null,
  area         text not null check (area in ('OBST_GEMUESE','KUEHLREGAL','BACKWAREN','TIEFKUEHL','GETRAENKE','SONSTIGES')),
  updated_by   uuid null references app_user(id) on delete set null,
  updated_at   timestamptz not null default now(),
  primary key (household_id, name_key)
);

create table shopping_idempotency (
  key          uuid primary key,
  household_id uuid not null references household(id) on delete cascade,
  created_at   timestamptz not null default now()
);
```
- **One list per household (S1)**: `shopping_list` has `household_id` as its PK. The row is created lazily (`insert … on conflict do nothing`) at the start of every list access, so the `households` module needs no change.
- **No link to `recipe`**: lines are copies, so later recipe edits and deletes do not affect them (S2). No origin is shown (out of scope).
- Areas are code constants (enum `Area` in the R4 order). German labels live in `de.ts`. Order is enforced in code, not in the DB.
- The merge index is deliberately **not unique**. Untick and the split rule can legitimately produce two open lines with the same key (§5.3, §5.4).

## 5. Business rules in the service
All mutations run in one transaction that first does `select … from shopping_list where household_id = ? for update`. This serializes mutations per household (no merge races) and bumps `version` in the same row. At 2–4 members, contention is negligible.

### 5.1 Normalization (R2)
- `name_key = collapseWhitespace(trim(name)).lowercase(Locale.GERMAN)`. No umlaut folding and no singular/plural handling (R2: not guaranteed).
- `unit_key = collapseWhitespace(trim(unit ?: "")).lowercase(Locale.GERMAN)`. No unit synonyms, so "g" ≠ "gr" (R1 "same unit").
- For FREE lines, `name_key` is computed from the text **after stripping a leading quantity token** (regex, case-insensitive: `^\d+([.,]\d+)?\s*(x|×|stk\.?|stück|g|kg|ml|l|pck\.?|packung(en)?|dose(n)?|flasche(n)?)?\s+`). Example: "2x Milch" gets key "milch", so it hits the dictionary and remembered corrections for "Milch". The displayed text stays exactly as entered (S3). *Interpretation of "same name" in R5 for free items. Harmless to reverse (then the key is the full text).*

### 5.2 Adding recipe ingredients (S2, R1, R2, R2a, R2b)
Input: a list of `{name, quantity|null, unit|null}` already scaled by the client (§8.2). For each item, in the given order:
1. **Quantity-less item (R2b)**: if any open RECIPE line with the same `name_key` exists (any unit), add nothing. Otherwise insert a new line without quantity.
2. **Quantified item**: find the open (unticked) RECIPE line with the same `name_key` and `unit_key` and the lowest `position`.
   - Found, with a quantity: `quantity += item.quantity` (R1).
   - Found, without a quantity: set `quantity = item.quantity`. "Knoblauch" becomes "2 Knoblauch", so the quantity-less line takes on the amount. *Interpretation.*
   - Not found (including when only ticked lines match, R2a): insert a new line.
3. New lines get their area from `AreaClassifier` (§7). Merged lines keep their current area and position.

Adding the same recipe twice adds the quantities again, as R1 requires. Accidental double submits are caught by the idempotency key (§6.2), not by the merge logic.

### 5.3 Tick / untick (S4)
- Set semantics (`ticked = true|false`), not toggle, so replays are idempotent.
- Untick only flips the flag. The line returns to its original `position` among the open lines. If an open line with the same key was created meanwhile (R2a), both stay as separate lines. Later merges go into the one with the lowest position.

### 5.4 Split rule (offline ticks vs. concurrent merges, R2a)
A tick request carries `seenQuantity`, the quantity the client displayed when the user tapped. If the line is RECIPE, `ticked=true`, and the server quantity is greater than `seenQuantity` (someone merged more into it meanwhile, e.g. while the shopper was offline), the server splits:
- the existing line: `quantity = seenQuantity`, `ticked = true`;
- a new open line with the same name, unit and area and `quantity = server − seenQuantity` (new position).

This keeps what was actually bought ticked and what was added later open, as R2a intends. In all other cases the tick applies to the whole line.

### 5.5 Other mutations
- **Free item (S3, R3)**: trim the text; reject empty text or text over 200 characters (`400 INVALID_TEXT`). Always insert a new FREE line, never merged.
- **Move to area (S5)**: set `line.area`, then upsert `area_override(household_id, line.name_key) = area` (R5, household-wide). Other lines already on the list are not moved. Only later additions use the override.
- **Delete (S4)**: hard delete, no confirmation (client side). Deleting an unknown or already deleted line returns `204` (idempotent).
- **Finish shopping (S6)**: `delete from shopping_line where household_id = ? and ticked`. The list itself continues. Confirmation is a client-side dialog.

## 6. API
All endpoints are under `/api/shopping-list` and need a session. JSON is camelCase with the existing error format. **Every mutation returns the full snapshot**, so the acting device updates without waiting for SSE.

```
Snapshot = { version: number, lines: Line[] }            // lines ordered by position
Line     = { id, kind: "RECIPE"|"FREE", name, quantity: number|null, unit: string|null,
             area: "OBST_GEMUESE"|…|"SONSTIGES", ticked: boolean, position: number }
```
| Method & path | Body | Result / errors |
|---|---|---|
| `GET /` | – | `Snapshot` |
| `GET /events` | – | SSE `text/event-stream`: `event: snapshot` with the current `Snapshot` right after connecting, then after every committed change. `: ping` comment every 25 s |
| `POST /recipe-items` | `{ items: [{ name, quantity, unit }] }` (1–100 items), header `Idempotency-Key: <uuid>` | `Snapshot`; `400 INVALID_ITEMS` |
| `POST /free-items` | `{ text }`, header `Idempotency-Key` | `Snapshot`; `400 INVALID_TEXT` |
| `PUT /lines/{id}/ticked` | `{ ticked: boolean, seenQuantity: number\|null }` | `Snapshot`; `404 LINE_NOT_FOUND` (the client drops the op) |
| `PUT /lines/{id}/area` | `{ area }` | `Snapshot`; `404 LINE_NOT_FOUND`, `400 INVALID_AREA` |
| `DELETE /lines/{id}` | – | `Snapshot` (also when already gone) |
| `POST /finish` | – | `Snapshot` |

### 6.1 Grouping and ordering
The client does the grouping, since it is pure presentation. Areas appear in R4 order and empty areas are hidden. Within an area, open lines come first in `position` order, then ticked lines in `position` order.

### 6.2 Idempotency
Add requests carry a client-generated `Idempotency-Key` (one per user action, reused on retries). In the same transaction the server inserts the key. On a PK conflict it skips the mutation and returns the current snapshot. Rows older than 7 days are purged by a daily coroutine job. Without this, a network retry of "add recipe" would double quantities because of R1.

## 7. Automatic area assignment (S5, R4, R5)
`AreaClassifier.classify(householdId, nameKey): Area` resolves in this order:
1. **Household correction**: exact hit in `area_override` on `name_key` (R5; takes priority).
2. **Built-in dictionary**: `backend/src/main/resources/shoppinglist/areas-de.tsv`, lines `keyword<TAB>AREA`, loaded once at startup (~300–500 entries, a few KB):
   a. exact match on the whole `name_key`;
   b. `name_key` starts with the token `tk` or `tiefkühl` → `TIEFKUEHL`;
   c. **longest dictionary keyword that is a suffix of the last word** (keyword ≥ 4 chars), for German compounds. "Vollmilch" matches "milch" → KUEHLREGAL. "Kirschtomaten" matches "tomaten" → OBST_GEMUESE. "Weizenmehl" matches "mehl" → SONSTIGES.
3. Fallback `SONSTIGES`.

The dictionary lists singular and plural forms explicitly (e.g. "zwiebel", "zwiebeln"). Ingredients such as Mehl, Zucker and Gewürze map to SONSTIGES, because there is no baking-goods area. **Seeding:** start from the distinct ingredient names of the household's imported recipes (001 S5), so existing recipes are covered well, plus common free items (Klopapier, Kaffee, Spülmittel → SONSTIGES; Wasser, Saft, Bier → GETRAENKE).

Why no ML/LLM: no external services, nothing heavy on the Pi, and corrections (R5) handle the remainder within a few weeks. The approach is deterministic and table-testable.

## 8. Frontend behavior
### 8.1 Shopping list page (`/shopping-list`)
- Top: text field "Artikel hinzufügen" plus a button (free item). Disabled while offline.
- Area sections with headings. Tapping a line toggles tick (ticked lines are struck through and move to the bottom of their area). A trash icon on each line deletes it without confirmation. The line menu "Bereich ändern" opens a picker with the 6 areas.
- Button "Einkauf abschließen" (only enabled when ticked lines exist and online) opens a confirmation dialog, then flushes the outbox, then calls `POST /finish`.
- Empty list: a hint "Füge Zutaten aus einem Rezept hinzu oder tippe oben einen Artikel ein." (S1).
- Status indicator: "Live" when SSE is connected; "Offline – Abhaken wird später übertragen" when not, plus the number of pending ticks.
- Lines are not editable (S4). Quantities use the existing 001 quantity formatter.

### 8.2 Add-from-recipe sheet (recipe view)
- Servings stepper preset to the recipe's base servings. All ingredients are listed with scaled quantities and all are checked.
- Scaling uses **the same function the recipe view uses for 001 S3**. Import it, do not re-implement it. The client sends the already-scaled `{name, quantity, unit}` of the checked ingredients. What the user saw is exactly what gets added.
- If the recipe has no base servings (`recipe.servings` is nullable), the stepper is hidden and quantities are sent unscaled. This matches how the recipe view behaves.
- "Hinzufügen" → `POST /recipe-items` with a new `Idempotency-Key`, a toast "N Zutaten zur Einkaufsliste hinzugefügt", close. "Abbrechen" → nothing (S2). The button is disabled offline ("Hinzufügen braucht eine Verbindung").

### 8.3 Live sync and offline (ADR 0007)
- **Rendered state** = `snapshot` (last server snapshot, persisted in IndexedDB on every receipt) with pending outbox ops applied on top.
- **Ticking always goes through the outbox**, online or offline: apply optimistically, `put` the op `{lineId, ticked, seenQuantity}` into the IndexedDB outbox (one entry per line; a later toggle overwrites the earlier one), then try to flush immediately. One code path.
- **Flush**: send ops one after another with a 5 s timeout. Remove an op on 2xx or 404. On network errors or 5xx, keep it and retry on the next trigger. Triggers: SSE `open`, `online` event, `visibilitychange` to visible, and every 30 s while ops are pending. The Background Sync API is not used because iOS Safari does not support it.
- **SSE**: `EventSource` reconnects on its own. Each `snapshot` event replaces the stored snapshot. Outbox ops stay applied on top until they are acknowledged, so an older snapshot never reverts a local tick.
- **Offline cold start**: shell from the SW precache, list from IndexedDB. Requirement: the device opened the list online at least once. The page shows "Stand: <time of snapshot>".
- Delete, move, add and finish are online-only (the product does not require them offline) and are disabled while offline.
- On logout, clear the shopping list IndexedDB stores (shared devices).
- Note: the PWA must be installed to the home screen on iPhones. Otherwise Safari may evict IndexedDB after 7 days of non-use.

## 9. Remote access from the store (ADR 0006)
- WireGuard server on the Pi **host** (kernel module, `wg-quick@wg0`, UDP 51820), not in Docker. Router: forward UDP 51820 to the Pi, DynDNS name (router feature). If the router has built-in WireGuard (e.g. FRITZ!Box ≥ 7.50), that is an equivalent option and no Pi setup is needed.
- One peer per household phone. Split tunnel `AllowedIPs = <home LAN subnet>`, DNS = the home DNS that resolves `rezepte.home`. The WireGuard app runs "on demand" for mobile data and non-home Wi-Fi, so it is automatic for the shopper.
- The app, Caddy and TLS stay unchanged, and the app is still not reachable from the internet. Only authenticated WireGuard peers reach the LAN.
- Runbook: `ops/wireguard.md` (new). It covers key generation, adding/removing a peer (e.g. revoke a lost phone), and QR-code setup on the phone. Keys stay on the Pi and phones, never in the repo.
- **Without the VPN**, everything still works on home Wi-Fi. In the store the list then behaves as offline: it can be viewed and ticked, and syncs back at home. It is not live, so S1 "appears while he is in the store" is not met.

## 10. Testing
- **Backend unit**: table-driven merge tests (R1, R2 case-insensitivity, R2a ticked not merged into, R2b both directions, R3, different units, same recipe twice), split rule, normalization and free-item quantity stripping, `AreaClassifier` (override beats dictionary, suffix match, TK prefix, fallback).
- **Backend integration** (testApplication + Testcontainers): endpoints, household isolation (a user of household B gets 404 and no SSE events for A), idempotency replay, concurrent adds to the same key (no lost update), SSE delivers a snapshot after each mutation.
- **Frontend (Vitest)**: grouping and ordering, outbox coalescing, optimistic overlay, 404 drop, add sheet scaling via the shared function.
- **Playwright (`e2e/shopping-list.spec.ts`)**: two browser contexts of the same household, where adds and ticks in A appear in B within 1 s without reload; `setOffline(true)`, tick, reload page (offline cold start), `setOffline(false)`, tick visible in B; finish shopping with confirmation and cancel; empty-list hint; move area, then re-add the same name so it lands in the corrected area.
- **k6 `loadtest/shopping-list.js`**: 10 VUs, each holding an SSE connection while doing ticks and adds at a realistic rate plus `GET /`. p95 < 500 ms on the Pi.

## 11. Implementation order
1. Migration, repository, `AreaClassifier` + dictionary, service with rules, and unit tests.
2. REST endpoints, idempotency, SSE broadcaster, Caddy flush config, and integration tests.
3. Frontend list page (online), add sheet in the recipe view, i18n.
4. IndexedDB snapshot + outbox, offline UI states, SW NetworkOnly rule, Playwright tests.
5. k6 script, run on the Pi.
6. WireGuard runbook and setup on the Pi/router and phones (ops, after stakeholder confirmation).

## 12. Open points
- **Stakeholder confirmation needed: no Firebase, WireGuard instead (ADR 0005, 0006).** The product need behind "Sync am besten über Firebase" (live list, offline ticking) is fully met on the Pi. Firebase would break the existing hard constraint that everything runs on the Pi, add a second data store and auth, and move household data to Google. The honest trade-off: **the list only reaches the store if the phones have the VPN.** That needs a router port forward (or the router's built-in WireGuard) and a one-time setup on each phone that shops. Steps 1–5 do not depend on this decision. If the stakeholder insists on Firebase, only the sync layer (§6 SSE, §8.3) and hosting of the list change. Rules, classifier and UI stay.
- Interpretations to confirm in review (low impact, easy to change): quantity stripping for free-item keys (§5.1); a quantity-less line takes the amount of a later quantified add (§5.2); area corrections do not move other lines already on the list (§5.5); split rule (§5.4).
