Bevor ich mit 002 weitermache, liegt noch eine offene Change Request, die dir noch niemand
vorgelegt hat: `docs/requirements/.change-requests/002-ablauf-erinnerungen.md`, CR1, vom
Architekten am 2026-09-19 aufgemacht.

**CR1 – Push-Zustellung gegen Selbst-Hosting**

Requirement (002, Stakeholder technical constraints):
> "Die Erinnerung soll auch ankommen, wenn die App zu ist."

Requirement (001, product-wide constraint):
> "Das Produkt läuft vollständig auf dem NAS im Haushalt. Keine Daten verlassen das Heimnetz."

Warum sie im Konflikt stehen: Zustellung bei geschlossener App braucht auf iOS und Android den
Push-Dienst des jeweiligen Herstellers. Dabei verlässt mindestens das Gerätetoken das Heimnetz,
was der produktweiten Einschränkung aus 001 widerspricht.

Resolution des Architekten: Hard constraints beat tool preferences, also wurde 001 vorgezogen.
Das Design liefert Erinnerungen nur in der App aus. Die Erinnerung bei geschlossener App entfällt.

Was dadurch verloren geht: Wer die App mehrere Tage nicht öffnet, sieht die Erinnerung nicht mehr
rechtzeitig. Genau der Fall, den S1 beschreibt.

Der Architekt schreibt dazu: "Der Stakeholder muss bestätigen oder umstoßen."

Deine Optionen:
- **Bestätigen**: Die Auflösung bleibt so, das Design gilt weiter als konsistent, und ich schicke
  002 direkt weiter an den Validator.
- **Umstoßen**: 002 geht zurück ans Grooming, das Requirement wird neu gefasst, und Architektur
  (und ggf. Implementierung) werden für 002 neu gemacht.

Was möchtest du?
