# 002 – Evidence and raw measurements (round 1)

Stack: `PORT=8121 docker compose -p tb-e2-ns up -d --build`, host Node 24, 500 seeded tasks (100 done).

## F1 – The match rule, observed

```
GET /api/tasks?q=milk  ->  {"tasks":[],"query":"milk","openOnly":false}
GET /api/tasks?q=Milk  ->  {"tasks":[{"id":3,"done":false,"title":"Milk bill"}], ...}
GET /api/tasks?q=Buy   ->  {"tasks":[{"id":1,"done":false,"title":"Buy Milk"}], ...}
```
Tasks present: "Buy Milk", "Order milk crate", "Milk bill", "Call the supplier".
R4 requires all three milk titles for `q=milk`.

## F1 – Cost of the required match (micro-benchmark, 500 titles, 10 000 iterations)

```
startsWith (as designed)     2.3 us per search over 500 tasks
toLowerCase().includes()    14.3 us per search over 500 tasks
```
QE5 budget: 500 000 us. The required rule uses 0.003 % of it.

## F2 – Listener growth in public/app.js (measured in the browser)

`window.fetch` counted per `input` event on the search field:

```
directly after page load        -> 1 request per keystroke
after 3 checkbox "change"s      -> 4 requests per keystroke
```

## F3 – scripts/seed.js

```
$ node scripts/seed.js 500 http://localhost:8121
SyntaxError: Unexpected token '||'   (?? mixed with || without parentheses)
```

## QE5 – Load, 10 concurrent searchers, 500 tasks

```
{"requests":2000,"clients":10,"amplify":1,"errors":0,
 "p50":"3.1","p95":"5.2","p99":"10.8","max":"37.4","wall_s":"4.8"}
```
Amplified variant (10 requests per keystroke, simulating F2 after nine ticks):
```
{"requests":10000,"clients":10,"amplify":10,"errors":0,
 "p50":"2.3","p95":"6.2","p99":"34.6","max":"81.1","wall_s":"2.5"}
```

## QE6 – Memory

```
tb-e2-ns-app-1 26.48MiB / 256MiB   (during the load run)
tb-e2-ns-app-1 25.98MiB / 256MiB   (after)
```

## QE7 / S5.5 – UI at 375x812

```
searchFont 18px, row height 44px, search field above the list, no horizontal overflow
no-match message shown: No task matches "zzzz".   (001 empty state hidden)
```

## Suites

```
npm test                        15 passed, 0 failed, 0 skipped
acceptance 001-task-list        11 passed, 0 failed
acceptance 002-find-a-task       8 passed, 4 failed (S5.2, S5.3 x2, S6.2)
```
