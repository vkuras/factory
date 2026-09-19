Die Architektur für 001 (Rezept-App MVP) ist fertig und steht in `docs/architecture.md`. In der Requirement-Datei und in `product.md` steht der Status jetzt auf "Architected". Code gibt es noch keinen.

**Kern:**
- **Eine Web-App, die man auf dem Handy wie eine App installiert (PWA).** Sie läuft auf Handy, Tablet und Laptop, egal ob iPhone oder Android, und braucht keinen App Store. Frontend und Service Worker sind in Kotlin/JS (React über kotlin-wrappers) geschrieben, das Backend in Ktor (JVM 21). Die Datenbank ist PostgreSQL, Fotos liegen dort mit drin.
- **Auf dem Pi laufen vier Container:** Caddy (HTTPS und die Web-App), Ktor, Postgres und ein nächtliches Backup. Zusammen brauchen sie etwa 1,3 GB von den 4 GB RAM.
- **Ein gemeinsames Kotlin-Modul** erkennt die Mengen, skaliert sie und rundet sie. Import, Server und Eingabeformular benutzen denselben Code.
- **Offline:** Der Service Worker speichert jedes geöffnete Rezept samt Foto. Portionen umrechnen und Kochmodus funktionieren deshalb ohne WLAN. Speichern geht nur mit Verbindung. Schlägt es fehl, bleiben die Eingaben erhalten, auch nach einem Neuladen.
- **Zutaten bleiben Text, genau wie geschrieben.** Beim Umrechnen wird nur die erkannte Zahl ersetzt, z. B. "Kartoffeln mehlig (900g)" → "(1350g)".
- **Zugang:** Jeder hat eigenen Benutzernamen und Passwort. Die Einladung ist ein Link, den man per Messenger schickt. Man bleibt 365 Tage angemeldet.
- **Import:** ein einmaliger Befehl mit Probelauf zum Durchsehen. Er bricht ab, wenn nicht genau 8 Rezepte gefunden werden, und lässt sich kein zweites Mal ausführen. Die 8 Dateien habe ich durchgesehen und die Regeln passend zu ihren uneinheitlichen Formaten beschrieben.
- **Umsetzungsreihenfolge:** 8 Schritte, beginnend mit einem lauffähigen Grundgerüst mit HTTPS auf dem Pi.

**Wichtig, bitte beachten:**
- **HTTPS ist Pflicht.** Offline-Lesen und das Anlassen des Bildschirms funktionieren im Browser nur über HTTPS. Ich bin davon ausgegangen, dass Viktor eine eigene Domain hat oder sich eine holt, und dass die App nur im Heim-WLAN erreichbar sein muss. Ohne Domain geht Tailscale als Alternative, dann braucht aber jedes Gerät eine zusätzliche App. Das muss vor dem Einrichten auf dem Pi feststehen.
- **Auf iPhone und iPad muss die App auf den Home-Bildschirm.** Sonst löscht iOS nach 7 Tagen ohne Nutzung den Offline-Speicher.
- **Backup habe ich ergänzt, obwohl es nicht in den Requirements steht.** Ohne das Git-Repo ist der Pi sonst die einzige Kopie der Rezepte. Außerdem empfehle ich eine SSD statt SD-Karte.
- **Ich habe angenommen, dass jedes Mitglied einladen darf**, weil es laut Requirements keine Rollen gibt.
