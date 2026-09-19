# Rezepte – architecture

## System context
Household members use the app in a browser on phones, tablets and laptops (installed as a PWA on phones). Everything runs on the stakeholder's Raspberry Pi 5 at home. There are no external services.

## Hard constraints
| Constraint | Source | Budget / number | Verified by |
|---|---|---|---|
| Frontend, backend and database run together in Docker on a Raspberry Pi 5 with 4 GB RAM | 001, stakeholder constraint 2 | linux/arm64 images; sum of container memory limits ≤ 1.5 GB | `docker compose config` limits; CI builds arm64 images |
| At least 10 concurrent users without noticeable slowdown | 001, QE1 | p95 < 500 ms at 10 virtual users | k6 script `loadtest/recipes.js` against the Pi |
| Kotlin | 001, stakeholder constraint 1 | Backend in Kotlin | – |
| Opened recipes readable without connection | 001, S4 | – | Playwright offline test |

## Stack
| Layer | Technology and version | Why (ADR) |
|---|---|---|
| Backend | Kotlin 2.0, Ktor 3 (Netty), JVM 21 (Eclipse Temurin, arm64) | ADR 0001 |
| Persistence | PostgreSQL 16 (alpine, arm64), Exposed ORM, Flyway migrations | ADR 0002 |
| Frontend | React 18 + TypeScript, Vite, PWA via vite-plugin-pwa (Workbox) | ADR 0003 |
| Reverse proxy | Caddy 2 (serves the frontend build, proxies `/api`, TLS with Caddy's internal CA) | ADR 0004 |

## Components
- `backend/`: Ktor REST API under `/api`. Modules: `auth`, `households`, `recipes`, `photos`, `import`.
- `frontend/`: React PWA. Routes: `/` (recipe list by category + search), `/recipes/:id`, `/recipes/:id/cook`, `/recipes/new`, `/recipes/:id/edit`, `/login`, `/invite/:token`.
- Service worker: caches the app shell and every `GET /api/recipes/:id` response and photo that was opened (stale-while-revalidate), so opened recipes work offline.

## Data model
- `household(id uuid pk, name text)`
- `app_user(id uuid pk, household_id fk, display_name text, email text unique, password_hash text)`
- `recipe(id uuid pk, household_id fk, owner_id fk app_user, title text, category text, servings int null, photo_path text null, created_at, updated_at)`
- `ingredient(id uuid pk, recipe_id fk, position int, quantity numeric(10,3) null, unit text null, name text)`
- `step(id uuid pk, recipe_id fk, position int, section text null, text text)`

## Deployment and runtime
- `docker-compose.yml` with three services: `caddy` (mem_limit 64m), `backend` (mem_limit 768m, `-Xmx384m -XX:+UseSerialGC`), `postgres` (mem_limit 512m, `shared_buffers=128MB`, `max_connections=30`). Total 1.34 GB.
- Volumes: `pgdata`, `photos`. Nightly `pg_dump` + photo rsync to a USB disk (cron on the host).
- Reachability: **only inside the home network** at `https://rezepte.home` (Caddy internal CA; root certificate installed on household devices). Not exposed to the internet.
- Auth: email + password, session cookie (HttpOnly, SameSite=Strict), 30-day sessions. Household invite via one-time link.

## Conventions
- REST, JSON, camelCase. Errors: `{ "error": { "code": "...", "message": "..." } }` with 4xx/5xx.
- Every query is scoped by the caller's `household_id` in the repository layer.
- Migrations: Flyway `backend/src/main/resources/db/migration/V<n>__<name>.sql`.
- Tests: backend with Ktor testApplication + Testcontainers Postgres; frontend with Vitest; end-to-end with Playwright (`e2e/`).
- UI texts German, stored in `frontend/src/i18n/de.ts`.

## Design index
| # | Title | Status |
|---|---|---|
| 001 | Recipe book MVP | Built |
| 002 | Shopping list ([design](design/002-shopping-list.md); ADR 0005–0007) | Designed – Firebase/VPN decision pending stakeholder confirmation |
