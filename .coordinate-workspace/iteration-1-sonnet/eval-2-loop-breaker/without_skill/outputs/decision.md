# Decision – 002 Ablauf-Erinnerungen, after validation round 7

Not sending this back to the implementer for another patch. Rounds 2–7 show the same two
findings trading places three times (F3 perf ↔ F4 duplicate, F5 perf ↔ F6 stale cache, now
F7 perf ↔ F8 stale cache again): every fix for the <200ms budget uses a cache that breaks
correctness, and every fix for correctness drops the cache and blows the budget again. That
is a design conflict in the read path, not an implementation slip, so another implementer
round would very likely just reproduce F3–F8 in a new shape.

Routing a design-gap report to the architect to specify a read path that meets both
constraints at once (e.g. a correctly invalidated read model/index instead of alternating
between "index only" and "cache only"). Implementation resumes once that design exists.
Sending Vico a short status note as an FYI, not a question — design decisions stay inside
the pipeline (no design gate, architect never asks).
