# 001 – Task list MVP: design

- Requirements: docs/requirements/001-task-list-mvp.md
- Status: Implemented and validated
- Architecture: docs/architecture/overview.md

## Summary
One table `tasks`, a JSON API under `/api`, and a single static page. See overview.md for the stack and the compose stack.

## Interfaces
- `GET /api/tasks` → 200, open tasks `[{id, title, dueDate: 'YYYY-MM-DD'|null, done, createdAt}]`, sorted `due_date ASC NULLS LAST, id ASC`.
- `POST /api/tasks` `{title, dueDate?}` → 201 task; 400 `{error}` with the German message on invalid title or date.
- `POST /api/tasks/:id/done` → 200 task; 404 `{error: 'Aufgabe nicht gefunden.'}`.
- `GET /api/health` → 200 `{status: 'ok'}` when the database is reachable.

## Traceability
| Requirement | Design element | Verified by |
|---|---|---|
| S1.1–S1.3 | POST /api/tasks, validation.js | api/test/validation.test.js, tests/acceptance/001-task-list-mvp |
| S2.1, S2.2 | GET /api/tasks | tests/acceptance/001-task-list-mvp |
| S3.1 | POST /api/tasks/:id/done | tests/acceptance/001-task-list-mvp |
| QE1 | German texts in web/public | tests/acceptance/001-task-list-mvp |
