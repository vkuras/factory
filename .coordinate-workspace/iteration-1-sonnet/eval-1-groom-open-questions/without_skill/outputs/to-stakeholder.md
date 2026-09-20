# Open questions on Feature 002 – Expiry Reminders

Hi Vico,

Grooming for **002 – Ablauf-Erinnerungen** (docs/requirements/002-ablauf-erinnerungen.md) captured 4 stories (S1–S4), but 3 open questions decide how the feature is cut. I need your input before this can go to the architect.

## 1. Trigger timing
Should the reminder fire at a fixed time of day, or relative to the expiry date (e.g. 2 days before)?

- Why it matters: determines whether we need a scheduler per user or a scheduler per entry.
- What changes: a fixed time of day requires a new settings option that doesn't exist today.

Options:
- **A** – Relative to expiry date only (e.g. "N days before"), no time-of-day setting.
- **B** – Fixed time of day (e.g. "every day at 9am"), applied to whichever entries are due.
- **C** – Both: a default relative offset, with an optional fixed time of day.

## 2. Delivery when the app is closed
Should the reminder also appear when the app isn't running, or only when the user opens it?

- Why it matters: decides between push infrastructure and a purely in-app display.
- What changes: push means adding an external service, which raises a data-privacy question.

Options:
- **A** – In-app only. Reminders show when the user opens the app; no push service.
- **B** – Push notifications, even when the app is closed (needs an external push service).

## 3. Reminders for entries that were used up first
What should happen to a reminder if the entry was consumed before it fired? (This overlaps with S2 "mark as done" and S3 "disable reminders".)

- Why it matters: S2 and S3 overlap here — this decides how they relate.
- What changes: either the reminder disappears silently, or the user has to dismiss it themselves.

Options:
- **A** – Silent: the reminder is removed automatically once the entry is gone.
- **B** – Manual: the reminder stays until the user dismisses it (via the S2 "mark as done" action).

Once I have your answers, grooming will incorporate them and the requirement will move to "Groomed – ready for architecture."
