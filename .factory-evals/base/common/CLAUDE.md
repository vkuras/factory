# Chores
Household task list for one family. Project language is English (code, docs, commits); the UI is German.
- Start: `cp .env.example .env && docker compose up -d`, then open http://localhost:8080
- API unit tests: `cd api && npm test` (node:test, no database needed)
- Acceptance tests (need the running stack): `tests/acceptance/run.sh` (BASE_URL defaults to http://localhost:8080)
