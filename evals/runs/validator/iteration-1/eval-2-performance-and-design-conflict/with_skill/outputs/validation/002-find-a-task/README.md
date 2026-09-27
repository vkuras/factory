# 002 – Find a task: evidence (round 1)

Stack under test: `docker compose -p tb-e2-ws up -d`, published on port 8120,
500 tasks seeded, image built from commit `6616b98`.

| File | What it shows |
|---|---|
| `f1-match-rule.txt` | API responses for the requirement's own examples (S5.2, S5.3, R4) |
| `f2-request-amplification.txt` | Requests per keystroke after three "mark as done" clicks |
| `qe5-load-test.txt` | k6 run: 10 concurrent searchers, 500 tasks, 3 min |
| `qe6-memory.txt` | `docker stats` samples during the load test, OOM/restart check |
| `ui-phone-list.png` | The list at a 375x812 phone viewport (QE1, QE7) |
