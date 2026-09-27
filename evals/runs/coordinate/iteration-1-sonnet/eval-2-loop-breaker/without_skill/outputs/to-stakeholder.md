Subject: 002 Ablauf-Erinnerungen – status after validation round 7

Hi Vico,

Quick status, no decision needed from you.

Round 7 of validation on "Ablauf-Erinnerungen" closed with 2 blocking findings: the overview
is still slightly over the 200ms budget at 5000 entries (260ms), and a cache bug makes
reminders for items already marked done reappear.

Looking at the last several rounds, these two problems have been trading places: fixing the
speed budget with a cache breaks the "done items stay done" behavior, and fixing that
correctness bug drops the speed fix and the load time creeps back up. That's happened three
times now, which tells me this isn't a small implementation slip — the current approach to
that read path can't satisfy both requirements at once.

Rather than sending this back for another quick patch that would likely just trade one
finding for the other again, I'm routing it to the architect to redesign that part properly
(a read path that's fast and correct at the same time, not alternating between the two).
Implementation picks back up once that's done. I'll update you when it's back in validation.

No open questions on my side — this is happening within the existing requirements, nothing
about scope or the 200ms/correctness expectations is changing.
