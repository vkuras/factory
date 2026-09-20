# Implementation report template

Use this structure for `docs/implementation/NNN-<slug>.md`. The validator reads it before looking at anything else, so write it for someone who will check every claim. Update the same file every round (after gaps are resolved or findings are fixed), and keep earlier rounds' finding answers.

```markdown
# NNN – <Title>: implementation

- Requirements: docs/requirements/NNN-<slug>.md
- Design: docs/architecture/NNN-<slug>.md
- Status: Ready for validation | Needs architect | Failed
- Branch: <branch>, commits <first>..<last>
- Date: YYYY-MM-DD
- Round: 1 (increase with every handover)

## What was built
Per build-order slice: what now exists, and where the code lives. Say explicitly if a slice or part of one isn't done, and why.

## How to run
The exact commands to start the product from a fresh clone (`cp .env.example .env`, `docker compose up -d`, ...), the URLs and ports, and test users or seed data if any.

## Traceability
Every row of the design's traceability table:
| Requirement | Implemented in | Test | Result |
|---|---|---|---|
| S1.1 | backend/src/... | backend/test/...::"adds item" | Passed |
| QE2 | compose memory limits | Self-validation 7, load test | Passed: p95 180 ms |
| Out of scope: <item> | Not built | – | – |

## Self-validation
| # | Check | Command | Result | Evidence |
|---|---|---|---|---|
| 1 | Build + lint | ... | Passed | ... |
| 2 | Tests | ... | Passed: 142 passed, 0 failed, 0 skipped (before: 0 skipped) | |
| 4 | Stack starts | docker compose up -d | Passed: all 3 services healthy in 18 s | |
| 5 | S1 main flow | curl ... | Passed | 201, item visible in GET |
| ... | | | | |

### Not run
Checks that couldn't run in this environment, with the exact reason and error. "None." if everything ran.

## Implementation choices
Notable implementation-level decisions the design left to developers (a library, a structure), each with a one-line reason. No architecture decisions: those went to the architect as gaps.

## Tests changed
Existing tests you modified or removed, and why. "None." if there are none.

## Open gaps
The gaps still open in docs/architecture/.gaps/NNN-<slug>.md, and what each one blocks. "None." if there are none.

## Validator findings
### Round <n>
| Finding | Classification | Answer | Evidence |
|---|---|---|---|
| F1 | Bug | Fixed in <commit> | Regression test ...::"...", now passes |
| F2 | Not a defect | Not built: contradicts design §Interfaces "..." | Quote |
| F3 | Design gap | Sent to architect as G4 | |
```
