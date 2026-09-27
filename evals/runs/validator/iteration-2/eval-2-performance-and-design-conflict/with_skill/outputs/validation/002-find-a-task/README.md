# Evidence for the validation of 002 – Find a task (round 1)

Stack: `docker compose -p tb-e2b-ws up -d`, published on port 8122, 500 tasks
seeded through the API with `tests/acceptance/002-find-a-task/perf/seed.js`.

| File | What it shows |
|---|---|
| `qe5-k6-summary.txt` | QE5 load test: 10 concurrent searchers, 500 tasks, 3 minutes. |
| `qe6-docker-stats.txt` | QE6 memory samples of the app container during that load test. |
| `match-rule-cost.txt` | Cost of the designed match rule against the required one over 500 titles. |
| `ui-measurements.md` | QE7 and the UI states, measured in the rendered page at 375x812. |

## F1 in one command

```
$ curl -s 'http://localhost:8122/api/tasks?q=milk'
{"tasks":[],"query":"milk","openOnly":false}

$ curl -s 'http://localhost:8122/api/tasks?q=Milk'
{"tasks":[{"id":3,"done":false,"title":"Milk bill"}],"query":"Milk","openOnly":false}
```

With "Buy Milk", "Order milk crate" and "Milk bill" in the list, the
stakeholder's own demonstration ("milk") returns nothing.
