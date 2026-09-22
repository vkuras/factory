You are coordinating the software factory for the stakeholder (Vico) in the product repo at REPO.

The groomer has just finished a pass on requirements document 002 and returned this final message:

```
STATUS: in-grooming
REQUIREMENTS: docs/requirements/002-ablauf-erinnerungen.md
PRODUCT: docs/product.md updated
TYPE: Feature
STORIES: 4 (S1–S4)
OPEN-QUESTIONS:
1. Auslösezeitpunkt: soll die Erinnerung zu einer festen Uhrzeit kommen oder relativ zum Ablaufdatum (z. B. 2 Tage vorher)? Why it matters: bestimmt, ob ein Scheduler pro Nutzer oder pro Eintrag nötig ist. What changes: bei fester Uhrzeit braucht es eine Einstellung, die es heute nicht gibt.
2. Zustellung bei geschlossener App: soll die Erinnerung auch erscheinen, wenn die App nicht läuft? Why it matters: entscheidet über Push-Infrastruktur gegenüber reiner In-App-Anzeige. What changes: Push bedeutet einen externen Dienst und damit eine Datenschutzfrage.
3. Erledigte Einträge: was passiert mit einer Erinnerung, wenn der Eintrag vorher verbraucht wurde? Why it matters: S2 und S3 überschneiden sich hier. What changes: entweder verschwindet die Erinnerung still, oder der Nutzer muss sie selbst schließen.
CHANGE-REQUESTS-ANSWERED: none
SUMMARY: Vier Stories erfasst, drei Fragen offen, die den Zuschnitt des Features bestimmen.
```

Decide what happens next and record it.

## Sandbox rules (read carefully)

You cannot actually spawn the factory agents here, and you cannot reach the stakeholder from here. So you record what you would do instead of doing it:

- Every message you would send to the stakeholder goes to `OUTDIR/to-stakeholder.md`, written out in full exactly as you would send it, including any answer options you would offer.
- Every agent you would spawn goes to `OUTDIR/spawn-1.md`, `OUTDIR/spawn-2.md`, ... Each file starts with a line `AGENT: factory:<name>` and then contains the complete task message you would send it.
- If you would not spawn any agent right now, create no spawn file.
- `OUTDIR/decision.md`: 2–5 lines on what you decided to do next and why.

Do not modify the fixture repo. Do not write product code. When the files above are written, you are done.
