# 002 – validation evidence

## Round 2 (2026-09-19, commit 1720c13)

The stack was started with `PORT=8131 docker compose -p tb-e3-ns up -d --build`
and driven over HTTP and in a browser. No binary screenshots are kept; the
measurements below are what the checks produced.

### F4 – done task above the open ones
`GET /api/tasks` with `X-Today: 2026-09-19`, after creating four tasks:

```
DONE | 2026-01-01 | overdue  | DONE due 2026-01-01
open | 2026-09-18 | overdue  | open overdue 2026-09-18
open | 2026-12-24 | upcoming | open due 2026-12-24
open | null       | none     | open no date
```

The crossed-out row is first. Expected: both open dated rows above it.

### F5 – add form on a phone
Top offsets of the three children of `#new-task`:

- viewport 401 px: title 97, date 97, button 147 → two lines
- viewport 375 px: title 97, date 147, button 147 → two lines

### F6 – row overflow on a phone
Row "open overdue 2026-09-18": `scrollWidth` 385 px against `clientWidth` 358 px.
The Delete button's right edge lands on the viewport edge and is clipped; the
document itself does not scroll sideways.

### QE5 / QE6
Computed font size of `.title` and `.due` on a phone viewport: 20 px each.
Marking texts: "Overdue 2026-01-01", "Due today ...", "Due 2026-12-24" — the
word is always present, the colour only reinforces it.

### Resources and restart
`docker stats`: 26.12 MiB of 256 MiB. `docker compose down` + `up -d`: healthy
after 6 s, all four tasks and their due dates still there.

## Round 1
Placeholder for round-1 evidence (screenshots).
