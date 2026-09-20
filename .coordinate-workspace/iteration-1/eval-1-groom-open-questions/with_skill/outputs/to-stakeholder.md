# Nachricht an den Stakeholder (Vico)

Kurzstand: Der Groomer ist mit 002 – Ablauf-Erinnerungen durch, Status `in-grooming`. Vier Stories (S1–S4) stehen im Dokument, drei Fragen sind offen, die den Zuschnitt des Features bestimmen. Ich gebe sie dir so weiter, wie der Groomer sie gestellt hat — sobald du geantwortet hast, läuft der Groomer mit deinen Antworten noch einmal und danach geht es zum Architekten.

Drei Fragen, gestellt über `AskUserQuestion` (Antwortoptionen wie unten; "weiß ich nicht" / "ist mir egal" / "entscheide du" sind ebenfalls gültige Antworten und werden so weitergereicht):

---

**Frage 1 — Auslösezeitpunkt**

Soll die Erinnerung zu einer festen Uhrzeit kommen oder relativ zum Ablaufdatum (z. B. 2 Tage vorher)?

- Warum das wichtig ist: bestimmt, ob ein Scheduler pro Nutzer oder pro Eintrag nötig ist.
- Was sich dadurch ändert: bei fester Uhrzeit braucht es eine Einstellung, die es heute nicht gibt.

Optionen:
1. **Feste Uhrzeit** — Erinnerung kommt täglich zu einer eingestellten Uhrzeit; braucht eine neue Einstellung.
2. **Relativ zum Ablaufdatum** — z. B. 2 Tage vor Ablauf, gerechnet pro Eintrag.

---

**Frage 2 — Zustellung bei geschlossener App**

Soll die Erinnerung auch erscheinen, wenn die App nicht läuft?

- Warum das wichtig ist: entscheidet über Push-Infrastruktur gegenüber reiner In-App-Anzeige.
- Was sich dadurch ändert: Push bedeutet einen externen Dienst und damit eine Datenschutzfrage.

Optionen:
1. **Ja, auch bei geschlossener App** — Push, externer Dienst, Datenschutzfrage kommt dazu.
2. **Nein, nur in der App** — reine In-App-Anzeige, keine externe Infrastruktur.

---

**Frage 3 — Erledigte Einträge**

Was passiert mit einer Erinnerung, wenn der Eintrag vorher verbraucht wurde?

- Warum das wichtig ist: S2 und S3 überschneiden sich hier.
- Was sich dadurch ändert: entweder verschwindet die Erinnerung still, oder der Nutzer muss sie selbst schließen.

Optionen:
1. **Still verschwinden** — die Erinnerung wird automatisch entfernt.
2. **Nutzer schließt sie selbst** — die Erinnerung bleibt stehen, bis sie als erledigt markiert wird.

---

Ich beantworte nichts davon selbst — deine Antworten gehen wortwörtlich an den Groomer zurück.
