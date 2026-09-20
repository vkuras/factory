# Change request – 001 Agent Factory Dashboard

- Raised by: architect, 2026-09-20
- Design: docs/architecture/001-agent-factory-dashboard.md §Requirement conflicts, ADR-0006
- Status: Answered – CR1 overturned by the stakeholder on 2026-09-20, groomed into requirements 001
  (D14). The design must be revised.

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

## Stakeholder answer (2026-09-20)

Option 2, verbatim: "Kippen: Repo-Anzeige aus Later holen".

Groomed into `docs/requirements/001-agent-factory-dashboard.md`: R3 rewritten, D2 superseded by
D14, the Later entry removed, and the repository added to the acceptance criteria of S1, S3, S4 and
S5. The internal identity `(repository, number)` from ADR-0006 stands; what changes is that the
repository is now shown on screen.

Two points of that pass were the groomer's own and were put back to the stakeholder in a follow-up
round; both are now answered and groomed into the same document (D16, D17):

- Where the label belongs: "Überall, wo ein Ticket vorkommt" — everywhere a ticket appears, as the
  groomer had assumed (D16).
- When it is shown: "Erst ab dem zweiten Repo" — **not** always, as the groomer had assumed. While
  only one repository has ever reported, no label is shown; from the first ticket of a second
  repository it appears on every ticket everywhere, including tickets stored earlier, and it stays
  from then on (D17). The design must follow this, not the earlier "always".

The requirements document is `Groomed – ready for architecture`.

In the same round the stakeholder said: "Der coordinator wird in der zukunft abgeschaltet und durch
shell script ersetzt ich will mich nicht auf den verlassen." That became R13 and D15: reporting
must not depend on the coordinator. It affects the design's hook mechanism, not what the dashboard
shows. In the follow-up round the stakeholder limited its reach: agents the operator starts by hand
in a chat (for example `/architect`) do **not** have to reach the dashboard — "nein" (D18). R13
covers whatever drives the pipeline, today's coordinator or its shell-script replacement.
