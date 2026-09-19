# Rezepte – architecture

## System context
Household members use the app in a browser on phones, tablets and laptops (installed as a PWA on phones), at home and – for the shopping list – in the supermarket on the mobile network. Everything runs on the stakeholder's Raspberry Pi 5 at home. Devices outside the home network reach the Pi through Tailscale (ADR 0007); the app is not exposed to the internet. There are no external services in the application itself; Tailscale's coordination service is used for network access only and never sees app data.

## Hard constraints
| Constraint | Source | Budget / number | Verified by |
|---|---|---|---|
| Frontend, backend and database run together in Docker on a Raspberry Pi 5 with 4 GB RAM | 001, stakeholder constraint 2 | linux/arm64 images; sum of container memory limits ≤ 1.5 GB; host `tailscaled` ≤ 100 MB | `docker compose config` limits; CI builds arm64 images; T-MEM-1 (002) |
| At least 10 concurrent users without noticeable slowdown | 001, QE1 | p95 < 500 ms at 10 virtual users | k6 `loadtest/recipes.js` and `loadtest/shopping.js` against the Pi |
| Kotlin | 001, stakeholder constraint 1 | Backend in Kotlin | – |
| Opened recipes readable without connection | 001, S4 | – | Playwright offline test |
| Shopping list changes reach other members live | 002, S1.2, QE2 | ≤ 1 s p95 with connection | `loadtest/sse-latency.mjs` (T-SSE-1), Playwright E2E-S1-2 |
| Shopping list viewable and tickable offline, ticks never lost | 002, S4.6, QE3 | – | Playwright E2E-S4-6a/b |
| Only household members see household data | 001 S1, 002 S1.5, QE4 | 0 cross-household reads | Integration tests AUTH-1..3 (002) |

## Stack
| Layer | Technology and version | Why (ADR) |
|---|---|---|
| Backend | Kotlin 2.0, Ktor 3 (Netty), JVM 21 (Eclipse Temurin, arm64); `ktor-server-sse` for live updates | ADR 0001, ADR 0005 |
| Persistence | PostgreSQL 16 (alpine, arm64), Exposed ORM, Flyway migrations | ADR 0002 |
| Frontend | React 18 + TypeScript, Vite, PWA via vite-plugin-pwa (Workbox); `idb` 8 for the shopping list's offline store | ADR 0003, ADR 0006 |
| Reverse proxy | Caddy 2 (serves the frontend build, proxies `/api`, TLS with Caddy's internal CA) | ADR 0004 |
| Remote access | Tailscale on the Pi host (subnet route to the Pi + LAN DNS, split DNS for `home`) | ADR 0007 |

## Components
- `backend/`: Ktor REST API under `/api`. Modules: `auth`, `households`, `recipes`, `photos`, `import`, `shopping` (list, merge rules, area assignment, SSE events; design 002).
- `frontend/`: React PWA. Routes: `/` (recipe list by category + search), `/recipes/:id` (incl. "Auf die Einkaufsliste" dialog), `/recipes/:id/cook`, `/recipes/new`, `/recipes/:id/edit`, `/einkaufsliste`, `/login`, `/invite/:token`.
- Service worker: caches the app shell and every `GET /api/recipes/:id` response and photo that was opened (stale-while-revalidate), so opened recipes work offline. Shopping list data is not cached by the service worker; it lives in IndexedDB (`rezepte-shopping`) managed by the app (ADR 0006).
- Live updates: `GET /api/shopping-list/events` (SSE), in-memory per-household event bus in the single backend instance (ADR 0005).

## Data model
- `household(id uuid pk, name text)`
- `app_user(id uuid pk, household_id fk, display_name text, email text unique, password_hash text)`
- `recipe(id uuid pk, household_id fk, owner_id fk app_user, title text, category text, servings int null, photo_path text null, created_at, updated_at)`
- `ingredient(id uuid pk, recipe_id fk, position int, quantity numeric(10,3) null, unit text null, name text)`
- `step(id uuid pk, recipe_id fk, position int, section text null, text text)`
- `shopping_line(id uuid pk, household_id fk, kind RECIPE|FREE, name, name_key, quantity numeric(10,3) null, unit null, unit_key null, area, ticked, ticked_at null, seq, revision, added_by fk null, created_at)` – snapshot lines, no FK to recipes. Details: design 002.
- `area_correction(household_id fk, name_key, area, updated_by fk null, updated_at; pk household_id+name_key)` – design 002.

## Deployment and runtime
- `docker-compose.yml` with three services: `caddy` (mem_limit 64m), `backend` (mem_limit 768m, `-Xmx384m -XX:+UseSerialGC`), `postgres` (mem_limit 512m, `shared_buffers=128MB`, `max_connections=30`). Total 1.34 GB. Host process `tailscaled` with systemd `MemoryMax=100M`. Fixed total 1.44 GB of 4 GB.
- Volumes: `pgdata`, `photos`. Nightly `pg_dump` + photo rsync to a USB disk (cron on the host).
- Reachability: `https://rezepte.home` (Caddy internal CA; root certificate installed on household devices). At home directly; elsewhere via Tailscale with the Pi advertising `/32` routes to itself and the LAN DNS server, and split DNS for `home` (ADR 0007, setup in `deploy/remote-access.md`). No port forwarding, not exposed to the internet.
- Caddy: `/api/shopping-list/events` is excluded from `encode` so SSE is not buffered.
- Auth: email + password, session cookie (HttpOnly, SameSite=Strict), 30-day sessions. Household invite via one-time link.

## Conventions
- REST, JSON, camelCase. Errors: `{ "error": { "code": "...", "message": "..." } }` with 4xx/5xx.
- Every query is scoped by the caller's `household_id` in the repository layer; ids of other households answer 404.
- Live updates: SSE event `changed` without payload; clients refetch the resource. Events are published after the transaction commits.
- Writes that apply merge rules lock the household row (`SELECT … FOR UPDATE`) first.
- Name comparison "same spelling ignoring case": `nameKey` = NFC → trim → collapse whitespace → lowercase(Locale.ROOT) (design 002, R-KEY).
- Time: `java.time.Clock` injected into services; timestamps stored as `timestamptz` UTC.
- Migrations: Flyway `backend/src/main/resources/db/migration/V<n>__<name>.sql`.
- Tests: backend with Ktor testApplication + Testcontainers Postgres; frontend with Vitest; end-to-end with Playwright (`e2e/`); load tests in `loadtest/`. Test vectors shared between backend and frontend in `shared/test-vectors/`.
- UI texts German, stored in `frontend/src/i18n/de.ts`.

Note (2026-09-19): this repository checkout contains no application code and no files for ADR 0001–0004 or a 001 design document, although they are referenced here. Where the code differs from this overview, the code is the truth.

## Design index
| # | Title | Status |
|---|---|---|
| 001 | Recipe book MVP | Built |
| 002 | Shopping list | Designed |
