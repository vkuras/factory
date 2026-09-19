# ADR 0006 – Remote access to the home network via WireGuard

- Status: Proposed – needs stakeholder confirmation (router/phone setup)
- Date: 2026-09-19
- Context: 002 S1 ("wife adds at home while husband has the list open in the store"); architecture overview: app reachable only inside the home network

## Context
The app is only reachable inside the home network at `https://rezepte.home`. In the store, the shopper's phone is on mobile data and cannot reach the Pi. Without remote access, the list works there only as an offline copy, and S1's live update in the store fails.

## Options
1. **Expose Caddy to the internet** (public domain, Let's Encrypt). Makes the login page and API attackable from the internet, and changes the privacy posture of the whole app. Rejected.
2. **Tailscale.** Easy and needs no port forward, but it is an external coordination service and an account per user. Acceptable fallback if port forwarding is impossible.
3. **Self-hosted WireGuard (chosen).** On the Pi host (kernel module, negligible RAM) or on the router if it supports it. Split tunnel to the home LAN only, "on demand" on the phones. Needs a UDP port forward and DynDNS.

## Decision
Option 3. The app, TLS and auth stay unchanged, and only enrolled household phones can reach the LAN.

## Consequences
- One-time ops effort: router port forward + DynDNS, one WireGuard peer per phone that shops. Runbook `ops/wireguard.md`.
- No change to the container memory budget.
- Lost phone: remove its peer (runbook) and its app session.
