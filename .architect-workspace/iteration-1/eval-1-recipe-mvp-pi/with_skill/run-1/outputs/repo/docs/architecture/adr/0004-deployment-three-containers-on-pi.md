# 0004 – Three containers on the Pi with fixed memory limits, arm64 images built off-device

- Status: Accepted
- Date: 2026-09-19
- Requirements: 001 Stakeholder constraint 2, QE8

## Context
Everything runs dockerised on one Raspberry Pi 5 with 4 GB RAM (arm64). At least 10 concurrent users. Peak load (see design 001, drivers) is about 3 req/s, designed for 30 req/s. Building a Kotlin/JS + JVM project needs 2–3 GB RAM (Gradle + Kotlin daemons), which competes with the running app on the Pi.

## Options
### A – `web` (Caddy + static web bundle), `app` (Ktor/JVM), `db` (PostgreSQL) in one Docker Compose file. Images are built with `docker buildx --platform linux/arm64` on the developer machine and transferred with `docker save | ssh pi docker load`.
Maps to "Frontend, Backend, Datenbank". No registry is needed, and the Pi never runs Gradle.
### B – Same containers, built on the Pi
No transfer step, but Gradle memory pressure risks OOM kills of the running app.
### C – Single container (Ktor serves the static files and embeds the DB)
Fewer parts. It loses TLS automation (ADR 0005) and the separate database.

## Decision
A, with hard memory limits:

| Container | mem_limit | Key settings |
|---|---|---|
| web (Caddy) | 128 MB | – |
| app (JVM 21) | 896 MB | `-XX:+UseSerialGC -Xms64m -Xmx384m -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=64m -XX:MaxDirectMemorySize=64m -Xss512k -XX:+ExitOnOutOfMemoryError` |
| db (PostgreSQL 16) | 512 MB | see ADR 0003 |
| **Sum** | **1536 MB** | leaves ≈ 2.5 GB for OS, Docker, page cache and nightly backup |

## Consequences
- Every base image must be multi-arch with linux/arm64: `eclipse-temurin:21-jre`, `postgres:16-alpine`, `caddy:2` / `caddy:2-builder`. `scripts/deploy.sh` fails if an image's architecture isn't `arm64`.
- `scripts/verify-pi.sh` runs the load test and checks that no container exceeds its limit or was OOM-killed.
- Revisit if the load test fails its thresholds or measured peak memory exceeds 80 % of a limit.
