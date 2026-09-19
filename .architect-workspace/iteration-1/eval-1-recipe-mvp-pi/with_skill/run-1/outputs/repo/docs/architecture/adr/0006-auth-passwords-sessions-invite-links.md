# 0006 – Username/password login, server-side sessions, one-time invitation links

- Status: Accepted
- Date: 2026-09-19
- Requirements: 001 S1, R1, R2, QE5, QE7, LA1

## Context
Each member needs their own access. Viktor invites his wife, and nobody else sees recipes (S1, R1). No e-mail infrastructure exists on the Pi. The product is LAN-only (ADR 0005). Sign-in must be easy and rare (QE7): kitchen devices shouldn't ask for a password every week.

## Options
### A – Username + password (bcrypt), opaque server-side session cookie valid 180 days (sliding), invitation and password-reset links created by the founder
Self-contained, no external services, well understood. A lost password is solved by the founder creating a reset link, and by a CLI command for the founder himself.
### B – Passwordless: invite link binds a device token, no password
Easiest start, but each new device needs a new link from the founder, and there is no recovery if the device is lost.
### C – External identity provider (Google/Apple OIDC)
Needs internet and third-party accounts, and redirect URIs on a LAN-only host are awkward. It conflicts with privacy and self-hosting.

## Decision
A. Minimal parts, works fully on the Pi, and one sign-in per device lasts half a year.

## Consequences
- One household per installation. Every user account is a household member. There is no household table.
- The first account (the "founder", Viktor) is created with the CLI command `create-founder`, which prints a one-time link. Only the founder can create invitation and reset links (assumption A1 in design 001).
- Session tokens: 32 random bytes, base64url, cookie `rezepte_session` (HttpOnly, Secure, SameSite=Lax, Path=/). Only the SHA-256 hash is stored.
- Mutating requests must carry an `Origin` header equal to `https://$PUBLIC_HOST`, otherwise 403 (CSRF defence in addition to SameSite).
- Login throttling: 10 failed attempts per username within 15 minutes → HTTP 429 until the window ends. Kept in memory, which is fine for a single instance.
