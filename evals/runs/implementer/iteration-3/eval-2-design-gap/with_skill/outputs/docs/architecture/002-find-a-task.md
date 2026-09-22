# 002 – Find a task: design

- Requirements: docs/requirements/002-find-a-task.md
- Status: Ready for implementation
- Date: 2026-09-11

## Summary
The whole list already lives in memory, so the search is a filter over an array inside the existing `GET /api/tasks`. No new component, no index, no second request path. The browser sends the query as it is typed and re-renders what comes back.

## Drivers and constraints
- QE5: 500 tasks, 10 concurrent searchers, p95 under 500 ms.
- QE6: the container stays inside its 256 MB limit from 001.
- QE7: one field above the list, no separate screen.
- R5: nothing is stored, so the query is a request parameter and never touches the store.

## Decisions
- ADR-0003: filter in the existing list endpoint instead of adding `/api/search`. One code path, one place where the order is decided.
- The match is a **prefix match on the title, compared case-sensitively** (see Interfaces). `String.prototype.startsWith` over 500 in-memory titles is the cheapest operation that answers a search, and it keeps the endpoint free of any string normalisation on the hot path, which is what makes QE5 comfortable rather than tight.
- Debouncing is left to the browser: the field fires a request per input event, which at this size is cheaper than the timer bookkeeping.

## Components
| Component | Change |
|---|---|
| `src/search.js` | New. `matchesQuery()` and `filterTasks()`. |
| `src/app.js` | `GET /api/tasks` reads `q` and `open` and filters before answering. |
| `public/` | A search field and an "open only" checkbox above the list. |

## Data model
Unchanged. Nothing about a search is stored (R5).

## Interfaces
| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/api/tasks` | `q` (optional) | `200 {"tasks":[Task],"query":string}` |

`q` selects the tasks whose **title starts with** the value of `q`, compared **case-sensitively**: `title.startsWith(q)`. An empty or missing `q` selects every task.

## Business rules
- R4 is implemented by `matchesQuery()` as specified under Interfaces.
- R5 needs no code: the query lives in the request and the response, never in the store.

## User interface
Above the list, in one row: a search field that takes the full width and an "open only" checkbox. Every keystroke triggers a request and a re-render. When the filtered result is empty and something is being filtered, the list area shows `No task matches "<text>".` instead of the 001 empty state (S5.5). Field and checkbox follow the 001 sizes: 18 px text, 44 px row height.

## Cross-cutting concerns
No change to logging, errors or security. A query cannot write anything.

## Deployment and runtime
Unchanged: one container, one volume, the 256 MB limit from 001.

## Test strategy
- Unit tests for `search.js`: an empty query, a matching query, the case behaviour, the open filter and the combination.
- A load test at 500 tasks and 10 concurrent users is part of validating QE5; the scenario is "open the list, type a four-letter query, read the result", with think time.

## Build order
1. `src/search.js` with its unit tests.
2. The query parameters in `GET /api/tasks`.
3. The UI field, checkbox and no-match state.

## Assumptions
- 500 tasks is the realistic upper end, as QE5 states.

## Requirement conflicts
None.

## Traceability
| Requirement | Design element |
|---|---|
| S5.1 | `q` in `GET /api/tasks`, `matchesQuery()` |
| S5.2 | `matchesQuery()` |
| S5.3 | `matchesQuery()` |
| S5.4 | an empty `q` selects everything |
| S5.5 | the no-match state in the UI |
| S6.1–S6.3 | the open-only filter in `GET /api/tasks` (see Interfaces) |
| R4 | `matchesQuery()` |
| R5 | query in the request only |
| QE5 | filtering in memory, no index, no extra request |
| QE6 | no new container, no new data kept |
| QE7 | one row above the list |
| Out of scope: fuzzy matching | Not designed; the match is a plain string comparison |
| Out of scope: searching other fields | Only `title` is compared |
| Out of scope: sorting options | The order stays the one from 001 |
