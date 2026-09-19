# 0005 – Push messages via OneSignal Web Push, targeted by server-stored subscription ids

- Status: Accepted
- Date: 2026-09-19
- Requirements: 002 R11, S4, QE1, QE4, stakeholder technical constraint (OneSignal), Left to architecture 1

## Context
Taskli is a React PWA (ADR 0003); employees use it installed on Android company phones, the Meister in a laptop browser and sometimes on his phone. 002 needs one push message per person per working day at 07:00, delivered only as push (R11), containing only the recipient's own tasks (QE4), opening a specific URL on tap (S4). Volume: ~7 users, ~10 devices, ≤ 8 sends per day. The stakeholder said "ich würd OneSignal nehmen, das kenn ich". No requirement demands self-hosting or forbids a third-party processor.

## Options
### A – OneSignal Web Push
Free plan covers unlimited web push subscribers. Web SDK v16 handles permission, subscription and click handling; its worker is imported into the PWA's own service worker. REST API with idempotency keys. Downside: external processor (task titles and customer names pass through it, DPA needed), one more account and SDK.
### B – Self-hosted Web Push (VAPID, `web-push` npm)
No third party, a few fewer moving parts in the client. Downside: contradicts the stakeholder's stated preference without a requirement forcing it; own code for subscription storage, key handling, click handling.
### C – Firebase Cloud Messaging
Also free, but contradicts the preference and adds a Google project; no advantage over A for a PWA.

## Decision
A. It honours the stakeholder's preference and meets every driver. Targeting: the web app reports its OneSignal subscription id to the authenticated api (`PUT /api/push-subscriptions/:id`); the api sends with `include_subscription_ids`. OneSignal external ids / `OneSignal.login` are not used, because a client could claim another user's id and receive their reminders (QE4).

## Consequences
- The PWA service worker must import `OneSignalSDK.sw.js`; vite-plugin-pwa uses `injectManifest`.
- Secrets: `ONESIGNAL_REST_API_KEY` in server `.env`; app id also as web build arg.
- No push without OneSignal; an outage means that day's reminders are lost (accepted by R11).
- Revisit if a privacy/self-hosting requirement appears or OneSignal's free web push terms change; B is the fallback and only `PushSender` and the web `push/` module would change.
