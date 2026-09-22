002 validiert, Runde 1: **Changes requested** – 1 blocking, 2 minor.

- **F1 (blocking, Design):** Die Suche matcht nur ein case-sensitives Präfix des Titels, statt „enthält, egal welche Groß-/Kleinschreibung" (S5.1–S5.3, S6.2, R4). Das Demo-Beispiel des Stakeholders scheitert: bei 500 Tasks, davon 50 mit „milk" im Titel, zeigt die UI `No task matches "milk".` Ursache ist das Design (`docs/architecture/002-find-a-task.md`, §Interfaces), nicht der Implementer – deshalb Gap **G1** in `docs/architecture/.gaps/002-find-a-task.md`. Das Performance-Argument des Designs hält der Messung nicht stand: die unfilterte 500-Task-Antwort (größer als alles, was die geforderte Regel erzeugt) liegt bei p95 5,22 ms gegen 500 ms.
- **F2 (minor):** In `public/app.js` registrieren `toggle()`, `destroy()` und der Submit-Handler bei jedem Klick einen weiteren `input`-Listener – nach 3 Aktionen 4 Requests pro Tastendruck, unbegrenzt wachsend. QE5 bricht dadurch heute nicht (10× Amplifikation: p95 9,96 ms).
- **F3 (minor):** `node scripts/seed.js 500 …` aus dem Implementation-Report bricht mit `SyntaxError: Unexpected token '||'` ab (`??` und `||` gemischt); die QE5-Evidenz des Implementers kann so nicht entstanden sein.

Bestanden: S5.4, S5.5, S6.1, S6.3, R5, alle Out-of-scope-Punkte, QE5 (10 parallele Sucher, 500 Tasks: p95 3,92 ms, 0 % Fehler), QE6 (28 MiB von 256 MiB, kein OOM), QE7.

Regression grün: 15/15 Unit-Tests, 11/11 Acceptance-Tests 001, 001er Constraints (R2 nach `down`+`up`, QE1 auf 375×812, QE3, QE4 p95 5 ms) mit 500 Tasks nachgeprüft. 002-Acceptance: 11/17, die 6 Fehlschläge sind alle F1.

Routing: erst Architect (G1), dann Implementer (F1 nach Design-Update, F2, F3). Report: `docs/validation/002-find-a-task.md`, Tests: `tests/acceptance/002-find-a-task/` (inkl. k6-Lasttest in `perf/search.js`), Commit `84c864f`.
