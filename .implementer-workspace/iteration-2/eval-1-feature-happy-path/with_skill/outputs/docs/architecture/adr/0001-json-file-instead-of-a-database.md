# 0001 – Store the tasks in a JSON file instead of a database

- Status: Accepted
- Date: 2026-08-16
- Context: 001 – Task list

## Context
The list holds at most a few hundred rows, must survive restarts (R2), and must run on a 4 GB office machine started with one command by a non-developer (QE2).

## Options
### A – A database service (PostgreSQL) in the compose stack
Robust and familiar, but adds a second container, a schema, migrations and roughly 150 MB of memory for a list of a few hundred rows.

### B – A JSON file on a named volume
One container, no schema, no migration tooling. Writes the whole file on every change, which is negligible at this size but would not scale to thousands of rows.

## Decision
B. The data is tiny and owned by one process, so a database buys nothing that the product needs and costs the simplicity that the stakeholder explicitly asked for.

## Consequences
- `docker compose up -d` starts the whole product.
- The store's write path is a single synchronous `writeFileSync`, so a crash can at worst lose the change that was in flight.
- A later feature with real query needs (search over thousands of tasks, per-user views) will have to revisit this.
