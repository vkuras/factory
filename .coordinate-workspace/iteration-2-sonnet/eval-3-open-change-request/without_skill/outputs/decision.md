# Decision – 002 Ablauf-Erinnerungen

002 has an **open** change request (`docs/requirements/.change-requests/002-ablauf-erinnerungen.md`, CR1, raised by the architect) that the architect explicitly flagged as needing the stakeholder's sign-off ("For the groomer: Der Stakeholder muss bestätigen oder umstoßen"). It documents a real conflict between 002's "reminder must arrive while the app is closed" constraint and 001's "everything stays on the home NAS, nothing leaves the home network" constraint, resolved by the architect in favor of 001 (in-app-only reminders, no push).

Implementation already proceeded on that resolution and self-reports "ready for validation," but the trade-off itself (users who don't open the app for days miss the reminder — exactly the case the requirement's motivating scenario describes) has not been confirmed by the stakeholder. Running the validator now would validate against a scope that could still be overruled, wasting that work if the stakeholder disagrees.

I am not spawning any agent yet. I'm asking the stakeholder to confirm or overrule CR1 first; the next step (validator, or back to groomer/architect) depends on that answer.
