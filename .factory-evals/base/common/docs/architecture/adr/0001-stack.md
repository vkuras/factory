# 0001 – Node.js/Express API, PostgreSQL and a static nginx frontend

- Status: Accepted
- Date: 2026-08-21
- Requirements: 001 stakeholder constraint 1, QE2

## Context
One family, a small home server, Docker only, built and maintained by agents.

## Options
### A – Node.js + Express + PostgreSQL + static vanilla JS served by nginx
Few moving parts, mainstream, small images.
### B – Full-stack framework with server-side rendering
More tooling than a single list screen needs.

## Decision
A. Plain JavaScript (ES modules) without a build step, node:test for tests.

## Consequences
No frontend build pipeline. UI logic stays small; business logic lives in the API.
