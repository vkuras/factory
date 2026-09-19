# Transcript

Stakeholder:
Wir brauchen Erinnerungen für Aufgaben. Die Leute vergessen ständig ihre Sachen. Am besten per Push, ich würd OneSignal nehmen, das kenn ich. Und am Wochenende soll keiner genervt werden.

Groomer:
So hab ich das verstanden: In Taskli bleiben Aufgaben liegen, weil Gesellen und Azubis im Tagesgeschäft auf der Baustelle vergessen, was ihnen zugewiesen ist. Mit dem neuen Feature meldet sich Taskli von selbst per Push-Nachricht auf dem Firmenhandy und erinnert an offene Aufgaben. Am Wochenende kommen keine Nachrichten. OneSignal notiere ich als deine Vorgabe für die Technik.

Ein paar Fragen dazu:

1. **Wann soll eine Erinnerung kommen?** Beschreib mir am besten einen typischen Fall: Ein Geselle hat eine Aufgabe, die Donnerstag fällig ist. Wann und wie oft soll sein Handy sich melden?
2. **Was wird eigentlich vergessen?** Aufgaben, die heute fällig sind, welche, die schon überfällig sind, oder auch Aufgaben ganz ohne Fälligkeitsdatum?
3. **Wer bekommt Erinnerungen?** Nur die zugewiesene Person oder auch du als Meister, zum Beispiel wenn etwas überfällig ist?
4. **Wochenende:** Wird bei euch auch mal samstags gearbeitet? Und wenn eine Erinnerung eigentlich auf Samstag oder Sonntag fallen würde: Soll sie ganz entfallen oder am Montag bzw. schon am Freitag kommen?

Stakeholder:
Also, Donnerstag fällig heißt Erinnerung Mittwoch 7 Uhr früh, einmal. Vergessen wird eig alles: fällige Aufgaben (Erinnerung 1 Tag vorher) und überfällige (jeden Werktag 7 Uhr). Ohne Fälligkeitsdatum brauch ma nix erinnern, macht kein Sinn. Erinnerung geht an den, der die Aufgabe hat. Wenn was 2 Werktage überfällig is, krieg ich als Meister auch einmal Bescheid. Am Wochenende und an Feiertagen (sind ja in Bayern) fällt die Erinnerung einfach komplett weg, nicht verschieben, brauchts nicht.

Groomer:
Danke, das ist schon sehr klar. So wie ich's verstehe: Ist eine Aufgabe Donnerstag fällig, kommt Mittwoch um 7 Uhr eine Erinnerung an den Zuständigen. Ist sie Donnerstag nicht erledigt, kommt ab Freitag jeden Werktag um 7 Uhr eine Erinnerung. Am Montag ist sie dann 2 Werktage überfällig (Freitag und Montag), und du bekommst einmalig Bescheid. Wochenenden und bayerische Feiertage zählen dabei nicht als Werktage. Stimmt die Zählung so?

Deine Regel „wegfallen, nicht verschieben“ hat eine Folge, die ich kurz ansprechen will, und ein paar Fragen dazu:

1. **Aufgaben, die Montag fällig sind:** Die Erinnerung „1 Tag vorher“ fällt auf Sonntag und entfällt. Montagsaufgaben bekämen also nie eine Vorab-Erinnerung, genauso wenig Aufgaben am Tag nach einem Feiertag. Passt das so, oder soll die Vorab-Erinnerung dann am letzten Werktag davor kommen (also Freitag)?
2. **Am Fälligkeitstag selbst:** Donnerstag kommt nichts, erst Freitag geht's mit „überfällig“ los. Richtig so?
3. **Mehrere Aufgaben:** Wenn ein Geselle morgens 4 Aufgaben hat, die fällig oder überfällig sind, bekommt er dann 4 einzelne Nachrichten oder eine Sammelnachricht („Du hast 4 Aufgaben: …“)?
4. **„Am besten per Push“:** Wenn jemand Push auf seinem Handy ausgeschaltet hat, bekommt er keine Erinnerung. Reicht das, oder brauchst du dann einen anderen Weg (z. B. E-Mail)?

Stakeholder:
1. ja passt, dann fällt die Vorab-Erinnerung halt weg, brauchma nicht extra auf Freitag verschieben.
2. ja richtig, am Fälligkeitstag selbst kommt nix, erst am Tag drauf gehts los mit überfällig.
3. eine Sammelnachricht, sonst nervt das ja nur wenn er 4 einzelne kriegt.
4. dann is Pech, kein E-Mail, nur Push. Wer's ausgeschaltet hat, muss selber schaun dass er's anmacht.

Groomer:
Alles klar, dann ist das Verhalten für mich rund. Bevor ich was aufschreibe, geh ich meine Zusammenfassung kurz in 4 Häppchen mit dir durch. Sag jeweils einfach „passt“ oder korrigier mich.

**Teil 1: Ziel und Beteiligte**
Gesellen und Azubis vergessen Aufgaben, die ihnen zugewiesen sind, und du merkst es oft erst, wenn es zu spät ist. Deshalb erinnert Taskli sie künftig von selbst per Push auf dem Firmenhandy: einmal am Tag vor der Fälligkeit und danach jeden Werktag, solange die Aufgabe überfällig ist. Du als Meister bekommst nur dann einmal Bescheid, wenn eine Aufgabe 2 Werktage überfällig ist. Du selbst wirst nicht an Aufgaben erinnert. Aufgaben ohne Fälligkeitsdatum lösen nie eine Erinnerung aus.

Passt das?

Stakeholder:
passt

Groomer:
**Teil 2: So läuft's ab (Beispiel)**
Tom hat 3 Aufgaben: Aufgabe A ist Donnerstag fällig, B war schon Dienstag fällig, C hat kein Datum. Am Mittwoch um 7 Uhr bekommt Tom eine einzige Sammelnachricht mit zwei Abschnitten: „morgen fällig: A“ und „überfällig: B“. Jede Aufgabe steht mit Titel und Kunde drin, C taucht nicht auf. Tippt er auf die Nachricht, öffnet sich seine Aufgabenliste in Taskli. Am Donnerstag steht A nicht drin, weil am Fälligkeitstag selbst keine Erinnerung kommt. Hakt Tom A nicht ab, steht sie ab Freitag jeden Werktag unter „überfällig“. Sobald er sie erledigt hat, taucht sie nicht mehr auf.

Am Montag ist A 2 Werktage überfällig (Freitag und Montag). Dann bekommst du um 7 Uhr einmal eine Nachricht. Werden mehrere Aufgaben am selben Tag 2 Werktage überfällig, bekommst du auch dafür nur eine Sammelnachricht. Deckt sich das mit deiner Vorstellung?

Stakeholder:
größtenteils passt, aber beim Tippen soll sich nicht einfach die Liste öffnen, sondern gleich die jeweilige Aufgabe direkt.

Groomer:
Verstanden, beim Tippen soll direkt die Aufgabe aufgehen. Das beißt sich aber ein bisschen mit der Sammelnachricht. Wenn nur eine Aufgabe drinsteht, ist klar, welche aufgeht. Aber wenn Tom eine Nachricht mit A und B bekommt und draufdrückt: Was soll sich dann öffnen? Wie stellst du dir das vor?

Das Gleiche gilt für deine Meister-Nachricht, wenn mehrere Aufgaben drinstehen.

Stakeholder:
dann bei mehreren halt einfach die Liste mit den offenen/überfälligen Aufgaben aufmachen, ned einzeln raten welche. Bei einer Aufgabe direkt die Aufgabe, bei mehreren die Liste.

Groomer:
Gut, dann so: Steht nur eine Aufgabe in der Nachricht, öffnet sich direkt diese Aufgabe. Stehen mehrere drin, öffnet sich beim Gesellen seine Liste mit den offenen Aufgaben. Bei dir öffnet sich deine Übersicht aller Aufgaben, so wie du sie heute schon hast. Eine neue Extra-Ansicht nur für Überfälliges bau ich nicht ein.

**Teil 3: Regeln und Sonderfälle**
- Nachrichten kommen nur an Werktagen um 7 Uhr. An Samstagen, Sonntagen und bayerischen Feiertagen entfallen sie ersatzlos, auch die Meister-Nachricht. Wird z. B. an einem Samstag etwas 2 Werktage überfällig, kommt deine Meldung am Montag.
- Aufgaben, die am Montag oder am Tag nach einem Feiertag fällig sind, bekommen keine Vorab-Erinnerung.
- Erledigte Aufgaben lösen nichts mehr aus. Wird eine Aufgabe umverteilt, gehen die Erinnerungen ab dann an den neuen Zuständigen. Überfällig bleibt überfällig, der Zähler fängt nicht neu an.
- Wird das Fälligkeitsdatum geändert, zählt nur noch das neue Datum. Dann kannst du für dieselbe Aufgabe auch ein zweites Mal Bescheid bekommen.
- Wird eine Aufgabe nach 7 Uhr angelegt oder geändert, kommt nichts nachgeschoben. Sie ist ab dem nächsten regulären Termin dabei.
- Wer Push ausgeschaltet hat, bekommt nichts. Auch im Urlaub oder bei Krankheit kommen Erinnerungen, weil Taskli Abwesenheiten nicht kennt. Da musst du im Zweifel umverteilen.

Eine Frage noch zu den Feiertagen: Mariä Himmelfahrt (15.8.) ist nur in katholisch geprägten Gemeinden frei, das Augsburger Friedensfest (8.8.) nur in Augsburg. Zählen die beiden bei euch als Feiertag?

Stakeholder:
passt so. Feiertage: die zwei Sonderfälle lass ma weg, mir san nicht in Augsburg und net kirchlich geprägt, reichen die normalen bayerischen Feiertage.

Groomer:
Notiert: die normalen bayerischen Feiertage, ohne 15.8. und 8.8.

**Teil 4: Umfang und meine letzten Annahmen**
- **Drin:** die Sammel-Erinnerung für Gesellen und Azubis (morgen fällig und überfällig), die einmalige Meister-Meldung ab 2 Werktagen Verzug, die Regeln für Wochenende und Feiertage und das Öffnen der Aufgabe bzw. Liste beim Tippen.
- **Bewusst nicht drin:** E-Mail oder andere Kanäle, Erinnerungen für Aufgaben ohne Datum, das Verschieben von Erinnerungen, eine Einstellung zum Abschalten oder eigene Uhrzeiten pro Person, Urlaubs- oder Abwesenheitsverwaltung und eine eigene Überfällig-Ansicht für dich.
- **Meine Annahmen:** Die Nachrichten sind auf Deutsch, 7 Uhr bedeutet deutsche Zeit, und wer an einem Tag nichts Fälliges oder Überfälliges hat, bekommt gar keine Nachricht. OneSignal gebe ich dem Architekten als deine Vorgabe mit.

Damit ist alles, was du gesagt hast, entweder eingeplant oder bewusst ausgeschlossen. Nichts ist offen geblieben. Passt das so, dann schreib ich's fertig?

Stakeholder:
passt, schreib's auf

Groomer:
Ist aufgeschrieben: `docs/requirements/002-task-reminders.md`. Die Begriffe hab ich außerdem in `docs/product.md` eingetragen. Alles, was wir besprochen haben, steht drin, und es ist nichts offen. Das Dokument geht jetzt an den Architekten, du musst es nicht lesen.
