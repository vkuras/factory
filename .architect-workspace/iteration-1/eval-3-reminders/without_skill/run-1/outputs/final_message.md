Das Design für 002 (Erinnerungen) ist fertig und bereit fürs Implementieren. Code habe ich keinen geschrieben.

**Neue und geänderte Dateien:**
- `docs/architecture/design/002-task-reminders.md` – das eigentliche Design
- `docs/architecture/adr/0005-push-via-onesignal-web-push.md`
- `docs/architecture/adr/0006-in-process-scheduler-with-persisted-daily-plan.md`
- `docs/architecture/overview.md` – Stack, Komponenten, Datenmodell, Secrets, harte Constraints und Design-Index ergänzt
- In `product.md` und im Requirement 002 steht der Status jetzt auf „Designed“.

**Die wichtigsten Entscheidungen:**
- **Push:** OneSignal Web Push, wie vom Stakeholder gewünscht. Die Geräte melden sich mit der User-ID (`external_id`) an. Das Backend schickt über die REST-API und gibt einen Idempotency-Key mit, damit nichts doppelt ankommt. Der OneSignal-Worker kommt per `importScripts` in den bestehenden PWA-Service-Worker.
- **Zeitplan:** Ein Cron in der API läuft von 07:00 bis 09:55 Uhr (Berliner Zeit) alle 5 Minuten. Der erste Lauf an einem Werktag plant den ganzen Tag und speichert das in Postgres: das ist der Stand von 07:00 (R8). Die folgenden Läufe schicken nur noch ab, was noch offen ist. Pro Person und Tag ist höchstens eine Nachricht erlaubt, das erzwingt die Datenbank (R7). Bei einem Neustart gehen keine Nachrichten doppelt raus.
- **Feiertage:** Die bayerischen Feiertage werden berechnet (Ostern-Algorithmus plus feste Tage). Es gibt keine Datenpflege und keine Library. 15.8. und 8.8. sind ausgenommen.
- **Meister-Hinweis:** Er geht raus, wenn eine Aufgabe genau 2 Werktage überfällig ist. Ändert sich das Fälligkeitsdatum, kann er deshalb automatisch erneut kommen (R10).
- **Antippen:** Bei genau einer Aufgabe öffnet sich `/tasks/:id`. Bei mehreren öffnet sich `/tasks` (Mitarbeiter) bzw. `/overview` (Meister).

**Was ich ohne Rückfrage selbst entschieden habe (bitte prüfen):**
1. **Zeitfenster bis 09:00:** War die API um 07:00 down, wird bis 09:00 nachgeholt. Danach fällt der Tag komplett aus.
2. **Aktivieren-Banner:** Ein kleines Banner „Erinnerungen aufs Handy bekommen – Aktivieren“ ist nötig, weil der Browser die Push-Erlaubnis nur nach einem Tippen erteilt. Eine Einstellungsseite ist das nicht.
3. **Inaktive Nutzer** bekommen keine Erinnerungen. Ihre Aufgaben zählen aber weiter für den Meister-Hinweis.

**Risiken und To-dos vor dem Go-live:**
- **Datenschutz:** Kundennamen gehen über OneSignal, einen US-Dienstleister. Der Betrieb muss dafür den Auftragsverarbeitungsvertrag (DPA) von OneSignal akzeptieren. Wenn nicht, ersetzen wir OneSignal durch selbst gehostetes Web Push; die Alternative steht in ADR 0005.
- **Zuerst ein halber Tag Spike auf einem echten Firmenhandy:** Er klärt drei Punkte:
  - ob der OneSignal-Worker neben dem PWA-Worker läuft,
  - ob die Nachricht zuverlässig ankommt,
  - ob sich beim Antippen die PWA öffnet und nicht ein Chrome-Tab.
- **Falls der Meister ein iPhone hat,** kommt Push dort nur an, wenn Taskli auf dem Homescreen installiert ist.
