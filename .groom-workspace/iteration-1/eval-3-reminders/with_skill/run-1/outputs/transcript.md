Stakeholder: Wir brauchen Erinnerungen für Aufgaben. Die Leute vergessen ständig ihre Sachen. Am besten per Push, ich würd OneSignal nehmen, das kenn ich. Und am Wochenende soll keiner genervt werden.

Groomer: Mein Verständnis: Bei Taskli vergessen Gesellen und Azubis ihre zugewiesenen Aufgaben. Deshalb soll Taskli sie mit einer Push-Nachricht aufs Firmenhandy aktiv an ihre Aufgaben erinnern, statt nur darauf zu warten, dass sie selbst in die Liste schauen. Am Wochenende soll dabei keiner gestört werden. OneSignal habe ich als deine Vorgabe notiert.

Ein Punkt vorab: Das Fälligkeitsdatum in Taskli ist heute nur ein Tag, ohne Uhrzeit. Deshalb muss ich wissen, **wann** erinnert wird.

1. **Wann soll erinnert werden?**
   a) Jeden Werktag morgens um eine feste Uhrzeit (z. B. 7:00) eine Nachricht mit allem, was heute fällig oder schon überfällig ist.
   b) Einmal am Tag vor der Fälligkeit.
   c) a + b kombiniert.
   d) Die Uhrzeit wird pro Aufgabe festgelegt.
   (Empfehlung: a. Das ist einfach und passt zum Arbeitsbeginn auf der Baustelle. Wenn du das nimmst: Welche Uhrzeit?)

2. **Überfällige Aufgaben:** Aufgabe von Geselle Tim war Dienstag fällig, er hat sie nicht abgehakt. Wird er ab Mittwoch jeden Werktag weiter erinnert, bis sie erledigt ist? Oder nur einmal?

3. **Wer wird erinnert?** Nur der Zuständige? Oder soll auch der Meister etwas bekommen, z. B. „Bei Tim sind 2 Aufgaben überfällig“?

4. **Wochenende:** Heißt das Samstag *und* Sonntag? Und eine Aufgabe, die am Montag fällig ist: Wird die trotzdem erst Montag früh gemeldet? Sollen Feiertage genauso behandelt werden wie das Wochenende?

Stakeholder: a) genau, morgens 7 uhr, alles was fällig oder überfällig ist. bei Tim: jeden werktag weiter erinnern bis erledigt, ab dem dritten überfälligen werktag kriegt der meister auch einmal bescheid. erinnert wird nur der zuständige, meister nur bei überfällig wie gesagt. wochenende ist sa+sonntag, feiertage natürlich auch nicht, wir sind in bayern. montag fällige aufgabe wird erst montag früh gemeldet.

Groomer: Das ist klar, danke. Ich prüfe noch, ob ich die Zählung für den Meister richtig verstanden habe.

1. **Meister-Meldung, Beispiel:** Tims Aufgabe „Zählerschrank Müller“ ist Dienstag fällig. Mittwoch ist der 1. überfällige Werktag, Donnerstag der 2., Freitag der 3. Der Meister bekommt also am **Freitag um 7:00** einmalig: „Tim: Zählerschrank Müller seit Di überfällig“. Liegt ein Feiertag dazwischen, zählt er nicht mit. Stimmt das so?
   Dazu zwei Punkte:
   - Wenn an einem Morgen mehrere Aufgaben gleichzeitig die Schwelle erreichen: a) eine gesammelte Nachricht an den Meister oder b) eine Nachricht pro Aufgabe? (Empfehlung: a, damit sein Handy nicht zehnmal vibriert)
   - Wenn der Meister die überfällige Aufgabe an Jonas umhängt: Beginnt die Zählung neu, oder zählt weiter das ursprüngliche Fälligkeitsdatum? (Und bekommt Jonas ab dem nächsten Morgen die Erinnerung?)

2. **Feiertage Bayern:** Zählen alle bayernweiten gesetzlichen Feiertage inklusive Mariä Himmelfahrt (15.8.), aber ohne das Augsburger Friedensfest, das nur in Augsburg gilt? Und gibt es Betriebsurlaub, zum Beispiel zwischen Weihnachten und Neujahr, an dem auch keine Erinnerung kommen soll? Urlaub oder Krankheit einzelner Mitarbeiter würde ich vorerst als „Später“ parken, wenn das für dich passt.

3. **Benachrichtigungen blockiert:** Ein Azubi schaltet Benachrichtigungen für Taskli auf seinem Handy aus. Soll a) die App ihn beim Öffnen deutlich darauf hinweisen und b) der Meister sehen, wer keine Erinnerungen bekommt? Oder ist dir das egal? (Empfehlung: a+b, sonst fällt das Ausbleiben niemandem auf. In der App ausschalten kann man die Erinnerungen dann nicht.)

Folgendes lege ich selbst fest, widersprich gern:
- Wenn nichts fällig oder überfällig ist, kommt keine Nachricht.
- Aufgaben ohne Fälligkeitsdatum lösen nie eine Erinnerung aus.
- Ein Tipp auf die Erinnerung öffnet die eigene Liste mit offenen Aufgaben.

Stakeholder: ja stimmt so. gesammelte nachricht, nicht zehn einzelne. bei umhängen: zählung geht weiter mit dem original-fälligkeitsdatum, ist ja immer noch die gleiche aufgabe. jonas kriegt ab dem nächsten morgen die normale erinnerung, ja.

feiertage: alle bayernweiten, mariä himmelfahrt zählt, augsburger friedensfest nicht, ist ja nur lokal. betriebsurlaub weihnachten/neujahr - guter punkt, ja da auch keine erinnerung, das soll aber der meister iwo einstellen können, kein hardcoded datum. urlaub/krankheit einzelner leute - ja später, passt.

benachrichtigungen blockiert: a+b ja gerne, sonst merkt's keiner.

Groomer: Alles klar, notiert. Drei letzte Punkte, dann fasse ich zusammen:

1. **Betriebsurlaub:** Der Meister trägt in Taskli einen oder mehrere Zeiträume ein (von–bis) und kann sie jederzeit ändern oder löschen. Diese Tage gelten wie Feiertage: keine Erinnerungen, und sie zählen nicht zu den 3 überfälligen Werktagen. Am ersten Arbeitstag danach kommt um 7:00 die normale Erinnerung mit allem, was fällig oder überfällig ist. Passt das?

2. **Fälligkeitsdatum geändert:** Das ist etwas anderes als das Umhängen. Tims Aufgabe ist seit Dienstag überfällig, und der Meister verschiebt sie auf nächsten Mittwoch. Dann gilt ab sofort das neue Datum. Tim wird erst wieder am neuen Tag erinnert, und die Zählung für den Meister beginnt neu. Wird die Aufgabe dann wieder 3 Werktage überfällig, bekommt der Meister erneut eine Meldung. Einverstanden?

3. **Meister-Gerät:** Du sitzt meistens am Laptop. Hast du Taskli auch auf dem Handy, und reicht es, wenn die Meldung „3 Tage überfällig“ als Push aufs Handy kommt?
   a) ja, Push aufs Handy reicht
   b) zusätzlich soll die Meldung am Laptop sichtbar sein
   (Empfehlung: a. Überfällige Aufgaben siehst du am Laptop ohnehin in der Übersicht.)

Folgendes lege ich selbst fest:
- Der Meister wird pro Aufgabe nur einmal informiert, auch nach dem Umhängen (außer beim Fall in Punkt 2).
- Wer Benachrichtigungen blockiert hat, bekommt in der Meister-Ansicht eine sichtbare Markierung neben seinem Namen.
- In der Erinnerung an den Mitarbeiter stehen die Anzahl und die Titel der fälligen und überfälligen Aufgaben.

Stakeholder: 1. ja passt so.
2. ja einverstanden, neues datum, zählung von vorne.
3. a, push aufs handy reicht, hab taskli auch am handy.

Groomer: Danke, damit sind alle Fragen geklärt. Ich fasse jetzt in kurzen Abschnitten zusammen, wie ich es verstanden habe. Bitte kurz bestätigen oder korrigieren.

**Teil 1 von 4: Ziel und Beteiligte**
Gesellen und Azubis vergessen ihre Aufgaben. Deshalb erinnert Taskli sie künftig aktiv per Push auf dem Firmenhandy an alles, was heute fällig oder schon überfällig ist. Erinnert wird nur der Zuständige für die Aufgabe. Der Meister bekommt nur dann Bescheid, wenn eine Aufgabe mehrere Werktage überfällig ist. So muss er nicht selbst nachhaken, erfährt aber, wenn etwas liegen bleibt. An Wochenenden, Feiertagen und im Betriebsurlaub wird niemand gestört.

Passt das?

Stakeholder: ja passt.

Groomer: **Teil 2 von 4: Die Abläufe**
- **Mitarbeiter:** An jedem Arbeitstag um 7:00 bekommt Tim eine Push-Nachricht mit allen seinen Aufgaben, die heute fällig oder überfällig sind, jeweils mit Anzahl und Titel. Tippt er darauf, öffnet sich seine Liste mit offenen Aufgaben. Das wiederholt sich jeden Arbeitstag, bis er die Aufgabe als erledigt markiert. Ist nichts fällig, kommt keine Nachricht. Aufgaben ohne Fälligkeitsdatum lösen nie eine Erinnerung aus.
- **Meister:** Am 3. überfälligen Arbeitstag einer Aufgabe bekommt der Meister um 7:00 eine Push-Nachricht aufs Handy, zum Beispiel: fällig Dienstag, Meldung Freitag. Erreichen mehrere Aufgaben gleichzeitig diese Schwelle, kommt eine gesammelte Nachricht. Pro Aufgabe gibt es die Meldung nur einmal.
- **Betriebsurlaub:** Der Meister trägt einen oder mehrere Zeiträume ein und kann sie ändern oder löschen.

Passt das?

Stakeholder: ja passt.

Groomer: **Teil 3 von 4: Regeln und Sonderfälle**
- **Arbeitstag:** Montag bis Freitag, außer an allen bayernweiten gesetzlichen Feiertagen und an eingetragenen Tagen im Betriebsurlaub. Mariä Himmelfahrt zählt als Feiertag, das Augsburger Friedensfest nicht. Eine Aufgabe, die am Wochenende oder am Montag fällig ist, erscheint erst in der Erinnerung am Montag um 7:00.
- **Umhängen:** Die Zählung läuft mit dem ursprünglichen Fälligkeitsdatum weiter. Der neue Zuständige bekommt ab dem nächsten Morgen die Erinnerung. Der Meister wird nicht noch einmal informiert.
- **Datum verschoben:** Es gilt das neue Datum, und die Zählung beginnt von vorne. Wird die Aufgabe wieder überfällig, kann der Meister erneut eine Meldung bekommen.
- **Benachrichtigungen blockiert:** Der Mitarbeiter sieht beim Öffnen der App einen deutlichen Hinweis. Der Meister sieht neben seinem Namen eine Markierung. In der App kann man die Erinnerungen nicht abschalten.

Passt das?

Stakeholder: ja passt.

Groomer: **Teil 4 von 4: Umfang und Entscheidungen**
- **Drin:** die tägliche Erinnerung für Mitarbeiter, die Meldung an den Meister nach 3 überfälligen Arbeitstagen, Betriebsurlaub einstellen, der Hinweis bei blockierten Benachrichtigungen.
- **Später:** Urlaub und Krankheit einzelner Mitarbeiter.
- **Nicht drin:** eine Uhrzeit pro Aufgabe, Erinnerungen per SMS oder E-Mail, Erinnerungen in der App abschalten.
- **Deine Vorgabe:** OneSignal geht so an den Architekten.
- **Von mir festgelegt, von dir abgenickt:** Wenn nichts fällig ist, kommt keine Nachricht. Aufgaben ohne Datum lösen keine Erinnerung aus. Ein Tipp auf die Erinnerung öffnet die Aufgabenliste.

Damit ist alles, was du gesagt hast, im Dokument untergebracht. Offene Punkte gibt es keine. Passt das so? Dann schreibe ich das Dokument für den Architekten.

Stakeholder: passt, schreib's auf.

Groomer: Fertig. Das Dokument liegt unter `docs/requirements/002-task-reminders.md`. Die neuen Begriffe wie Arbeitstag, Betriebsurlaub und Erinnerung stehen jetzt auch in `docs/product.md`. Es ist bereit für den Architekten, du musst nichts mehr lesen.
