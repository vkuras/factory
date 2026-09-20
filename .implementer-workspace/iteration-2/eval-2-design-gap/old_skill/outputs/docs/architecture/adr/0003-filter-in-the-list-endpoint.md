# 0003 – Filter inside the list endpoint instead of a search endpoint

- Status: Accepted
- Date: 2026-09-11
- Context: 002 – Find a task

## Context
The search has to answer in under half a second for ten people over 500 tasks (QE5), and the list is already fully in memory.

## Options
### A – A separate `/api/search` endpoint
A clear name, but a second place that decides the order of the list, and a second thing to keep consistent with 001.

### B – Query parameters on `GET /api/tasks`
The browser asks the same endpoint with `q` and `open`. One code path, one order.

### C – A search index
Correct at a scale this product does not have, and a second thing to keep in sync with the store.

## Decision
B. At 500 rows a filter over an array is measured in microseconds, so anything more elaborate buys nothing.

## Consequences
- The list endpoint carries the filtering, which keeps the UI simple.
- Should the list ever reach tens of thousands of tasks, C comes back on the table.
