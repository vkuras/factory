# Architecture – Household Recipe App

- Covers: [001 – Recipe app MVP](requirements/001-recipe-app-mvp.md) (S1–S11, R1–R10)
- Product context: [product.md](product.md)
- Status: Ready for implementation
- Date: 2026-09-19

## 1. Summary

A **Kotlin progressive web app (PWA)** served from Viktor's Raspberry Pi 5 via Docker Compose:

- **web**: Caddy. Terminates HTTPS, serves the static PWA, proxies `/api` to the backend.
- **app**: Ktor backend (Kotlin/JVM). REST/JSON API, authentication, ownership checks, photo handling, and CLI commands for bootstrap, import and password reset.
- **db**: PostgreSQL. Recipes, members, sessions, invitations, photos.
- **backup**: nightly `pg_dump` to an external disk.

The frontend is written in **Kotlin/JS (React through JetBrains kotlin-wrappers)**. A **service worker** (also Kotlin/JS) caches the app shell and every recipe and photo a device has opened, so reading, scaling and cooking mode work without Wi-Fi. Parsing ingredient amounts, scaling and number formatting live in one **shared Kotlin Multiplatform module**. The importer, the backend and the browser all use that same code.

Why a PWA instead of native apps: one codebase covers phone, tablet and laptop on iOS and Android. Nothing has to go through an app store. The browser provides offline storage (service worker) and a way to keep the screen on (Screen Wake Lock API). We don't know which phone Viktor's wife has, and a PWA works either way.

## 2. Context and constraints

| Constraint | Source | Consequence |
|---|---|---|
| Built in Kotlin | Stakeholder | Backend Kotlin/JVM, frontend and service worker Kotlin/JS, shared code in Kotlin Multiplatform. |
| Frontend, backend and DB dockerised on a Raspberry Pi 5 with 4 GB | Stakeholder | Three containers plus a backup sidecar, all `linux/arm64`, with memory limits (§9). |
| ≥ 10 concurrent users | Stakeholder | Easy to meet at household scale. Checked with a load test (§12). |
| Poor kitchen Wi-Fi | S10, R9 | Offline reading via service worker. Network-first requests with a short timeout. Photos downscaled on the client. |
| Only household members see recipes | R1 | Every data endpoint needs a session. No public or sharing endpoints. LAN-only exposure by default. |
| German UI | Quality | All UI strings live in one Kotlin object (`Texts`). Numbers use a German decimal comma. |

**Consequence of the PWA choice: HTTPS is required.** Browsers only allow service workers and wake lock in a secure context, and `http://raspberrypi.local` does not count as one. So the Pi needs a hostname with a certificate the browser trusts (see §9, ADR-06).

## 3. Container view

```
 Phone / Tablet / Laptop (browser, PWA installed to home screen)
   ├─ UI (Kotlin/JS, React)
   ├─ Service worker (Kotlin/JS): Cache Storage for app shell, recipe JSON, photos
   └─ localStorage: unsent recipe drafts
            │ HTTPS (LAN)
            ▼
 ┌──────────────── Raspberry Pi 5, docker compose ────────────────┐
 │ web  (Caddy)   :443/:80  static PWA files, TLS, /api → app     │
 │ app  (Ktor, JVM 21)  :8080 internal only                       │
 │        + CLI: create-household, import-markdown, reset-password│
 │ db   (PostgreSQL 17) :5432 internal only                       │
 │ backup (postgres image + cron loop) → /mnt/backup              │
 └────────────────────────────────────────────────────────────────┘
```

- Only `web` publishes ports. `app` and `db` sit on an internal Docker network.
- Members see each other's changes by pulling. Every navigation to the list or a recipe fetches the network first (§7). Nothing is pushed, so there are no WebSockets. At household scale this is enough for R1 / S1 ("new recipe is there").

## 4. Code structure (Gradle multi-module, Kotlin 2.x)

| Module | Target | Contents |
|---|---|---|
| `shared` | KMP: jvm, js | API DTOs (kotlinx.serialization), `AmountParser`, `Scaler`, `AmountFormatter` (German), validation rules (title/category/servings limits), search normalisation. **All business rules that both client and server need.** |
| `backend` | JVM | Ktor server: routes, auth, sessions, services, persistence (Exposed + Flyway), photo processing, CLI entry points. |
| `markdown-import` | JVM | Parser for the legacy Markdown recipe files → `ImportedRecipe`. Used by the backend CLI. No DB access of its own. |
| `web` | JS (browser) | PWA UI: React through `org.jetbrains.kotlin-wrappers`, routing, API client, drafts, wake lock, photo downscaling. |
| `sw` | JS (browser) | Service worker, bundled as one self-contained classic script (`sw.js`). |
| `deploy/` | — | `docker-compose.yml`, `Caddyfile`, Dockerfiles, `.env.example`, backup script, operations README. |

Build: images are built for `linux/arm64` with `docker buildx` on a developer machine or CI and then transferred to the Pi (registry or `docker save | ssh`). Building Kotlin/JS with Gradle on the 4 GB Pi works but is slow and not planned.

## 5. Domain and data model

One installation = **one household**. Every member row is a household member. There is no household table (YAGNI; children only add members later).

```
member      (id uuid pk, username text unique (lower-case), display_name text,
             password_hash text, created_at)
session     (id_hash bytea pk, member_id fk, created_at, last_seen_at, expires_at)
invitation  (token_hash bytea pk, created_by fk member, created_at, expires_at,
             accepted_at null, accepted_by fk member null)
password_reset (token_hash pk, member_id fk, expires_at, used_at null)
recipe      (id uuid pk, owner_id fk member, title text, category text,
             servings int null check (servings between 1 and 99),
             photo_id uuid null fk photo, version int, created_at, updated_at)
ingredient  (recipe_id fk cascade, position int, text text,
             amount_milli bigint null, amount_to_milli bigint null,
             amount_start int null, amount_end int null, pk(recipe_id, position))
step_section(recipe_id fk cascade, position int, name text null, pk(recipe_id, position))
step        (recipe_id, section_position, position int, text text, pk(...))
photo       (id uuid pk, content_type text, width int, height int, bytes bytea, created_at)
import_run  (id pk, ran_at, owner_id, recipe_count)   -- guards "import only once"
```

Mapping of the business rules:

- **R3 Recipe content**: exactly one `category`. `servings` is nullable. There is no source column. Steps always sit in sections. A recipe without grouping has one section with `name = null`.
- **R4 Categories**: categories are **not a table**. They are `SELECT DISTINCT category FROM recipe`, so a category disappears on its own once its last recipe is gone. On save, the category is trimmed. If an existing category matches case-insensitively, its spelling is used, so "hauptgerichte" and "Hauptgerichte" don't become two groups.
- **R8 Photo**: at most one per recipe via `recipe.photo_id`. The photo is stored in Postgres (`bytea`) so that saving a recipe with its photo is a single transaction and one `pg_dump` backs up everything. Size is about 300–500 KB per photo after downscaling (§8), which is fine at household scale.
- **Ingredients keep their text exactly as written.** The amount is stored as a *marked span* in that text (`amount_start..amount_end`) plus its numeric value in thousandths (`amount_milli`, `amount_to_milli` for ranges such as `1,5–2`). Scaling replaces only that span. So `Kartoffeln mehlig (900g)` becomes `Kartoffeln mehlig (1350g)`. It is never rewritten into another format. That satisfies S11's "as written" and still allows scaling (R5).
- `version` enables optimistic locking. It matters because an edit form can start from stale data cached offline (§7).

### 5.1 Amount recognition (shared `AmountParser`)

Used by the importer, the backend (authoritative on every save) and the edit form (live preview of what will scale). Input is one ingredient line. The result is the value and the span, or none.

1. **Leading number**: the line starts with a number, optionally followed directly by a unit: `2 Eier`, `250g Hackfleisch`, `1,5 L …`, `30 ml …`, `4 Short Ribs … (ca. 1,5–2 kg gesamt)` → amount `4`. Only the leading number counts.
2. Otherwise, the **first number that is directly followed by a known unit** anywhere in the line: `Kartoffeln mehlig (900g)` → `900`.
3. Otherwise: **no amount**, e.g. `Salz`, `Pute`, `Weizenmehl zum Wenden (mit Salz und Pfeffer gewürzt)`.

Accepted number forms: integers, decimals with `,` or `.`, `1/2`, `½ ¼ ¾ ⅓ ⅔`, and ranges `a–b` / `a-b` (both ends are scaled). The unit list (for rule 2 only; the unit text itself is never changed) is g, kg, mg, ml, l, L, cl, dl, EL, TL, Prise(n), Stk, Stück, Pck, Packung, Dose(n), Bund, Zweig(e), Zehe(n), Scheibe(n), Tasse(n), Becher, Flasche(n).

### 5.2 Scaling and rounding (shared `Scaler`, `AmountFormatter`)

- `scaled = amount_milli × chosenServings ÷ recipeServings`, computed in exact integer arithmetic and then rounded **half-up to one decimal** (R5, R6). Examples: 1,5 × 6/4 = 2,25 → `2,3`. 2 × 6/4 → `3`.
- German formatting: decimal comma, no trailing `,0`. A positive amount never displays as `0`; the minimum shown is `0,1`.
- Only ingredient spans are scaled. Step text and ingredients without an amount stay unchanged.
- Scaling is **client-side state only**. It is never sent to the server and never stored (R5). It is offered only when `servings != null`. The chosen servings range from 1 to 99 and start at the recipe's servings.

## 6. API (JSON over HTTPS, prefix `/api`)

Every endpoint except login, invitation acceptance, password reset and health requires a valid session (401 otherwise).

| Method & path | Purpose | Notes |
|---|---|---|
| `POST /auth/login` | username + password → session cookie | Rate-limited per IP and username |
| `POST /auth/logout` | end session | client also clears caches and drafts |
| `GET /me` | current member | |
| `POST /invitations` | create invite link (7 days, single use) | any member may invite |
| `GET /invitations/{token}` | check validity | public |
| `POST /invitations/{token}/accept` | display name, username, password → member + session | public, single use |
| `POST /password-resets/{token}` | set new password | token only from CLI |
| `GET /recipes` | list summaries: id, title, category, ownerName, canEdit, photoId, updatedAt | client groups, sorts and searches |
| `GET /recipes/{id}` | full recipe incl. ingredients with amount spans, sections, steps, photoId, canEdit, version | |
| `PUT /recipes/{id}` | **create or update**, multipart: `recipe` (JSON) + optional `photo` + `removePhoto` flag | id is a client-generated UUID → retrying after a timeout never duplicates. Update requires owner (403) and the current `version` (409 if stale). One transaction. |
| `DELETE /recipes/{id}` | delete | owner only (403) |
| `GET /photos/{photoId}` | JPEG bytes | photo ids change on every replacement → `Cache-Control: private, max-age=31536000, immutable` |
| `GET /health` | liveness for Docker | public |

- The server does all authorisation (R1, R2). The client's `canEdit` only hides buttons.
- Ingredient amounts are always **re-parsed on the server** from the submitted text. Clients send only text.
- Validation (shared rules): title 1–200 chars, category 1–60 chars, at least one step, ingredient text ≤ 300 chars, servings 1–99 or empty, photo ≤ 10 MB before server-side processing.

## 7. Offline, connectivity and drafts (S10, R9)

Service worker strategies:

| Request | Strategy |
|---|---|
| App shell (HTML, JS, CSS, icons, manifest) | Precached at install, versioned per build. Cache-first. A new build activates on next launch. |
| `GET /api/recipes`, `GET /api/recipes/{id}` | **Network-first with a 4 s timeout, then cache.** Successful responses are stored. So every recipe that was opened is available offline, and poor Wi-Fi doesn't block the kitchen. |
| `GET /api/photos/{id}` | Cache-first (immutable). Stored on first load. |
| Everything else (writes, auth) | Network only. Never cached. |

- Scaling, cooking mode and search are pure client logic on cached data, so they work offline (S10).
- **Pruning**: when a fresh recipe list arrives, cached recipes and photos that are no longer in it are deleted, so deleted recipes vanish from devices too.
- **Offline list**: the list comes from cache. Recipes whose detail isn't cached are shown greyed out with "Offline nicht verfügbar".
- **Writes offline (R9)**: create, edit and delete are attempted. On a network error or timeout the UI shows "Keine Verbindung – Speichern ist gerade nicht möglich. Deine Eingaben bleiben erhalten." and leaves the form as it was. The form state (without the photo) is also written to `localStorage` as a draft keyed by recipe id, so a reload or a closed tab doesn't lose it. The chosen photo is kept in memory. Drafts are deleted after a successful save.
- **Stale edits**: a 409 on save shows "Das Rezept wurde inzwischen geändert" and offers to reload. The draft is kept.
- **Storage durability**: the app calls `navigator.storage.persist()`. On iOS, Safari deletes website storage after 7 days without use unless the app is **added to the home screen**. The onboarding screen and a hint in the app tell members to install it, especially on the kitchen device.
- **Logout** clears Cache Storage and drafts. All cached content is household-internal anyway.

## 8. Cross-cutting concepts

### 8.1 Identity, invitation, access (S1, R1, R2)

- **Bootstrap**: `docker compose run --rm app create-household --username viktor --name Viktor` creates the first member and prints a one-time link for setting the password. There is no open sign-up page.
- **Invite**: a logged-in member taps "Mitglied einladen", and the app shows a link (7 days, single use) to send via messenger. No email infrastructure is needed. His wife opens the link and chooses a display name, username and password. She is logged in right away.
- **Sessions**: a random 256-bit token in a cookie (`HttpOnly; Secure; SameSite=Lax; Path=/`). Only its hash is stored. Sessions have a **sliding lifetime of 365 days**, so each device logs in once. That keeps it simple enough for the success criterion.
- **Passwords**: Argon2id (m = 19 MiB, t = 2, p = 1), minimum 8 characters.
- **CSRF**: SameSite cookie, and state-changing requests must carry the header `X-Requested-With: rezepte`, which the app always sends.
- **Forgotten password**: `docker compose run --rm app reset-password --username …` prints a one-time link.
- **Ownership**: services check `recipe.owner_id == session.member_id` for PUT (update) and DELETE, and return 403 otherwise.

### 8.2 Cooking mode and wake lock (S6)

- Cooking mode is a full-screen route. It shows one step, large (base ≥ 28 px, scaling with the viewport), with the section name above it. It has large "Zurück" / "Weiter" tap zones (left and right halves) and a "Fertig" button on the last step that returns to the recipe.
- Steps are flattened across sections for navigation. Each step keeps its section name.
- The screen stays on through the **Screen Wake Lock API** (`navigator.wakeLock.request('screen')`). The lock is requested again on `visibilitychange` (browsers release it when the tab is hidden) and released when cooking mode is left. This works in current Chrome/Android, Safari/iOS ≥ 16.4 (home-screen apps reliably from iOS 18.4) and Firefox ≥ 126. If it's unsupported, cooking mode shows a short hint that the screen may turn off.

### 8.3 Photos (R8)

- Capture via `<input type="file" accept="image/*">`. Phones offer the camera or the gallery, laptops a file picker.
- **The client downscales before upload**: longest edge 1600 px, JPEG quality 0.8, drawn via canvas. This applies EXIF orientation and strips metadata. It makes uploads small enough for poor Wi-Fi.
- **The server** accepts only JPEG, PNG or WebP, checked by magic bytes (the client normally sends JPEG). It decodes the image, caps it at 1600 px again, re-encodes it as JPEG and stores it. A replaced or removed photo is deleted in the same transaction.
- The recipe view shows the photo with fixed aspect-ratio placeholders. Recipes without a photo use a layout without an image slot, not a broken image (S4).

### 8.4 List, categories, search (S2, S3)

- The list is grouped by category, with categories and titles sorted alphabetically using German collation (`Intl.Collator('de')`).
- Search runs on the client over the cached list. It is a case-insensitive substring match on the title, normalised to ignore accents and umlauts (`ö→o`, `ß→ss`), so "klosse" finds "Kartoffelklöße". An empty result shows "Keine Rezepte gefunden". Ingredients are not searched.
- The category field in the form is a text input with suggestions from existing categories (pick or type new, R4).

### 8.5 Frontend layout

- Responsive single layout: phone first, a wider reading column on tablet and laptop. Tap targets ≥ 44 px, base font 18 px in the recipe view.
- Routes: `/` (list + search), `/r/{id}` (view + scaling), `/r/{id}/kochen` (cooking mode), `/r/{id}/bearbeiten`, `/neu`, `/einladen`, `/login`, `/einladung/{token}`.
- The web manifest has `display: standalone` and German name and short name, so the app can be installed to the home screen.

## 9. Deployment on the Raspberry Pi

- `docker-compose.yml` services, with memory limits so that the whole stack stays under ~1.3 GB of 4 GB:
  - `web`: Caddy (custom build with the DNS provider module), 64 MB
  - `app`: `eclipse-temurin:21-jre`, `-Xmx320m -XX:+UseSerialGC`, limit 512 MB
  - `db`: `postgres:17-alpine`, `shared_buffers=128MB`, `max_connections=20`, limit 512 MB. The app uses a HikariCP pool of 5.
  - `backup`: nightly `pg_dump -Fc` to a bind-mounted external disk or USB stick, keeping 14 daily dumps. The Git repository has been Viktor's de-facto backup. Once it's abandoned (success criterion), the app is the only copy, so backups belong in the MVP.
- Volumes: `db-data`, `caddy-data` (certificates), `/mnt/backup` (bind).
- `restart: unless-stopped` and health checks on all services.
- Configuration via `.env`: `DOMAIN`, DNS provider API token, `POSTGRES_PASSWORD`, `IMPORT_DIR`.
- **HTTPS and reachability (ADR-06)**: by default the app is reachable **only in the home LAN** (no port forwarding) under a real hostname, e.g. `rezepte.<viktors-domain>`. Caddy obtains a Let's Encrypt certificate through the **ACME DNS-01 challenge**, so the Pi never has to be reachable from the internet. The hostname resolves to the Pi's LAN IP (local DNS entry in the router, or a public A record to the private IP; on a FritzBox, add a DNS-rebind-protection exception).
  - Alternative if Viktor has no domain or wants access away from home: **Tailscale** on the Pi and on the phones, with `tailscale serve` for HTTPS. This costs one app per device, which is extra friction for the wife.
- Recommended: run the Pi from an SSD (NVMe HAT or USB) rather than an SD card, to avoid database corruption and wear.

## 10. One-time import (S11, R10)

Run on the Pi after bootstrap:

```
docker compose run --rm -v /path/to/rezepte:/import:ro app import-markdown /import --owner viktor --dry-run
docker compose run --rm -v /path/to/rezepte:/import:ro app import-markdown /import --owner viktor
```

- **Files**: all `*.md` files recursively, excluding `README.md` and hidden or `.idea` folders. The run **aborts unless exactly 8 are found** (override `--expect N`). All text is normalised to Unicode NFC, because macOS filenames can be decomposed.
- **Category**: the parent folder, first letter uppercased (`hauptgerichte → Hauptgerichte`, `beilagen → Beilagen`, `soßen → Soßen`). Files in the root (`Shortribs.md`) → `Hauptgerichte`.
- **Parser**: a line-based state machine, because heading levels are inconsistent (`##Zutaten` without a space, ingredients written as `# 2 eier`):
  - Title = the text of the first heading line, trimmed.
  - A heading line of any level with text `Zutaten` / `Zubereitung` / `Quelle` (case-insensitive, space after `#` optional) switches the current block.
  - **Zutaten**: every non-empty line is an ingredient after stripping leading `#`, `*`, `-` markers and surrounding whitespace. The amount comes from `AmountParser`.
  - **Zubereitung**:
    - A heading starting with a number (`### 1. Rotwein reduzieren`) starts a **step**. Its text is the heading text without the number, and the following plain lines are appended as new lines of that step (Short Ribs → 6 steps).
    - A heading without a number (`### Füllung`) starts a **named section** (Pute → 3 sections).
    - A list item (`1.`, `*`, `-`) is a step.
    - Any other non-empty plain line is a step of its own, unless it belongs to a heading-step (Entenbrust → 3 steps).
    - `---` and blank lines are ignored.
  - **Quelle**: dropped (Brauhaus Gulasch YouTube link).
  - Markdown syntax is removed (list markers and their numbers, `#`, `**bold**` markers, trailing `\` hard breaks). **Words, typos, casing and punctuation are kept as written.** Step order comes from the file; duplicate or wrong numbers (Tortellini "3." twice, Serviettenknödel "2." twice) don't matter.
  - Every imported recipe gets `servings = null` and no photo.
- **Safety**: all 8 recipes are written in **one transaction**, together with an `import_run` row. If an `import_run` already exists, the command refuses to run again ("import happens once"). `--dry-run` prints each parsed recipe (category, title, ingredients with highlighted amounts, sections and steps) for Viktor to check before the real run.
- **Tests**: copies of the 8 files are test fixtures in `markdown-import/src/test/resources`, each with a golden expected result. At minimum these ingredient amounts must be recognised: `250g Hackfleisch → 250`, `Kartoffeln mehlig (900g) → 900`, `1,5 L hochwertige Rinderbrühe → 1,5`, `2 Eier → 2`, `250 ml sahne → 250`, `4 Short Ribs … → 4`. And `Salz`, `Pute` get no amount.

## 11. Architecture decisions

| # | Decision | Alternatives considered | Reason |
|---|---|---|---|
| ADR-01 | **PWA** (web app installed to the home screen) as the only client | Native Android (Kotlin) + separate iOS; Compose Multiplatform mobile | One codebase for phone, tablet and laptop on any OS. No store. Service worker and wake lock cover S6/S10. The wife's device OS is unknown. |
| ADR-02 | Frontend in **Kotlin/JS + React (kotlin-wrappers)**, DOM-based | Compose Multiplatform for Web (Wasm, canvas); server-rendered HTML (kotlinx.html + htmx) | Satisfies the Kotlin constraint. DOM rendering gives accessible, crisp, large text and native form inputs (camera, keyboard). Smaller bundle than Compose/Wasm on poor Wi-Fi. Offline scaling and cooking mode need client-side logic, which SSR doesn't provide. |
| ADR-03 | **Ktor** backend on JVM 21 | Spring Boot; Kotlin/Native | Lightweight on the Pi's memory, idiomatic Kotlin, easy CLI entry points in the same artifact. |
| ADR-04 | **PostgreSQL** in its own container, photos as `bytea` | SQLite embedded; photos on a file volume | Matches "Frontend, Backend und Datenbank dockerisiert". Transactional saves including the photo. One dump = complete backup. The data volume is small. |
| ADR-05 | **Shared KMP module** for amount parsing, scaling, formatting, validation | Separate implementations in client and server | One truth for R5/R6. The importer, the server and the edit preview recognise amounts identically. |
| ADR-06 | **HTTPS via Caddy + Let's Encrypt DNS-01, LAN-only** | Tailscale; self-signed CA installed on every device; port forwarding | Service workers and wake lock need a secure context. DNS-01 gives trusted certificates without exposing the Pi to the internet (R1). No per-device setup for the wife. |
| ADR-07 | **Own username/password per member, invite links, 365-day sliding sessions** | Passkeys only; OAuth (Google); magic-link email | No external dependency and no mail server. The invite link can go via messenger. Logging in once per device keeps it easy. Passkeys can be added later. |
| ADR-08 | Offline via **service worker HTTP caching** of what was opened, writes online-only | IndexedDB sync store; full offline editing | Exactly what S10/R9 ask for, with the least moving parts. Offline editing is explicitly out of scope. |
| ADR-09 | Ingredient = **text as written + marked amount span** | Structured `amount/unit/name` fields | Import keeps the text exactly as written (S11). Users type ingredients the way they always wrote them. Scaling touches only the number. |
| ADR-10 | **Client-generated recipe IDs + PUT** (idempotent) and **optimistic locking** | POST create; last write wins | Retrying on flaky Wi-Fi never creates duplicates. Stale cached edit forms can't silently overwrite newer data. |
| ADR-11 | **Pull, no realtime push** | WebSockets/SSE | Household scale. Network-first loads meet R1 (new recipe visible on next open). |
| ADR-12 | Nightly **backup sidecar** in the MVP | No backup | Once the Git repo is abandoned, the Pi is the only copy of the recipes. |

## 12. Quality and verification

| Requirement | How it's verified |
|---|---|
| R5/R6 scaling | Unit tests in `shared` (common tests run on JVM and JS): 4→6 with `1,5 L` → `2,3 L`, `2 Eier` → `3 Eier`, no-amount lines unchanged, `0,1` minimum, ranges. |
| S11 import | Golden tests over the 8 fixture files, plus a test that a second run refuses. |
| R1/R2 access | Ktor `testApplication` + Testcontainers Postgres: 401 without a session, 403 editing or deleting someone else's recipe, invitations are single-use and expire. |
| R4 categories | API test: deleting the last recipe of a category removes it from the list. Case-insensitive reuse. |
| R9 input kept | UI test or manual check: save with the network off → message shown, form unchanged, draft survives a reload. |
| S10 offline | Manual test script on iPhone and Android in airplane mode: a previously opened recipe loads with photo, scaling and cooking mode. An unopened one shows "Offline nicht verfügbar". |
| S6 wake lock | Manual: cooking mode open 5 min untouched on phone and tablet → the screen stays on. |
| ≥ 10 concurrent users | Gatling (Kotlin DSL) against the Pi: 10 concurrent users browsing, opening and saving for 5 min → p95 < 500 ms, no errors, containers within memory limits. |

## 13. Implementation slices (suggested order)

1. **Skeleton & deploy**: Gradle modules, empty PWA shell with manifest and service worker, Ktor `/health`, Postgres + Flyway, compose file, Caddy with HTTPS on the Pi. *Done when the empty app is installable from the phone over HTTPS.*
2. **Access (S1)**: bootstrap CLI, login/logout, sessions, invitations, reset-password CLI, auth guards.
3. **Read recipes (S2, S3, S4)**: schema, `GET` endpoints, list with categories, search, recipe view.
4. **Import (S11)**: `markdown-import` + `AmountParser`, CLI with dry run, golden tests.
5. **Scaling & cooking mode (S5, S6)**: `Scaler`/`AmountFormatter`, servings stepper, cooking mode with wake lock.
6. **Create / edit / delete with photo (S7, S8, S9, R4, R9)**: form with amount preview, multipart PUT, photo downscaling, ownership, optimistic locking, drafts, delete confirmation.
7. **Offline (S10)**: service worker caching strategies, pruning, offline indicators, storage persistence, home-screen hint.
8. **Operate**: backup sidecar, load test on the Pi, operations README (bootstrap, import, invite, restore).

## 14. Risks and assumptions

| # | Risk / assumption | Mitigation |
|---|---|---|
| A1 | **Assumption:** Viktor has or will register a domain whose DNS provider supports ACME DNS-01 (e.g. Cloudflare, Hetzner, INWX). | If not: Tailscale variant (§9). It's a deployment choice and doesn't block slices 2–7. It must be settled before slice 1 can be finished on the Pi. |
| A2 | **Assumption:** access is only needed at home (LAN). The requirements only mention the kitchen and the household. | Remote access later via Tailscale without changing the architecture. |
| A3 | **Assumption:** any member may invite (no roles, per requirements). | Easy to restrict later if children join. |
| R1 | iOS evicts website storage after 7 days if the app isn't installed to the home screen, which breaks offline reading. | Home-screen install hint, `storage.persist()`. Test on the real kitchen device. |
| R2 | Wake lock is unreliable on older iOS (< 18.4) home-screen apps. | Visible hint when unsupported. Check the kitchen device's OS version. |
| R3 | Amount recognition misreads unusual lines. | Live preview in the edit form highlights the recognised amount. Dry-run report before the import. |
| R4 | SD card corruption or wear on the Pi. | SSD recommendation, nightly backups to external media, documented restore. |
| R5 | Kotlin/JS ecosystem is smaller than plain TS/React. | Only well-maintained JetBrains kotlin-wrappers are used. No exotic UI libraries. |
