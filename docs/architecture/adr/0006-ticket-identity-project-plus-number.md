# 0006 – A ticket is identified internally by (project, number) and shown as its number

- Status: Accepted
- Date: 2026-09-20
- Requirements: 001 R3, R10, SC3, S1, S4, D2, Later ("A repository indicator on a ticket")

## Context

R3 says: "A ticket is identified by the `NNN` number of its requirements document. The dashboard
does not show which repository a ticket comes from; the operator recognises that from the title."

SC3 and R10 say agents in any repository report to the same dashboard. Every repository numbers its
requirements documents from `001`, so two repositories reporting to one dashboard produce two
different tickets that both call themselves `001`. That is the normal case, not an edge case: the
factory's very first ticket in every new product is `001`.

## Options

### A – Key the ticket by the number alone, as R3 reads literally
The second repository's `001` merges into the first one's: one row with two titles fighting over
it, two unrelated histories in one run list, one nonsensical status trail, and attention rules
computed over a mixture. S1 and S4 become wrong, and there is no way for the operator to notice
from the screen.

### B – Key by (project, number); display the number and the title
Histories stay separate and correct. The screens show exactly what R3 asks them to show — the
number and the title, never the repository. The one visible consequence: two rows can show the same
`001`, told apart by their titles, which is the recognition mechanism R3 itself names.

### C – Show a repository indicator
Solves it completely and is explicitly parked under "Later" (D2).

## Decision

Option B. The identity that appears on screen is the number (R3 as written); the identity that
keeps two products' histories apart is `(project_key, number)`, and it never reaches the UI.
`project_key` is derived by the reporter from the reporting repository: the `owner/repo` of its
`origin` remote, otherwise the repository directory's name, overridable per installation with
`FACTORY_PROJECT_KEY`.

This resolution is recorded as a requirement conflict in the design and as a change request in
`docs/requirements/.change-requests/001-agent-factory-dashboard.md`, because the operator can see
its consequence: two tickets may show the same id.

## Consequences

- Every query, link and route carries the project: the detail route is
  `/ticket/:project/:number`, with the project segment URL-encoded. The operator never types it.
- The pipeline, attention and analytics lists can contain two entries with the same displayed id.
  If that ever bothers the operator, the fix is the parked repository indicator, and the data model
  already holds what it needs.
- Renaming a repository or adding an `origin` remote creates a new project key, and the tickets
  reported before the rename stay under the old one. Setting `FACTORY_PROJECT_KEY` explicitly per
  installation avoids it; the README says so.
