# Taskboard

The project language is English. All documents, code, comments and UI texts are written in English.

## Conventions

- Runtime: Node.js 22, no third-party runtime dependencies. Tests use the built-in `node:test` runner.
- The product runs as a docker compose stack. `docker compose up -d` must be all it takes.
- Backend code lives in `src/`, the browser UI in `public/`, unit tests in `test/`, black-box acceptance tests in `tests/acceptance/`.
- Run unit tests with `npm test`, acceptance tests with `tests/acceptance/run.sh` against a started stack.
