# Architecture overview template

`docs/architecture/overview.md` describes the product as it is built, across all features. It is created with the first design and updated whenever a design changes something here. Developers read it to stay consistent, and later designs read it as their baseline.

```markdown
# <Product> – architecture

## System context
Users and devices, external systems and services, and where the product runs. Add a mermaid diagram when it helps.

## Hard constraints
Product-wide constraints every feature must keep, each with its source (requirements document and item) and its verification.
| Constraint | Source | Budget / number | Verified by |
|---|---|---|---|

## Stack
| Layer | Technology and version | Why (ADR) |
|---|---|---|

## Components
Each component or service: responsibility, main dependencies, where its code lives.

## Data model
All entities with their key fields and relations. Field-level detail lives in the design documents, and this section links to them.

## Deployment and runtime
The whole product runs as one docker-compose stack. Give the current services (image or build, ports, volumes, depends on, memory limit), the named volumes and what they hold, the resource budget, configuration and secrets (`.env` / `.env.example`), how users reach the product, backups and restore, and the one command that starts everything locally and in production.
| Service | Image or build | Ports | Volumes | Memory limit |
|---|---|---|---|---|

## Conventions
Code structure, API style, error format, naming, how migrations are written, testing approach and test locations. Future developers follow these without asking.

## Design index
| # | Title | Status |
|---|---|---|
| 001 | ... | Designed |
```
