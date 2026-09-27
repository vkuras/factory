# Decision

- Repo state: `docs/requirements/002-ablauf-erinnerungen.md` is at status "Implemented – ready for validation", an architecture doc and an implementation report (self-validation passed) already exist, and `docs/product.md` lists 002 as "Implemented".
- "Durch bis validated" therefore does not mean re-running the whole pipeline: grooming, design and implementation are done, so the only open stage is validation.
- Entry point: spawn `factory:validator` for 002 (spawn-1.md). No groom/architect/implementer run now, and no question to the stakeholder — the downstream stages work autonomously.
- After the validator reports: if there are findings, hand them to `factory:implementer` and re-validate in a loop until 002 is clean; only if the validator raises a requirements-level change request does grooming come back into play.
- Nothing in the fixture repo was modified.
