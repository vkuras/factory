# ADR 0005 – Push messages via OneSignal Web Push

- Status: Accepted
- Date: 2026-09-19
- Context: requirement 002 (R11, S4), design 002

## Context
002 needs push messages on the employees' Android company phones and on the Meister's phone. Taskli is a PWA (ADR 0003), so there is no native app. The stakeholder said he would use OneSignal because he already knows it (002, "Stakeholder technical constraints"). There are about 8 recipients and at most about 8 messages per day.

## Options
- **A: OneSignal Web Push** (SDK in the PWA, REST API from the backend).
- **B: Self-hosted Web Push** (VAPID keys, `web-push` npm package, push subscriptions stored in Postgres).
- C: A native app wrapper (TWA/Capacitor) with FCM. Rejected: it is a new distribution channel for one feature.

## Decision
**A: OneSignal Web Push.** Users are targeted by `external_id = User.id`. The backend calls the REST API with an `idempotency_key` and a `web_url` for the tap target.

## Reasons
- It is the stakeholder's stated preference, and he can use the OneSignal dashboard himself to see who is subscribed and whether a message was delivered. That fits R11 ("whoever switched it off has to sort it out themselves").
- Taskli stores no push subscriptions and does not handle expired or rotated subscriptions.
- The idempotency key and the per-alias targeting of all of a user's devices come built in.
- The volume is far inside what OneSignal offers for free. Check this when signing up.

## Consequences
- The OneSignal worker is imported into the existing vite-plugin-pwa service worker (`importScripts`). A spike verifies this before the rest is built.
- Notification content (task titles, customer names) passes through a US processor. **The business has to accept OneSignal's DPA before go-live.**
- A new external dependency and two new secrets (`ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`).
- The backend only depends on the `PushSender` interface. If the DPA is not accepted or OneSignal is dropped, option B replaces one class plus the web init. The rules and the scheduler stay unchanged.
