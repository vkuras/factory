# 0001 – Kotlin everywhere: Ktor server, Kotlin/JS React web app, shared Kotlin module

- Status: Accepted
- Date: 2026-09-19
- Requirements: 001 Stakeholder constraint 1 (Kotlin), QE1, LA3, S5, R5, R6, S10

## Context
The stakeholder wants the app "in Kotlin". It must be usable on phones, tablets and laptops (QE1). The household's phone platforms are unknown (Android and iOS both possible). Scaling (R5/R6) and cooking mode must work offline (S10), so the scaling rule has to run on the device. A server is needed anyway: one shared data set for all members (R1, LA7).

## Options
### A – Ktor (JVM) server + Kotlin/JS web app (React via kotlin-wrappers) + shared Kotlin Multiplatform module
One web client for every device. All hand-written code is Kotlin, including the service worker (Kotlin/JS). The shared module (common code, compiled to JVM and JS) holds DTOs, validation and the scaling rule, so server and client use the same tested code. Downside: kotlin-react is less widespread than plain React/TypeScript.
### B – Native Android app (Kotlin/Compose) + Ktor server
Best Android experience. It doesn't work on iPhones, and laptops would still need a web UI, so there are two clients to build.
### C – Compose Multiplatform for Web (Wasm) + Ktor
All Kotlin, single UI toolkit. It renders on a canvas, which means a multi-MB first download over poor Wi-Fi, weaker text rendering and accessibility, and a younger toolchain.
### D – Spring Boot instead of Ktor as server
Very mainstream, but it has a larger memory footprint and slower start on the Pi. Its extra features aren't needed.

## Decision
A. It is the only option that serves every device with one client and keeps the whole codebase in Kotlin. React's component and state model is mainstream, and kotlin-wrappers is maintained by JetBrains. Ktor keeps the JVM footprint small for the 4 GB Pi (ADR 0004).

## Consequences
- Gradle multi-module build: `shared` (KMP: jvm + js), `server` (Ktor), `web` (Kotlin/JS React), `web-sw` (Kotlin/JS service worker), `e2e` (Kotlin + Playwright).
- Business rules R5/R6, amount parsing and recipe validation live only in `shared`. Server and client never reimplement them.
- Off-the-shelf infrastructure (Caddy, PostgreSQL) isn't "our code" and doesn't conflict with the Kotlin constraint.
- Revisit if a native feature a browser can't provide becomes a requirement.
