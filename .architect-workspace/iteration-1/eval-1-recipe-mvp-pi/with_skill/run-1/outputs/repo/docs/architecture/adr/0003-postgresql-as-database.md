# 0003 – PostgreSQL 16 in its own container as the database

- Status: Accepted
- Date: 2026-09-19
- Requirements: 001 Stakeholder constraint 2, QE8, R1, R4

## Context
The stakeholder wants "Frontend, Backend und Datenbank" dockerised together on a Raspberry Pi 5 (4 GB). The data volume is tiny: 8 recipes today, at most a few hundred later. There are at least 10 concurrent users with rare writes. Backups must be possible while the app runs.

## Options
### A – PostgreSQL 16 (postgres:16-alpine, arm64) as a separate container
Mainstream and well supported by Flyway and Exposed. JSONB fits the recipe aggregate. `pg_dump` makes online backups. It costs about 150 MB RAM with a tuned config, and it matches the stakeholder's picture of three dockerised parts.
### B – SQLite file inside the backend container
Fewest moving parts and lowest RAM. Single-writer locking is fine at this load. Online backup needs care (`VACUUM INTO`), and Flyway/Exposed SQLite support is less mainstream. The "database" would no longer be a part of its own, as the stakeholder described it.

## Decision
A. The 4 GB budget easily allows it (ADR 0004). It gives boring, well-documented tooling for migrations, JSONB and online backups, and it matches the stakeholder's stated deployment shape.

## Consequences
- Config tuned for the Pi: `shared_buffers=128MB`, `work_mem=4MB`, `maintenance_work_mem=64MB`, `max_connections=20`, `effective_cache_size=512MB`. Container memory limit 512 MB.
- Migrations with Flyway (`server/src/main/resources/db/migration`), run automatically at app start.
- Tests use Testcontainers with the same image.
