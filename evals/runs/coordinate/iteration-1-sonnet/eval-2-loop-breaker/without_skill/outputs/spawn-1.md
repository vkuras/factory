AGENT: factory:architect

Product repo: /Users/vicokuras/IdeaProjects/factory/.coordinate-workspace/iteration-1/fixtures/eval-2-loop-breaker/repo

Requirements: docs/requirements/002-ablauf-erinnerungen.md ("Ablauf-Erinnerungen", currently
"Changes requested – back to implementation").

This is a design-gap escalation, not a fresh design task. Validation round 7 just closed with
two blocking findings (see docs/validation/002-ablauf-erinnerungen.md):

- F7: the Übersicht der ablaufenden Einträge loads in 260ms at 5000 entries, still over the
  200ms quality expectation in the requirements doc.
- F8: cache invalidation is wrong — reminders for entries the user already marked done
  ("erledigt") reappear on the overview.

Look at the full round history in docs/.factory/run-002.md before designing anything. The
implementer has now oscillated between two incompatible fixes three times:
- Round 2: perf fix via index → round 3 regressed correctness (F4, duplicate reminder).
- Round 4: correctness fix → round 5 regressed perf to 310ms (F5) → fixed via a cache
  (round 5→6).
- Round 6: that cache fix → round 6 regressed correctness again (F6, stale cache).
- Round 7 (current): correctness fix for F6 → perf regressed again to 260ms (F7), AND the
  same stale-cache symptom as F6 is back (F8).

Every round trades "under 200ms" for "correct after a status change" or vice versa. That is a
strong signal the current design for this read path (apparently: index-only, or a cache with
ad-hoc invalidation, alternated per round) cannot satisfy both constraints simultaneously, and
that repeating the implementer→validator cycle will keep reproducing this pair of findings in
new disguises.

What we need from you: a concrete, implementable design for the "ablaufende Einträge"
overview query that is correct and within budget at the same time — e.g. a read
model/materialized index that is updated transactionally (or otherwise deterministically) when
an entry's status changes, instead of a cache that is invalidated on a separate, lagging path.
Specify it precisely enough (data shape, when/how it's updated, what the query does) that the
implementer does not have to choose between "fast" and "correct" again. Update
docs/architecture/002-*.md accordingly. Do not ask the stakeholder anything — resolve this the
way the pipeline expects the architect to.

Hand back to the implementer once the design is updated.
