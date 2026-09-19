# Validation report template

Use this structure for `docs/validation/NNN-<slug>.md`. The implementer reads it and fixes every finding without being able to ask you, so each finding must reproduce from its steps alone. Update the same file every round, and keep the earlier rounds.

```markdown
# NNN – <Title>: validation

- Requirements: docs/requirements/NNN-<slug>.md
- Design: docs/architecture/NNN-<slug>.md
- Implementation report: docs/implementation/NNN-<slug>.md
- Verdict: Validated | Changes requested | Blocked – waiting for architecture | Blocked – waiting for requirements | Blocked by environment | Escalated
- Round: 1
- Validated commit: <sha> on <branch>
- Date: YYYY-MM-DD

## Summary
Two or three sentences: the verdict, open findings by severity, the regression result, and anything that couldn't be verified.

## Open findings
### F1 – <short title>
- Requirement: S2.3 – "<verbatim requirement text>"
- Severity: blocking | minor
- Classification: implementation | design (gap G<n>) | requirements (change request)
- Steps to reproduce:
  1. Fresh stack: `docker compose up -d`
  2. ...
- Expected: ...
- Actual: ... (evidence: `docs/validation/NNN-<slug>/f1-screenshot.png`, response excerpt, measurement)
- Test: tests/acceptance/NNN-<slug>/...::"S2.3 ..."
- Status: Open (round 1)

## Coverage
Every entry of the check list:
| Requirement | Check | Result | Evidence |
|---|---|---|---|
| S1.1 | Acceptance test "S1.1 ..." | Passed | |
| R2 | Acceptance tests with the 5 examples + 3 boundary cases | Failed → F1 | |
| QE1 (10 concurrent users) | k6: 10 VUs, 5 min, p95 < 500 ms | Passed: p95 210 ms, 0 % errors | perf/summary.txt |
| QE3 (large text) | Font size on phone viewport ≥ 20 px (design §UI) | Passed: 22 px | screens/list.png |
| Out of scope: <item> | Not present in UI or API | Passed | |

## Regression
- Full test suite: <passed/failed/skipped counts>
- Acceptance tests of earlier documents: <per document: passed/failed>
- Product-wide constraints re-checked: <which, results>

## Not verified
Requirements that couldn't be verified, with the reason (environment, tool missing). "None." if there are none. Anything listed here prevents the verdict "Validated".

## Observations
Things that no requirement covers but that you noticed, such as UX roughness or maintainability. They're non-blocking and not findings. "None." if there are none.

## Closed findings
| Finding | Round opened | Round closed | How |
|---|---|---|---|
| F2 | 1 | 2 | Fixed, verified with its reproduction steps |
| F3 | 1 | 2 | Withdrawn: the implementer's quote of design §X is correct |
```
