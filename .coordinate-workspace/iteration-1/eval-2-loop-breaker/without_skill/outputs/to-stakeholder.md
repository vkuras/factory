Hi Vico,

I am stopping the pipeline for **002 – Ablauf-Erinnerungen** and need a decision from you. I am not sending it back to the implementer again.

**Why I am stopping**

Round 7 of validation is done. The feature has now been through 7 implementer/validator rounds (13 stage handovers) and it is not converging — it is oscillating between the same two problems:

| Round | Performance | Correctness |
|---|---|---|
| 3 | F3: 240 ms | — |
| 4 | fixed via index | F4: Erinnerung doppelt |
| 5 | F5: 310 ms | F4 closed |
| 6 | fixed via cache | F6: cache stale |
| 7 | F7: 260 ms | F8: reminder for a completed entry reappears after cache invalidation |

The pattern is clear: every fix for the 200 ms budget introduces a cache, and every cache introduces a correctness bug in the reminder list; every fix for the correctness bug removes caching and the page goes back over 200 ms. Another round would most likely produce F9 (performance) and F10 (cache) and cost another full implement + validate cycle. Regression for 001 keeps passing, so nothing else is broken — the problem is confined to this one feature and, I believe, to one requirement.

**What I think the root cause is**

The quality expectation "Die Übersicht der ablaufenden Einträge lädt in unter 200 ms bei 5000 Einträgen" is the only thing forcing the cache. It was never questioned after grooming, and the current architecture (Kotlin + Postgres + Scheduler) apparently cannot serve that view within 200 ms from the database alone at 5000 entries — the best honest measurement so far is 240–260 ms without the cache.

**Your options**

- **A – Relax the number.** Accept the list at, say, under 400 ms at 5000 entries and drop the cache entirely. Fastest path: F8 disappears with the cache, F7 becomes non-blocking, and the feature can ship in one implementer round. Trade-off: a visibly slower list for a household of that size.
- **B – Keep 200 ms and change the design.** Send this to the architect for a real design decision instead of another patch — e.g. a precomputed/materialized "expiring entries" table maintained by the existing scheduler, invalidated by entry changes rather than by a time-based cache. Trade-off: one architecture round plus a larger implementer round, and it touches the data model.
- **C – Narrow the requirement.** Keep 200 ms, but only for the realistic case (e.g. under 500 entries per household) and allow it to degrade beyond that. Trade-off: cheap, but the 5000-entry case stays unmeasured/unpromised.
- **D – Ship 002 without the reminder overview.** Keep the reminders themselves, defer the list view to its own requirement. Trade-off: the feature is only half of what you groomed.

Is 5000 entries a real household size for you, or was it a stress-test number? That answer alone may decide between A and C.

Until you pick one, 002 stays at "Changes requested" and I will not start another implementer round.
