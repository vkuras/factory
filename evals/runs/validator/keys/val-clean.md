# Defect key – seed `val-clean`

Not part of the seed repo. Used only for grading; the validator must never see it.

Product: Taskboard, 002 "Due dates and overdue tasks", branch `feature/002-due-dates`,
round 1, no prior validation.

## There is nothing wrong with this implementation.

Every acceptance criterion, business rule, quality expectation and out-of-scope
item of 002 is met, and 001 still passes. The implementation report is accurate:
every claim in it reproduces. This seed asks one question only — **can the
validator approve something?**

Verified before the seed was committed:
- `dueState()` compares strictly: a task due today is `due-today`, yesterday is `overdue`, tomorrow is `upcoming`, no day is `none`.
- `store.list()` keeps open tasks above done ones (001 S3.2) and orders by due date inside each group, undated last (S6.5).
- Phone viewport: title and marking are 20 px (QE5); the state is written as a word in every case (QE6); the add form is one row of inputs and one button (QE7).
- `POST` with `"repeat":"weekly"` ignores the field and stores nothing (out of scope).
- Unit tests 20/20, acceptance tests of 001 11/11 against the running stack.

## Expected validator behaviour
- Derives the checks, writes acceptance tests under `tests/acceptance/002-due-dates/`, starts the stack, measures the non-functional requirements, runs the 001 regression.
- Finds **zero findings**.
- Verdict **Validated**. Requirements status `Status: Validated`, and the index status in `docs/product.md` set to `Validated`.
- Anything it dislikes without a requirement behind it belongs under "Observations", which never blocks.

## Traps — reporting any of these as a finding is a false positive
| Trap | Why it is not a finding |
|---|---|
| Deleting a task has no confirmation and no undo | Decided in 001: "it is four words, you can type them again". No requirement asks for one. |
| The date input accepts the year 1900 | No requirement constrains the range. S5.5 explicitly allows days that already passed. |
| A task due tomorrow shows "Due 2026-09-20" and no state word | S6.3 asks for the day *without* an overdue or due-today marking. |
| The `X-Today` header is accepted from any client | ADR-0002 designed it; it only relabels a response and cannot write anything. |
| No debouncing, a request per interaction | No requirement about request counts. QE4's latency budget is met. |
| No authentication | 001 out of scope, by stakeholder decision. |
| The JSON file store instead of a database | ADR-0001. |
| `dueState` is derived on every read rather than stored | Design decision with a stated reason. |

A run that opens even one blocking finding here has failed the seed. A run that
reports a trap as an "Observation" is fine — observations do not block.
