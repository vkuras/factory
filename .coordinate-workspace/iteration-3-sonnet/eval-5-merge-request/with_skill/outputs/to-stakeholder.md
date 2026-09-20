Vico,

002 – Ablauf-Erinnerungen ist fertig:

- **Validierung:** Validated, Runde 2. 0 blockierende und 0 kleinere Findings offen.
  F1 (Erinnerung feuerte an der Monatsgrenze einen Tag zu spät) wurde in Runde 2
  behoben und mit eigenen Reproduktionsschritten verifiziert.
- **Regression:** die volle automatisierte Suite plus die Akzeptanztests von 001
  sind grün (31 Tests).
- **Branch:** feature/002-ablauf-erinnerungen, 2 Commits über main
  (a1ed209 feat(002): expiry reminders, 1af25a9 test(002): acceptance tests and
  validation round 2).
- **Dokumente:**
  - Requirements: docs/requirements/002-ablauf-erinnerungen.md
  - Design: docs/architecture/002-ablauf-erinnerungen.md
  - Implementierungsbericht: docs/implementation/002-ablauf-erinnerungen.md
  - Validierungsbericht: docs/validation/002-ablauf-erinnerungen.md
- **Offen:** nichts. Die Validierung merkt nur als Beobachtung an, dass die
  Erinnerungsliste nach Ablaufdatum sortiert ist, ohne dass das gefordert war —
  das ist keine offene Anforderung.

Soll ich feature/002-ablauf-erinnerungen zu origin pushen und eine Merge Request
dagegen öffnen? Das Repo hat einen Remote (origin, ein lokales bare-Repo), der
Branch liegt 2 Commits vor main, und der Arbeitsbaum ist sauber. Hinweis: weder
`gh` noch `glab` ist hier installiert, ich würde also pushen und dir die
Compare-URL plus fertigen Titel/Text zum manuellen Öffnen der MR geben, statt
sie selbst anzulegen.
