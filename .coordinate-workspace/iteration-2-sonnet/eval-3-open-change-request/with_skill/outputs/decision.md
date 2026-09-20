# Decision

Requirements doc 002 shows status "Implemented – ready for validation", which would normally
route straight to the validator. But `docs/requirements/.change-requests/002-ablauf-erinnerungen.md`
has an open entry (CR1, raised by the architect on 2026-09-19, Status: Open) that nobody has
carried to the stakeholder yet — it resolved a conflict between 002's "reminder must arrive even
when the app is closed" requirement and 001's "everything stays on the home NAS, no data leaves
the home network" constraint by dropping push delivery for closed-app reminders.

Per the skill: an open change request is a decision waiting for the stakeholder, and it must be
carried to them before spending another stage on the document. So this session does not spawn the
validator (or any other agent) yet. Instead it surfaces CR1 to the stakeholder as-is and waits for
their answer: confirm the resolution and proceed to validation, or overturn it and send 002 back
to grooming (with rework of the architecture and implementation that follows from that).

No agent was spawned this round.
