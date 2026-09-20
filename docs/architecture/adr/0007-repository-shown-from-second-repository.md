# 0007 – The repository is shown on every ticket from the moment a second one has reported

- Status: Accepted
- Date: 2026-09-20
- Requirements: 001 R3, R8, R12, S1.2, S1.5–S1.8, S3.2, S3.4, S4.1, S5.4, S6.8, D14, D16, D17,
  Out of scope ("a repository indicator while only one repository has ever reported")

## Context

The stakeholder overturned CR1's resolution and then answered the two questions it left open:
the repository belongs "überall, wo ein Ticket vorkommt" (D16) and it appears "erst ab dem zweiten
Repo" (D17). R3 turns that into four statements the design has to satisfy at once:

- with one reporting repository, nothing about a repository is visible anywhere (S1.7);
- from the first ticket of a second repository, every ticket shows its repository on all five
  places a ticket is rendered — including tickets stored before that moment (S1.8, D16);
- it never disappears again, because the older tickets stay in the history forever (R8);
- nothing is lost or rewritten when it starts being shown, and the change becomes visible on the
  next page load, because the page is a snapshot (R12).

The numbers are small: a handful of repositories, a few hundred tickets, one render per page load
with a budget of 300 ms (QE2).

## Options

### A – A flag the operator sets
Contradicts D1 (the dashboard only shows), needs a write path from the browser, and asks the
operator to know something the dashboard already knows.

### B – Derive it per request from the stored data: `count(distinct repository) >= 2`
No new state, no migration, no moment at which something has to be rewritten: the repository has
been part of every ticket's key since the first row (ADR-0006), so the flip only changes what the
templates render. It is a latch by construction, because nothing is ever deleted (R8). One count
per request over a table with as many rows as there are repositories.

### C – Store a `show_repository` flag when the second repository first reports
Same result, but it introduces a stored fact that can disagree with the data, a moment where
something is written to every existing ticket, and a way for a restore or a manual edit to leave
the flag wrong.

## Decision

Option B, with its own table so that "has ever reported" is exactly what is counted.

- Every ingest call upserts `repository(project_key, first_seen_at, last_seen_at, repo_path)`
  before it touches anything else. A report that is rejected (bad token, malformed meta) stores
  nothing, so it does not count.
- `showRepository = (select count(*) from repository) >= 2`, evaluated once per request and passed
  into the templates.
- Every place a ticket id is rendered goes through one template partial, so the five places of D16
  cannot drift apart: attention card, calm chip, pipeline card, analytics row, detail head.
- The label is the repository's short name, disambiguated only when it collides: last segment of
  the key, else the last two segments, else the whole key. The full key is the `title` attribute.
  This answers LTA "what name a repository is shown under": the operator recognises `factory`, not
  `github.com/vkuras/factory`, and never types either.

## Consequences

- No migration, no backfill, no rewrite: S1.8's "no ticket and no part of its history is lost or
  changed" holds because nothing is written when the flag flips.
- The switch is invisible until the next page load, which is what R12 prescribes. A test asserts
  both states (T-REPO-2, T-REPO-3) and a third asserts that the stored rows are untouched
  (T-REPO-4).
- Adding a repository can change another repository's label from `factory` to `vkuras/factory`.
  That is the point — two labels that read the same would not tell tickets apart — and it is
  deterministic, so two tabs never disagree.
- Deleting a `repository` row would turn the label off again. Nothing does, and T-DATA-1 forbids
  `DELETE FROM` anywhere in the source.
- One more line in the log (`repository_first_seen`) explains, after the fact, why labels appeared.
