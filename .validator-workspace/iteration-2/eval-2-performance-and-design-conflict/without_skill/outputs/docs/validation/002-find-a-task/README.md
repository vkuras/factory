# 002 – validation evidence

## load.mjs
The QE5 load harness. 10 concurrent clients, 200 searches each, 15 ms think
time, four-letter queries, every third search also with `open=true`.

```
node scripts/seed.js 500 http://localhost:8123
node docs/validation/002-find-a-task/load.mjs http://localhost:8123 10 200
```

## Raw measurements (2026-09-19)

Container (`docker compose -p tb-e2b-ns`, port 8123), 500 tasks, as built:
```json
{"requests":2000,"errors":0,"wallSeconds":3.7,"p50ms":2.9,"p95ms":5.3,"p99ms":9.4,"maxms":28.1}
```
Memory during that run: `tb-e2b-ns-app-1  59.58MiB / 256MiB` (QE6).

A/B on the host, same data, same profile, only `matchesQuery()` swapped:

| Match rule | p50 | p95 | p99 | max | errors |
|---|---|---|---|---|---|
| `title.startsWith(q)` (as built) | 1.2 ms | 2.1 ms | 3.2 ms | 30.0 ms | 0 |
| `title.toLowerCase().includes(q.toLowerCase())` (as required by R4) | 1.2 ms | 2.3 ms | 4.2 ms | 28.2 ms | 0 |

Conclusion: the match rule R4 asks for costs ~0.2 ms at p95 over 500 tasks and
meets QE5 with a factor of roughly 215 to spare. The design's performance
argument for a case-sensitive prefix match does not hold.

Browser, end to end (input event to the re-rendered list, 500 rows, 60 samples):
p50 33.3 ms, p95 33.9 ms, max 36.0 ms.

## Screens
Phone viewport 375x812, 500 tasks of which 50 contain "milk", typed `milk`:
the list area shows `No task matches "milk".` — the defect of F1/F2, in the
stakeholder's own example.
