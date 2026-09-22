Subject: 002 – Ablauf-Erinnerungen — stopping to ask before another implementation round

Vico, I'm pausing this document instead of routing round 7's findings straight back to the implementer.

**Why:** implementer and validator have now bounced this document six times in a row (rows 3–14 of docs/.factory/run-002.md), with no other stage or decision from you in between. That's the loop-breaker threshold from the coordination process — six consecutive cycles between the same pair — so I'm bringing it to you rather than sending round 8.

**What keeps recurring, across the six rounds:**
- **Performance on the overview list** (target: under 200 ms at 5000 entries): flagged as F3 (240 ms), "fixed" via an index, came back as F5 (310 ms), "fixed" via a cache, came back as F7 (260 ms) this round. Three different fixes, three regressions of the same requirement — it has never durably passed.
- **Cache invalidation for completed entries**: flagged as F6 (stale cache shows expired reminders again), "fixed," came back as F8 this round (reminder for a completed entry reappears after cache invalidation). Same defect class recurring after being marked closed.

Everyone has been doing their job honestly each round — findings get fixed, new ones show up — but the document isn't converging, and the two recurring issues (perf, cache) look coupled: the caching layer used to hit the perf target may be what's causing the invalidation bug.

Full detail: `docs/validation/002-ablauf-erinnerungen.md` (round 7) and `docs/.factory/run-002.md` (full history).

**Your options:**
1. **Relax or clarify the requirement** (back to groom) — e.g. loosen the 200 ms target, or clarify what "erledigt" means for cache purposes, if the current bar is unrealistic or ambiguous.
2. **Change the design** (back to architect) — the caching approach may be the wrong tool to hit the perf target without breaking invalidation; a different strategy (e.g. a materialized/indexed view instead of an app-level cache) might resolve both F7 and F8 at once.
3. **Accept the current state** — ship with the 260 ms load time and/or the cache bug, and record explicitly what's being waived.
4. **Stop the document here** — leave it at "changes requested" and pick it up later.

Which of these should I do, or something else?
