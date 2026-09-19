# 0005 – LAN-only access over HTTPS with a Let's Encrypt certificate via DNS-01 (Caddy + Cloudflare DNS)

- Status: Accepted
- Date: 2026-09-19
- Requirements: 001 S10, S6, QE3, QE4, QE5, QE7, Stakeholder constraint 2

## Context
Service workers (offline reading, ADR 0002) and the Wake Lock API (screen stays on, S6) only work on a secure origin, so the Pi has to serve HTTPS with a certificate every phone trusts. Recipes must stay private (QE5). The wife must be able to use it without technical setup (QE7, success criterion). Access from outside the home isn't required. The product runs on the Pi.

## Options
### A – Own domain, DNS at Cloudflare (free plan), record `rezepte.<domain>` → Pi's LAN IP (DNS only, not proxied). Caddy gets a Let's Encrypt cert via the DNS-01 challenge. No port forwarding.
Trusted by every device with zero setup on phones. Not reachable from the internet. Needs a domain (~10 €/year) and a Cloudflare API token. Some routers block DNS answers with private IPs ("DNS rebind protection"), which needs a one-time exception.
### B – Tailscale with MagicDNS and `tailscale cert`
No domain needed, reachable from anywhere. Every device must install Tailscale and sign in, which is friction for the wife and a third-party account.
### C – Self-signed certificate / private CA
Each device must install and trust a root CA, which on iOS takes several manual steps. That fails QE7.
### D – Public exposure via port forwarding or tunnel
Not needed, and it increases attack surface against QE5.

## Decision
A. It is the only option with zero per-device setup and no internet exposure. The certificate authority and DNS are used only for name resolution and issuance. The product itself runs entirely on the Pi.

## Consequences
- Custom Caddy image built with `xcaddy build --with github.com/caddy-dns/cloudflare`.
- Secrets `CLOUDFLARE_API_TOKEN` (Zone:DNS:Edit for that zone only) and `PUBLIC_HOST` live in `/opt/rezepte/.env` on the Pi, never in the repo.
- The app works only on the home network. The operations guide says so, and it covers the router rebind exception (FRITZ!Box: Heimnetz → Netzwerk → Netzwerkeinstellungen → DNS-Rebind-Schutz → add the host name).
- If DNS resolution fails while offline, the service worker still serves cached recipes.
- Revisit if access from outside the home becomes a requirement.
