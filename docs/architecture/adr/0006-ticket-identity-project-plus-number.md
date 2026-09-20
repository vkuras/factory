# 0006 – A ticket is identified by (project_key, number)

- Status: Accepted. The identity stands; the display half of the original decision ("shown as its
  number, never the repository") was overturned by the stakeholder on 2026-09-20 and is superseded
  by ADR-0007.
- Date: 2026-09-20 (revised the same day)
- Requirements: 001 R3, R10, SC3, S1, S3, S4, S5, D14, D16, D17

## Context

R3 now says: "A ticket is identified by the repository it comes from together with the `NNN` number
of its requirements document. The same number in two repositories is two different tickets with two
separate histories, always, independently of what is shown on screen."

It said something else when this ADR was first written — that the number alone is the identity and
that the repository is never shown. The architect raised the collision as CR1, resolved it by
keeping the pair internal, and the stakeholder overturned the display half of that resolution
("Kippen: Repo-Anzeige aus Later holen", D14) and then settled where and when the label appears
(D16, D17). What survives unchanged is the storage identity, which is what this ADR is about.

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

### C – Key by (project, number) and show the repository on the ticket
Same storage, and the collision also disappears from the screen. This is what the stakeholder chose
(D14); how it is displayed is ADR-0007.

## Decision

Option C, which is option B plus a display rule. The identity that keeps two products' histories
apart is `(project_key, number)`, in the schema, in every query and in the detail route.
`project_key` is derived by the reporter from the reporting repository: the `host/owner/repo` of its
`origin` remote, otherwise the repository directory's name, overridable per installation with
`FACTORY_PROJECT_KEY`. The operator never types it.

Whether and how that key is rendered is a separate decision, because it changed once and may change
again: ADR-0007.

## Consequences

- Every query, link and route carries the project: the detail route is
  `/ticket/:project/:number`, with the project segment URL-encoded, and a short `/ticket/:number`
  form that is used in links while only one repository has reported (ADR-0007). The operator never
  types either.
- Two entries can carry the same number; from the second repository on they are told apart by the
  label of ADR-0007, and before that there is only one repository and nothing to tell apart.
- Renaming a repository or adding an `origin` remote creates a new project key, and the tickets
  reported before the rename stay under the old one. Setting `FACTORY_PROJECT_KEY` explicitly per
  installation avoids it; the README says so.
