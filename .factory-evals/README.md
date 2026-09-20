# Eval fixtures

Input for the skill evals. Everything here is hand-built and not reproducible
from a run, which is why it is tracked.

```
base/        the Taskboard product at feature 001, the starting point for every seed
bundles/     the seed repositories, one git bundle each (full history, all refs)
seeds/       the working copies, cloned from bundles/ - untracked, rebuild any time
restore.sh   clones bundles/ into seeds/
```

Each seed is a repository because the validator reads history, branch names and
what an earlier round left behind:

| Seed | Branch | What it is |
|---|---|---|
| `val-defects` | `feature/002-due-dates` | 002 with four planted defects, one of them a regression of 001 |
| `val-perf-design` | `feature/002-find-a-task` | a design whose performance argument contradicts the requirements |
| `val-round2` | `feature/002-due-dates` | round two: one finding fixed, one wrongly raised, one fix that broke something else |
| `val-clean` | `feature/002-due-dates` | a correct implementation, with eight traps that must not become findings |
| `impl-feature` | `main` | 001 plus a design for 002 that is ready to build, and nothing built yet |
| `impl-gap` | `main` | a design with two holes at architecture level: a rule that contradicts the requirements, and an interface the design points at but never defines |
| `impl-findings` | `feature/002-due-dates` | 002 implemented with one real bug, plus a validation report whose three findings are one real, one out of scope and one not reproducible |
| `coord-groom-questions` | `main` | 002 at `In grooming`: the groomer's pass left three scope-defining questions open |
| `coord-loop` | `main` | 002 after six implementer/validator cycles, with the run log that proves it and two findings still open |
| `coord-entry` | `main` | 002 at `Implemented – ready for validation`, nothing pending: the coordinator has to enter at the validator |
| `coord-change-request` | `main` | same as `coord-entry`, but with an open change request nobody ever carried to the stakeholder |
| `coord-validated` | `feature/002-ablauf-erinnerungen` | 002 `Validated` on a branch two commits ahead of `main`, clean tree: everything that is left is the push and the merge request |

After a run has written into a seed, put it back with:

```bash
.factory-evals/restore.sh
```

When a seed changes on purpose, commit inside the seed and re-cut its bundle:

```bash
git -C .factory-evals/seeds/val-defects bundle create ../../bundles/val-defects.bundle --all
```

The grading keys for these seeds live in `../.validator-workspace/keys/`, next to
the runs they grade.
