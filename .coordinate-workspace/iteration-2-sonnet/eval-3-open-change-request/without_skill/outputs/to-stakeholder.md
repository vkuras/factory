Before I drive 002 (Ablauf-Erinnerungen) on to validation, there's an open change request against it that the architect said needs your call.

**The conflict:**
- 002 says: "Die Erinnerung soll auch ankommen, wenn die App zu ist." (the reminder should still arrive when the app is closed)
- 001 says: "Das Produkt läuft vollständig auf dem NAS im Haushalt. Keine Daten verlassen das Heimnetz." (everything stays on the home NAS, no data leaves the home network)

Delivering a reminder while the app is closed needs Apple's/Google's push service on iOS/Android, and that means at least the device token leaves your home network — which breaks 001.

**What the architect did:** treated 001 as the hard constraint and 002's "works while closed" as the thing that gives way. The design now delivers reminders only while the app is open; there's no notification if the app stays closed.

**What that costs:** anyone who doesn't open the app for a few days won't see the reminder in time — which is the exact scenario 002 was written to cover in the first place.

So: do you confirm this trade-off, or overrule it?

1. **Confirm** – keep reminders in-app only, no push, home network stays fully closed. I'll send 002 straight to the validator as implemented.
2. **Overrule** – you want reminders to arrive even when the app is closed, accepting that this means using Apple/Google push and that a device token leaves the home network (a change to 001's "nothing leaves the home network" rule). I'll send this back to grooming to update 001 and/or 002 accordingly, then re-run architecture and implementation before validating.
3. Something else (e.g. a middle ground like a local notification scheduled in advance, if that's technically viable) — tell me and I'll take it back to the architect.
