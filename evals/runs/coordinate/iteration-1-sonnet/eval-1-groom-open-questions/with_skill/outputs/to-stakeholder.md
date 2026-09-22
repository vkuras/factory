The groomer finished a pass on requirement 002 (expiry reminders, docs/requirements/002-ablauf-erinnerungen.md) and has 4 stories drafted, but 3 open questions still decide the shape of the feature. I need your answers before it can groom a final version.

**1. When should the reminder trigger?**
- Option A: At a fixed time of day (e.g., every day at 9am)
- Option B: Relative to the expiration date (e.g., 2 days before it expires)

Why it matters: this decides whether the system needs a scheduler per user or a scheduler per item. A fixed time of day requires a new setting that doesn't exist yet.

**2. Should the reminder show up when the app is closed?**
- Option A: Yes, it should still notify me even if the app isn't running (push notification)
- Option B: No, it only needs to show up while I have the app open (in-app only)

Why it matters: push means adding an external notification service and a data-privacy question to work through. In-app-only avoids that but means you'd only see the reminder if you happen to open the app.

**3. What happens to a reminder if the item was already used up before the reminder fired?**
- Option A: The reminder disappears silently
- Option B: The reminder stays and you have to dismiss it yourself

Why it matters: stories S2 and S3 overlap here, so this choice affects both.

Take your time — "don't know" or "you decide" are fine answers too, the groomer knows what to do with those.
