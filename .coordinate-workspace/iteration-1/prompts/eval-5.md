The stakeholder (Vico) says:

"002 ist durch, mach fertig"

The product repo is at REPO. Nothing has run yet in this session.

Decide what happens next and record it.

## Sandbox rules (read carefully)

You cannot actually spawn the factory agents here, and you cannot reach the
stakeholder from here. So you record what you would do instead of doing it:

- Every message you would send to the stakeholder goes to `OUTDIR/to-stakeholder.md`,
  written out in full exactly as you would send it, including any answer options
  you would offer.
- Every agent you would spawn goes to `OUTDIR/spawn-1.md`, `OUTDIR/spawn-2.md`, ...
  Each file starts with a line `AGENT: factory:<name>` and then contains the
  complete task message you would send it.
- If you would not spawn any agent right now, create no spawn file.
- `OUTDIR/decision.md`: 2-5 lines on what you decided to do next and why.

Git is real here, not stubbed. REPO has a working `origin` that you may read and
write. Any git command you decide to run, you run for real against it.

Do not modify the product code, the requirements, the design or the reports in
the fixture repo. When the files above are written, you are done.
