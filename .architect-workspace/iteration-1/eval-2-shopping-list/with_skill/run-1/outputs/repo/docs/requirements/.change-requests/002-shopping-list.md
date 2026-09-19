# Change request – 002 Shopping list: Firebase sync not used

- Raised by: architect, 2026-09-19
- Affects: docs/requirements/002-shopping-list.md, "Stakeholder technical constraints"
- Design: docs/architecture/002-shopping-list.md, "Requirement conflicts" C1; ADR 0005, 0007

## The two requirements
- 002: "Sync am besten über Firebase" – stated in the first message as the preferred way to keep the shared list in sync between household members' devices.
- 001: "Frontend, Backend und Datenbank sollen zusammen dockerisiert auf meinem Raspberry Pi 5 mit 4 GB RAM laufen, und das Ganze muss mindestens 10 gleichzeitige User abkönnen."

## Why they conflict
With Firebase, the shopping list's data would be stored and synchronised in Google's cloud, so the database would no longer run on the Raspberry Pi. Keeping the list visible only to the household would also need a second login system (Firebase) next to the app's own.

## How it was resolved
The product need behind the Firebase wish is fully met without Firebase: changes appear on the other phones within about a second, the list can be viewed and ticked without reception, and offline ticks are sent once the connection is back. Everything stays on the Pi. To reach the Pi from the supermarket, every household phone gets the Tailscale app, which connects securely to the Pi at home without opening it to the internet.

Rule applied: fixed runtime environment and privacy come before a preferred tool; the need behind a tool preference is met another way.

## What the stakeholder gives up
- Firebase itself, and access from anywhere without an extra app: each household phone needs the Tailscale app switched on.
- The Pi at home must be running for changes to sync (as for the rest of the app).

## For the groomer
Please confirm with the stakeholder. If he wants Firebase anyway, 001's constraint "everything on the Pi" must be relaxed for the shopping list, and the design will be revised.
