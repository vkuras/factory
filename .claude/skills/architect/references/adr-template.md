# ADR template

Use this structure for `docs/architecture/adr/NNNN-<slug>.md`, numbered sequentially across the product and never renumbered. Write an ADR for decisions that are significant or expensive to reverse, such as the stack, persistence, auth, sync or offline strategy, deployment, scheduling, external services, and every requirement-conflict resolution. Keep it to one screen.

```markdown
# NNNN – <Decision as a short statement>

- Status: Accepted (or: Superseded by NNNN)
- Date: YYYY-MM-DD
- Requirements: the requirement IDs that drive this decision

## Context
The problem and the drivers that matter, with their numbers.

## Options
### A – <option>
How it would meet the drivers, and its downsides.
### B – <option>
...

## Decision
The chosen option and the deciding reason, in terms of the drivers.

## Consequences
What becomes easier or harder, what developers must now do or avoid, and what would make us revisit this.
```
