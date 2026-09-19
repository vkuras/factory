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
