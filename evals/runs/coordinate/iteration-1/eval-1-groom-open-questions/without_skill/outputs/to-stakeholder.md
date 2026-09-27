Hi Vico,

grooming for **002 – Ablauf-Erinnerungen** has captured four stories (S1–S4), but three questions decide how the feature is cut. I don't want to invent answers here, because each one changes what gets built. Requirements 002 stays at status "In grooming" until you've answered.

Captured so far:
- S1: get reminded before an entry expires
- S2: mark a reminder as done
- S3: turn reminders off for a single entry
- S4: see what expires in the next few days

---

**1. Trigger time — when does the reminder fire?**

Why it matters: it decides whether we need a scheduler per user or per entry.
What changes: a fixed time of day needs a setting that doesn't exist today.

- **(a) Relative to the expiry date** — e.g. 2 days before it expires, fired whenever that moment is reached. No new setting, no daily rhythm.
- **(b) At a fixed time of day** — e.g. every day at 08:00 you get everything that's due. Needs a new "reminder time" setting.
- **(c) Both** — relative lead time plus a fixed delivery hour (e.g. "2 days before, delivered at 08:00"). Most flexible, most to build.

If (a) or (c): what's the default lead time — 1, 2 or 3 days? And should it be adjustable per entry?

**2. Delivery while the app is closed**

Why it matters: this decides push infrastructure vs. plain in-app display.
What changes: push means an external service and therefore a data-protection question.

- **(a) In-app only** — you see reminders when you open the app. No external service, no personal data leaves the device. Reminders can be missed.
- **(b) Push notifications too** — the phone alerts you even with the app closed. Needs an external push service (device token leaves the device), so we'd have to accept that privacy trade-off.
- **(c) In-app now, push later** — ship (a) as 002 and keep push as its own later requirement.

**3. Entries already used up**

Why it matters: S2 and S3 overlap here.
What changes: either the reminder disappears silently, or you have to dismiss it yourself.

- **(a) It disappears on its own** — consuming/deleting an entry silently removes its pending reminder. Nothing to click.
- **(b) It stays until you dismiss it** — the reminder remains visible and you mark it done yourself (S2 then also covers this case).
- **(c) It disappears, but the "expiring soon" list (S4) shows it as handled** for a short while, so you can see it was taken care of.

---

Answers of the form "1a, 2c, 3a" are enough — feel free to add anything I missed. As soon as they're in, I'll send the answers back to grooming, get 002 to "Groomed – ready for architecture", and then run architecture, implementation and validation without bothering you again.
