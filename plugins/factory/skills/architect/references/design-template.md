# Design document template

Use this structure for `docs/architecture/NNN-<slug>.md`. Write for a developer agent who never saw the conversation and can't ask. It has only this file, the requirements document, `overview.md` and the code. Drop a section only if it truly has nothing in it. Keep "Assumptions" and "Requirement conflicts" even when they are empty ("None."), because an empty section tells the reader that none exist.

```markdown
# NNN – <Title>: design

- Requirements: docs/requirements/NNN-<slug>.md
- Status: Designed – ready for implementation
- Date: YYYY-MM-DD
- Architecture: docs/architecture/overview.md

## Summary
Three to five sentences: what gets built and the key technical choices.

## Drivers and constraints
The requirements that shape the architecture, quantified.
| Driver | Source | In numbers | How the design meets it | Verified by |
|---|---|---|---|---|
| e.g. 10 concurrent users on 4 GB RAM | Stakeholder constraint 1, QE3 | 10 users × 1 req/2 s peak = 5 req/s; memory limits total 1.6 GB | ... | Load test T-LOAD-1 |

## Decisions
One line per decision with its reason, linking the ADR where one exists.

## Components
New and changed components, their responsibilities and how they interact. Add a mermaid diagram when there are more than two components.

## Data model
Per entity or table: fields with types, nullability, defaults, constraints, indexes, and ownership/visibility rules. For a feature, also the migration from the current schema and what happens to existing data.

## Interfaces
- API: per endpoint, the method, path, who may call it, the request and response shape, and error cases with status codes and user-visible effect.
- Jobs and events: the trigger, what runs, idempotency, and what happens after a missed or duplicate run.
- External services: what is used, credentials and config, failure and retry behaviour, limits.

## Business rules
Per rule (R1, …): the exact algorithm or decision logic, edge cases, and worked examples. Take the examples from the requirements and add boundary cases. These examples become test cases.

## User interface
Per screen or view: purpose, content, actions, navigation, states (empty, loading, offline, error, no permission), texts in the UI language where the requirements give them, and the stories it serves.

## Cross-cutting concerns
Authorization, offline behaviour and sync, concurrency, time and locale, files and media, error handling, observability, security. Cover only what applies (see references/concerns.md).

## Deployment and runtime
What changes in how the product is built, configured and run.

### Compose stack
The complete plan for `docker-compose.yml`. For a feature, list only the changed or new services and say that the others stay unchanged. If nothing changes, write "No change to the compose stack."
| Service | Image or build | Ports (internal / published) | Volumes | Depends on | Healthcheck | Memory limit | Restart |
|---|---|---|---|---|---|---|---|

- Environment and secrets: each variable with its purpose. Secrets come from `.env` (not committed), and every variable is listed in `.env.example`.
- Dockerfiles: base image and pinned version, build stages, and the runtime user for each built service.
- Startup: the start command (`docker compose up -d`), how migrations run, and the start order.
- Backups: which volumes are backed up, how and how often, and how to restore them.

### Resource budget
Include it when there is a constraint on resources. The limits match the compose memory limits.
| Component | Limit | Expected use | Notes |
|---|---|---|---|

## Test strategy
Test levels and tools, how acceptance criteria map to automated tests, test data, and the verification of every hard constraint (load test scenario and pass threshold, memory check, target-platform build).

## Build order
Slices, each producing a runnable and testable increment.

## Assumptions
Places where the requirements were silent about user-visible behaviour, what you chose and why. "None." if there are none.

## Requirement conflicts
"None." Otherwise, per conflict: both requirements quoted verbatim, why they can't both hold, the resolution and the rule applied, what is lost, and the change-request file.

## Traceability
Every item of the requirements inventory. There are no empty cells.
| Requirement | Design element | Verified by |
|---|---|---|
| S1.1 | ... | ... |
| R1 | ... | ... |
| QE1 | ... | ... |
| Stakeholder constraint 1 | ... | ... |
| Left to architecture 1 | ... | ... |
| Out of scope: <item> | Not built | – |
```
