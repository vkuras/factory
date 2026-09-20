Hi Vico,

002 (Ablauf-Erinnerungen) is done and closed out:

- Validator round 2 passed with 0 open findings (the F1 month-boundary bug from
  round 1 was fixed and verified). Full regression suite is green (31 tests).
- I merged `feature/002-ablauf-erinnerungen` into `main` (fast-forward, no
  conflicts) and pushed `main` to origin. `main` now includes the reminder
  scheduler, its acceptance tests, and the validation report.
- `docs/product.md` already lists both 001 and 002 as "Validated", so there's
  no follow-up work queued for either.

Nothing else is pending. Let me know if you want to groom a new feature next,
or if you'd like the `feature/002-ablauf-erinnerungen` branch deleted now that
it's merged.
