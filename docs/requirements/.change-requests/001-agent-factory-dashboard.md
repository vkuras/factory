# Change request – 001 Agent Factory Dashboard

- Raised by: architect, 2026-09-20
- Design: docs/architecture/001-agent-factory-dashboard.md §Requirement conflicts, ADR-0006
- Status: Open – resolved in the design, waiting for the stakeholder to confirm or overturn

## CR1 – Two repositories both produce a ticket `001`

### The two requirements

**R3 – A ticket's identity:**

> A ticket is identified by the `NNN` number of its requirements document. The dashboard does not
> show which repository a ticket comes from; the operator recognises that from the title.

**R10 / stakeholder technical constraint:**

> Which dashboard an agent reports to is set per installation, so agents in any repository can
> report to the operator's dashboard […]
>
> "die agenten könnten auch in einem anderen repo laufen sollen aber trotzdem zum dashboard
> reporten"

### Why they cannot both hold as written

Every repository numbers its requirements documents from `001`. As soon as a second repository
reports to the same dashboard — which R10 exists to allow — there are two different tickets that
both call themselves `001`.

If the number alone is the identity, the two merge: one row with two titles, two unrelated
histories in one run list, a status trail that jumps between two products, and attention rules
computed over the mixture. Stories S1 (what needs me) and S4 (one ticket's whole life) would show
something that is simply untrue, and nothing on the screen would reveal it.

### Resolution (already applied in the design)

The ticket is identified **internally** by the pair *(repository, number)*, so the two histories
stay apart. The screens keep showing only what R3 says they show: the number and the title. No
repository is displayed anywhere.

Rule applied: a hard reality of the data beats the literal wording; the *need* behind R3 — no
repository clutter, recognition by title — is met in full.

### What is lost

Two rows can show the same id, for example two tickets labelled `001` in the pipeline, told apart
only by their titles. That is the recognition mechanism R3 itself names, but the operator will see
the repetition.

### Your options

1. **Confirm.** Nothing changes; the dashboard is built as designed.
2. **Overturn by pulling "a repository indicator on a ticket" out of Later.** The data model
   already holds the repository, so this is a small, purely visual change — one extra label on the
   card and in the table. It needs a grooming round, because it changes what R3 and D2 say.
