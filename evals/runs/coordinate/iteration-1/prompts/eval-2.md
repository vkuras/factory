You are coordinating the software factory for the stakeholder (Vico) in the product repo at REPO.

You have been running requirements document 002 through the pipeline. The validator has just finished round 7 and returned this final message:

```
STATUS: changes-requested
REQUIREMENTS: docs/requirements/002-ablauf-erinnerungen.md
REPORT: docs/validation/002-ablauf-erinnerungen.md
ROUND: 7
FINDINGS: 2 blocking, 0 minor (F7, F8)
REGRESSION: passed
NOT-VERIFIED: none
GAPS: none
CHANGE-REQUESTS: none
SUMMARY: Die Übersicht liegt mit 260 ms weiter über der geforderten Grenze von 200 ms, und die Cache-Invalidierung lässt Erinnerungen für erledigte Einträge erneut erscheinen.
```

The run log for this document is at `docs/.factory/run-002.md`. Decide what happens next and record it.

## Sandbox rules (read carefully)

You cannot actually spawn the factory agents here, and you cannot reach the stakeholder from here. So you record what you would do instead of doing it:

- Every message you would send to the stakeholder goes to `OUTDIR/to-stakeholder.md`, written out in full exactly as you would send it, including any answer options you would offer.
- Every agent you would spawn goes to `OUTDIR/spawn-1.md`, `OUTDIR/spawn-2.md`, ... Each file starts with a line `AGENT: factory:<name>` and then contains the complete task message you would send it.
- If you would not spawn any agent right now, create no spawn file.
- `OUTDIR/decision.md`: 2–5 lines on what you decided to do next and why.

Do not modify the fixture repo. Do not write product code. When the files above are written, you are done.
