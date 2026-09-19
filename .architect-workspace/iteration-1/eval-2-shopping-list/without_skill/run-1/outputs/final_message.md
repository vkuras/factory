Das technische Design für 002 Einkaufsliste ist fertig. Eine Sache muss der Stakeholder noch bestätigen: Ich habe **gegen Firebase entschieden**. Dadurch braucht es fürs Live-Update im Laden ein VPN.

**Kernentscheidungen**
- **Sync ohne Firebase (ADR 0005):** Die Liste liegt in der bestehenden Postgres-DB auf dem Pi. Das neue Ktor-Modul `shoppinglist` schickt Änderungen per SSE live an alle Geräte, bei jeder Änderung als komplette Liste. Firebase würde die Hard Constraint „alles auf dem Pi“ brechen und eine zweite DB und ein zweites Auth-System bringen. Außerdem lägen die Haushaltsdaten dann bei Google, und die Merge-Regeln liefen nicht mehr in Kotlin. Was er mit Firebase eigentlich will (Live-Liste, offline abhaken), ist trotzdem erfüllt.
- **Zugriff aus dem Laden (ADR 0006):** Die App ist nur im Heimnetz erreichbar. Deshalb läuft WireGuard auf dem Pi-Host oder auf dem Router, auf den Handys „on demand“. Die App selbst bleibt vom Internet aus unerreichbar. Ohne VPN funktioniert die Liste im Laden nur offline, und S1 (Frau fügt zu Hause hinzu, er sieht es im Laden) ist dann nicht erfüllt.
- **Offline (ADR 0007):** Der letzte Stand der Liste liegt in IndexedDB. Abhaken läuft immer über eine lokale Warteschlange, die bei Reconnect abgearbeitet wird. Hat jemand eine Zeile offline abgehakt, während ein anderer Menge dazugerechnet hat, teilt der Server die Zeile per Split-Regel auf. So geht nichts verloren und R2a bleibt gewahrt. Hinzufügen, Löschen, Verschieben und Abschließen gehen nur online.
- **Bereiche:** Zuerst greifen die Korrekturen des Haushalts, dann ein eingebautes deutsches Wörterbuch (inkl. Endungs-Match für Komposita wie „Vollmilch“ → Kühlregal), sonst „Sonstiges“. Kein ML, keine externen Dienste.
- **Rezept hinzufügen:** Der Client skaliert die Mengen mit derselben Funktion wie 001 S3 und schickt die fertigen Zeilen. Ein Idempotency-Key verhindert, dass ein wiederholter Request die Mengen verdoppelt.

**Dateien**
- `docs/architecture/design/002-shopping-list.md`: das Design mit Datenmodell, Merge-Regeln, API, Frontend, Tests und Reihenfolge der Umsetzung
- `docs/architecture/adr/0005`, `0006`, `0007`
- Status-/Indexeinträge in `overview.md`, `product.md` und `002-shopping-list.md` auf „Designed“ gesetzt

**Offen**
1. **Stakeholder:** Muss „kein Firebase, dafür WireGuard“ bestätigen. Dafür braucht es eine Portweiterleitung am Router (oder das eingebaute WireGuard des Routers) und eine einmalige Einrichtung auf jedem Handy, mit dem eingekauft wird. Die Umsetzungsschritte 1–5 hängen nicht davon ab.
2. **Im Review zu bestätigen:** vier kleine Auslegungen, alle leicht änderbar (Design §12):
   - Bei freien Artikeln zählt der Name ohne vorangestellte Menge („2x Milch“ gilt als „Milch“).
   - Eine Zeile ohne Menge übernimmt die Menge, wenn dieselbe Zutat später mit Menge dazukommt.
   - Eine Bereichskorrektur verschiebt nur die eine Zeile, nicht andere gleichnamige Zeilen, die schon auf der Liste stehen.
   - Die Split-Regel.
