Stakeholder:
Wir brauchen Erinnerungen für Aufgaben. Die Leute vergessen ständig ihre Sachen. Am besten per Push, ich würd OneSignal nehmen, das kenn ich. Und am Wochenende soll keiner genervt werden.

Groomer:
Danke, guter Punkt. Ein paar Fragen, damit das Feature genau passt. Zu jeder Frage steht ein Vorschlag, ihr könnt einfach „ok" oder „anders: …" sagen.

1. **Wer wird erinnert?** Nur der zuständige Mitarbeiter, oder auch der Meister (zum Beispiel wenn etwas überfällig ist)?
   *Vorschlag:* Der Mitarbeiter bekommt die Erinnerung. Der Meister bekommt eine Meldung, wenn eine Aufgabe überfällig ist.

2. **Wann wird erinnert?** Das Fälligkeitsdatum ist ja nur ein Tag, ohne Uhrzeit.
   *Vorschlag:* Am Fälligkeitstag morgens um 7:00 Uhr. Ist die Aufgabe dann noch offen, kommt jeden Werktag erneut eine Erinnerung, bis sie erledigt ist.
   Soll es zusätzlich eine Erinnerung am Vortag geben?

3. **Einzeln oder gesammelt?** Eine Nachricht pro Aufgabe, oder eine Zusammenfassung am Morgen („Heute fällig: 3 Aufgaben")?
   *Vorschlag:* Eine Zusammenfassung pro Morgen, damit das Handy nicht dauernd klingelt.

4. **Aufgaben ohne Fälligkeitsdatum:** Sollen die gar nicht erinnert werden, oder zum Beispiel nach X Tagen ohne Erledigung?
   *Vorschlag:* Gar nicht.

5. **Wochenende:** Samstag und Sonntag kommt nichts, klar. Was passiert mit einer Aufgabe, die am Samstag fällig ist? Soll die Erinnerung am Freitag kommen oder am Montag? Und sollen Feiertage auch ruhig sein? Wenn ja: welches Bundesland?
   *Vorschlag:* Freitag. Feiertage bleiben ebenfalls ruhig.

6. **Abschalten:** Darf jeder Mitarbeiter die Erinnerungen für sich ausschalten, oder legt das nur der Meister fest?

7. **Push:** Nutzen die Leute Taskli als App auf dem Handy oder im Browser? Und was soll passieren, wenn jemand Push auf seinem Handy nicht erlaubt hat?
   OneSignal nehme ich als euren Wunsch mit. Die endgültige Technik entscheidet aber der Architekt. Ist OneSignal für euch ein Muss oder eine Vorliebe?

Stakeholder:
1. Ja, Mitarbeiter kriegt's, Meister nur wenn's überfällig ist.
2. Ein Tag vorher, morgens 7 Uhr. Am Fälligkeitstag selbst braucht's keine extra.
3. Passt so ne Zusammenfassung.
4. Ja gar nicht erinnern.
5. Freitag, und Feiertage natürlich auch nicht, wir sind in Bayern.
6. Nein, das legt der Meister fest, die Mitarbeiter können's nicht abschalten.
7. Alle haben Firmenhandy, is als App. OneSignal is mein Wunsch, muss aber nicht sein, das soll der Architekt entscheiden.

Groomer:
Danke, das meiste ist jetzt klar. Noch vier kurze Punkte:

1. **Überfällig-Meldung an den Meister:** Wann soll die kommen? Und wie oft?
   *Vorschlag:* Am ersten Werktag nach dem Fälligkeitstag um 7:00 Uhr, als Zusammenfassung („2 Aufgaben überfällig: …"). Das wiederholt sich jeden Werktag, solange die Aufgaben offen sind.
   Bekommt der Mitarbeiter bei Überfälligkeit auch noch etwas, oder nur der Meister?

2. **„Ein Tag vorher" heißt der vorherige Werktag.** Ist eine Aufgabe am Montag fällig, kommt die Erinnerung also am Freitag. Liegt der Tag vorher auf einem Feiertag, kommt sie am Werktag davor. Passt das so?

3. **Kurzfristige Aufgaben:** Der Meister legt heute um 10 Uhr eine Aufgabe an, die morgen fällig ist. Die 7-Uhr-Erinnerung ist dann schon vorbei. Ein anderer Fall: Die Aufgabe ist sogar heute fällig.
   *Vorschlag:* Keine eigene Erinnerung. Der Mitarbeiter sieht die Aufgabe ja in seiner Liste.
   Alternative: sofort eine Push-Nachricht „Neue Aufgabe, morgen fällig".

4. **Was genau legt der Meister fest?**
   a) nur Erinnerungen an oder aus für die ganze Firma
   b) an oder aus pro Mitarbeiter
   c) zusätzlich die Uhrzeit (statt fest 7:00 Uhr)

   *Vorschlag:* b. Die Uhrzeit bleibt fest um 7:00 Uhr.

Stakeholder:
1. Der Mitarbeiter kriegt seine Erinnerung ja schon täglich, das reicht. Der Meister braucht das nicht jeden Tag – erst nach 2 Werktagen überfällig, und dann nur einmal, nicht wiederholt.
2. Ja passt so.
3. Ok, keine extra Erinnerung, sieht er ja in der Liste.
4. Passt, Option b. Uhrzeit bleibt fest 7 Uhr, keine eigene Zeit pro Mitarbeiter.

Groomer:
Danke! Beim Mitarbeiter gibt es noch einen Widerspruch, den ich klären muss:

Sie schreiben, der Mitarbeiter kriegt seine Erinnerung „ja schon täglich". Bisher hatten wir aber nur **eine** Erinnerung festgelegt: am Werktag vor dem Fälligkeitstag um 7 Uhr. Am Fälligkeitstag selbst kommt keine, und danach auch nicht. Welche Variante soll es sein?

- **A)** Nur einmal, am Werktag vorher. Danach kommt für den Mitarbeiter nichts mehr, auch nicht wenn die Aufgabe überfällig ist.
- **B)** Am Werktag vorher, und danach **jeden Werktag** um 7 Uhr, solange die Aufgabe offen ist, auch am Fälligkeitstag und wenn sie überfällig ist. Alles kommt in derselben Morgen-Zusammenfassung.
- **C)** Am Werktag vorher, dann erst wieder jeden Werktag ab dem Moment, in dem die Aufgabe überfällig ist. Am Fälligkeitstag selbst kommt nichts.

Und damit ich die Meister-Meldung richtig aufschreibe, hier ein Beispiel: Eine Aufgabe ist am **Montag** fällig und bleibt offen. Dienstag ist sie 1 Werktag überfällig, Mittwoch 2 Werktage. Der Meister bekommt dann **am Mittwoch um 7 Uhr einmalig** eine Meldung zu dieser Aufgabe. Hat er am selben Morgen mehrere solche Aufgaben, kommen sie in einer Zusammenfassung. Stimmt das so?

Stakeholder:
C ist richtig. Am Fälligkeitstag selbst kommt nix, erst wenn's überfällig ist gehts täglich weiter.

Und das Meister-Beispiel stimmt so, genau.

Groomer:
Danke, die Anforderung ist fertig und geht an den Architekten. Kurz zusammengefasst:

**Mitarbeiter:**
- Er bekommt um 7:00 Uhr eine Morgen-Zusammenfassung, am Werktag vor dem Fälligkeitstag.
- Am Fälligkeitstag selbst kommt nichts.
- Ab dem ersten Werktag danach kommt jeden Werktag eine Erinnerung, bis die Aufgabe erledigt ist.

**Meister:** Er bekommt einmalig eine Meldung am 2. Werktag nach dem Fälligkeitstag, wenn die Aufgabe noch offen ist.

**Allgemein:**
- Nur Aufgaben mit Fälligkeitsdatum werden erinnert.
- Am Wochenende und an bayerischen Feiertagen kommt nichts. Die Erinnerung kommt stattdessen vorher.
- Der Meister schaltet die Erinnerungen pro Mitarbeiter an oder aus.
- OneSignal steht als euer Wunsch drin. Entscheiden wird es der Architekt.

Folgendes habe ich angenommen. Bitte kurz Bescheid geben, falls etwas nicht stimmt:
- **Feiertage:** Die bayernweiten Feiertage inklusive Mariä Himmelfahrt (15.8.) zählen. Das Augsburger Friedensfest zählt nicht. Heiligabend und Silvester sind normale Werktage.
- **Neue Mitarbeiter:** Bei ihnen sind die Erinnerungen standardmäßig an.
- **Verschobenes Datum:** Verschiebt der Meister das Fälligkeitsdatum einer überfälligen Aufgabe, kann er später noch einmal eine Meldung zu dieser Aufgabe bekommen.

Eine offene Frage für später: Soll der Meister sehen können, ob das Handy eines Mitarbeiters Push-Nachrichten überhaupt empfängt? Das ist im Moment nicht enthalten.

Dateien:
- `docs/requirements/002-task-reminders.md`
- `docs/product.md`: Glossar und Index ergänzt
