Vico, ich stoppe 002 hier und brauche eine Entscheidung von dir.

**Was los ist:** Implementer und Validator drehen sich seit sechs Runden im Kreis. Jede Runde schließt ihre Findings sauber, und jede Runde erzeugt ein neues. Von innen sieht das für beide Agenten wie normaler Fortschritt aus – die sechs Runden sieht nur ich.

**Das Muster (aus `docs/.factory/run-002.md`):**

| Runde | Finding geschlossen | Neues Finding |
|---|---|---|
| 1 | F1, F2 | – |
| 2 | F1 | F3 – Übersicht 240 ms |
| 3 | F3 (via Index) | F4 – Erinnerung doppelt |
| 4 | F4 | F5 – Übersicht 310 ms |
| 5 | F5 (via Cache) | F6 – Cache stale |
| 6 | F6 | **F7 – Übersicht 260 ms**, **F8 – Erinnerung für erledigten Eintrag erscheint nach Cache-Invalidierung erneut** |

Es sind immer dieselben zwei Findings, abwechselnd: **Performance** (F3, F5, F7) und **Korrektheit der Erinnerungen / Cache** (F4, F6, F8). Der Cache, der die 200-ms-Grenze halten soll, ist genau das, was die Erinnerungen falsch macht – und wenn er korrekt invalidiert wird, reißt die Zeit wieder. Die Regression ist in allen Runden grün, es gibt keine offenen Gaps und keine Change Requests. Das konvergiert nicht von allein.

**Die Anforderung, um die es geht** (`docs/requirements/002-ablauf-erinnerungen.md`):
> Die Übersicht der ablaufenden Einträge lädt in unter 200 ms bei 5000 Einträgen.

**Zum Nachlesen:** `docs/validation/002-ablauf-erinnerungen.md` (Runde 7, F7 + F8), `docs/.factory/run-002.md`.

Ich route nicht weiter, bevor du entschieden hast. Frage:

**Wie soll es mit 002 weitergehen?**

- **Anforderung lockern** – Die 200-ms-Grenze ist das, woran sich alles aufhängt. Wenn ein anderer Wert (z. B. 300 ms) oder eine kleinere Datenmenge für dich in Ordnung ist, geht 002 zurück in die Grooming-Runde und danach direkt in die Validierung. Sag mir welchen Wert – ich setze keinen selbst ein.
- **Design ändern** – Anforderung bleibt bei 200 ms, aber der Architekt bekommt Performance und Cache-Korrektheit als ein Problem auf den Tisch (statt dass der Implementer sie abwechselnd gegeneinander löst). Kostet eine Architektur-Runde plus Neuimplementierung, ist aber die Variante, die beide Ziele halten kann.
- **Stand akzeptieren** – 002 wird mit 260 ms und der Doppel-Erinnerung so abgenommen, wie es ist; ich lasse festhalten, was damit bewusst offen bleibt. Schnell, aber die Doppel-Erinnerung für erledigte Einträge sieht dein Nutzer.
- **002 hier beenden** – Dokument wird gestoppt, nichts wird abgenommen, der Branch bleibt liegen. Sinnvoll, wenn das Feature gerade nicht die Zeit wert ist.

Wenn dir keine der vier passt oder du es anders schneiden willst: sag es einfach frei heraus, ich nehme das so auf.
