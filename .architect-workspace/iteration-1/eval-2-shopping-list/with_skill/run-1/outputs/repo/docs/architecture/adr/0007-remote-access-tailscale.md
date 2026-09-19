# 0007 – Reach the Pi from outside the home network via Tailscale (subnet route + split DNS)

- Status: Accepted (replaces the "only inside the home network" reachability of the 001 deployment)
- Date: 2026-09-19
- Requirements: 002 S1.2, QE2, QE3, QE4; 001 stakeholder constraint 2

## Context
Until now the app is reachable only in the home network at `https://rezepte.home` (Caddy internal CA). 002 S1.2 requires that the shopper in the supermarket, on the mobile network, sees lines his wife adds at home. So household phones need a path to the Pi from anywhere, while the list stays household-only, all components stay on the Pi, and the Pi may sit behind carrier-grade NAT (common with German ISPs, DS-Lite), where inbound port forwarding is impossible. 2–4 users, a handful of phones.

## Options
### A – Public exposure: DynDNS domain, router port forward 443, Let's Encrypt
No app on phones. Fails behind CGNAT/DS-Lite; exposes the login to the internet (brute force, every future bug is public); needs a domain and a new origin, so PWAs, sessions and offline caches reset.
### B – Self-hosted WireGuard on the Pi
Fully self-hosted. Needs an inbound UDP port forward (fails behind CGNAT), DynDNS, and manual per-device key handling.
### C – Tailscale (WireGuard-based, hosted coordination), Pi as subnet router for its own LAN IP and the LAN DNS server, split DNS for `home`
Works behind CGNAT without port forwarding, end-to-end encrypted, nothing exposed publicly. Keeps the URL, certificate, installed PWAs and sessions. The coordination service sees device metadata, never app data. Needs the Tailscale app on each phone and one login per member.
### D – Cloudflare Tunnel
No app on phones, works behind CGNAT, but TLS terminates at Cloudflare (list contents pass through a third party) and the app becomes internet-facing.

## Decision
C. It is the only option that works regardless of the ISP's NAT, exposes nothing to the internet (QE4), keeps every component and all data on the Pi (001), and keeps `https://rezepte.home` unchanged for existing devices. Setup steps and the manual check T-REMOTE-1 are in design 002 ("Deployment and runtime") and `deploy/remote-access.md`.

## Consequences
- Each household phone must run the Tailscale app and keep it connected (Android: Always-on VPN).
- `tailscaled` runs on the Pi host with `MemoryMax=100M`; IPv4 forwarding enabled on the host.
- Only `/32` routes are advertised (Pi and LAN DNS), not the whole home LAN.
- Revisit if the household wants access without a VPN app; then option A with rate limiting and a public domain would be required.
