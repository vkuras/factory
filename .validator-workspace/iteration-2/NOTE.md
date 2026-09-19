# Iteration 2 — what these runs actually measure

`eval-2-performance-and-design-conflict` ran on the repaired `val-perf-design`
seed and measures what it was meant to measure.

`eval-4-clean-implementation` did **not**. The seed was supposed to be a
correct implementation, and it was not: the phone layout was broken in every
seed of this suite (the add form wrapped to two rows, the task row overflowed
the viewport so Delete sat off screen, and the tick-off checkbox was squeezed
from 24 px to 13 px). That was a defect in the fixture, introduced when the date
input and `flex-wrap: wrap` were added, and confirmed afterwards by an
independent browser measurement at 375x812.

So both eval-4 runs here answer a different question than the one the eval asks:
not "can the validator approve a correct implementation" but "does the validator
find three real UI defects". Both found them:

- without the skill: F1 form two rows, F2 row overflow with Delete clipped and
  the checkbox at 13 px, plus F3 for the unvalidated `X-Today` header.
- with the skill: F1 title squeezed to 34-61 px, F2 checkbox at 13 px as a
  regression against 001 QE1, F3 form two rows.

Read together with iteration 1, this is the useful finding: the skill run in
iteration 1 eval 3 declared QE7 passed on a build with exactly these defects,
while this run found them. The difference is not the skill's instructions but
how thoroughly each run chose to measure the UI, which makes it a variance
problem rather than a missing rule.

The two runs themselves were discarded rather than kept: they answer a question
the eval does not ask, and this note holds what they found.

The clean question is re-asked in `iteration-3`, against the seed with the
layout fixed (`val-clean` commit d417a32).
