Stakeholder:
Ich brauch ne Einkaufsliste. Ich will aus Rezepten die Zutaten auf ne Liste packen. Vielleicht kann man auch Vorräte abhaken, weiß nicht. Sync am besten über Firebase.

Groomer:
So wie ich es verstehe: In eurer Rezepte-App fehlt der Schritt vom Rezept zum Einkauf. Du willst bei einem Rezept sagen können „das koche ich“, und die Zutaten landen auf einer Einkaufsliste, die ihr dann im Laden benutzt. Ob man dabei Sachen rausnehmen kann, die ihr schon zu Hause habt, ist noch offen. Firebase notiere ich als deine technische Vorgabe für den Architekten.

Meine ersten Fragen:

1. **Wer benutzt die Liste?** Beispiel: Anna setzt zu Hause die Lasagne auf die Liste, Ben steht gerade im Supermarkt. Soll Ben das sofort sehen? Und wenn er Hackfleisch abhakt, soll Anna das auch sehen?
   a) Eine gemeinsame Liste für den ganzen Haushalt, alle sehen Änderungen sofort (Empfehlung, passt zu eurem Haushaltsmodell)
   b) Jede Person hat ihre eigene Liste
   Und: Muss die Liste im Laden auch ohne Netz funktionieren?

2. **Wie kommen die Zutaten auf die Liste?** Wenn du die Lasagne von 4 auf 6 Portionen stellst, sollen dann die Mengen für 6 übernommen werden? Und wenn Lasagne und Pfannkuchen beide Mehl brauchen (300 g und 200 g), soll auf der Liste ein Eintrag „500 g Mehl“ stehen oder zwei getrennte Einträge?

3. **Was meinst du mit „Vorräte abhaken“?**
   a) Beim Übernehmen eines Rezepts wählst du Zutaten ab, die du schon da hast (Salz, Öl). Die kommen dann gar nicht erst auf die Liste. (Empfehlung: einfach und deckt meistens den Zweck)
   b) Ein dauerhafter Vorratsbestand in der App, von dem automatisch abgezogen wird
   c) Du meinst eigentlich das Abhaken im Laden, sobald etwas im Wagen liegt
   d) Weiß ich noch nicht, lieber später

4. **Nur Rezeptzutaten oder auch eigene Einträge?** Also zum Beispiel „Klopapier“ von Hand dazuschreiben.

Stakeholder:
1. Ne gemeinsame Liste für den Haushalt, alle sehen sofort was sich ändert. Offline im Laden muss auch klappen, sonst nutzlos.
2. Ja, Mengen für die gewählten Portionen. Und wenn zwei Rezepte Mehl brauchen, bitte zusammenfassen zu einem Eintrag, nicht zwei.
3. a) - beim Hinzufügen abwählen was schon da ist. Kein Vorratsmanagement, nur beim Hinzufügen wegklicken.
4. Ja, eigene Einträge wie Klopapier müssen auch gehen.

Groomer:
Danke, das ist klar. Festgehalten: eine gemeinsame Haushaltsliste, die live aktualisiert wird und im Laden auch offline funktioniert. Mengen werden für die gewählten Portionen übernommen, gleiche Zutaten zusammengefasst, Vorhandenes klickt man beim Hinzufügen weg, eigene Einträge gehen auch. Ein Vorratsmanagement gibt es nicht.

Nächste Runde:

1. **Zusammenfassen bei unterschiedlichen Einheiten oder Namen.** Die Lasagne braucht „200 g Mehl“, die Pfannkuchen „2 EL Mehl“. Oder das eine Rezept sagt „Mehl“, das andere „Weizenmehl“.
   a) Zusammengefasst wird nur bei exakt gleichem Namen *und* gleicher Einheit. Sonst gibt es zwei Einträge untereinander. (Empfehlung: da wird nie etwas falsch umgerechnet)
   b) Die App soll Einheiten umrechnen (EL in g usw.)
   Außerdem: Soll man bei einem Eintrag sehen, aus welchen Rezepten er kommt, etwa „500 g Mehl (Lasagne, Pfannkuchen)“?

2. **Abhaken und Aufräumen.** Ben hakt im Laden alles ab. Was passiert mit den abgehakten Einträgen?
   a) Sie bleiben durchgestrichen unten auf der Liste, bis jemand auf „Erledigte entfernen“ tippt. (Empfehlung: ein Versehen lässt sich leicht rückgängig machen)
   b) Sie verschwinden sofort
   Und kann man ein Rezept komplett wieder von der Liste nehmen, also „Lasagne doch nicht“, sodass seine Zutaten verschwinden oder sich die Mengen entsprechend verringern?

3. **Offline im Laden.** Ben hat im Keller-Supermarkt kein Netz und hakt 5 Sachen ab. Gleichzeitig setzt Anna zu Hause ein Rezept drauf. Ich gehe davon aus: Sobald Ben wieder Netz hat, werden beide Änderungen zusammengeführt, und niemandem geht etwas verloren. Passt das? Oder gibt es einen Fall, in dem das anders sein soll?

4. **Eigene Einträge und Reihenfolge.** Sollen eigene Einträge wie „Klopapier“ optional eine Menge haben können („2 Pakete“)? Und in welcher Reihenfolge soll die Liste stehen?
   a) In der Reihenfolge, in der die Einträge hinzugefügt wurden (Empfehlung für den Anfang)
   b) Alphabetisch
   c) Nach Abteilungen im Laden (Obst/Gemüse, Kühlregal ...). Das wäre deutlich mehr Aufwand, weil jede Zutat eine Abteilung bräuchte.

Stakeholder:
1. Ja, a) passt – nur zusammenfassen wenn Name und Einheit exakt gleich sind, umrechnen soll die App nicht. Und ja, wär gut wenn man sieht aus welchen Rezepten der Eintrag kommt.

2. a) genau, durchgestrichen unten bis man aufräumt. Und ja, Rezept komplett wieder rausnehmen muss gehen, dann verschwinden die Zutaten bzw die Mengen werden weniger.

3. Ja passt so.

4. Ja, eigene Einträge sollen optional ne Menge haben können. Und a) reicht am Anfang, nach Reihenfolge des Hinzufügens.

Groomer:
Super, alles notiert. Jetzt geht es noch um ein paar Randfälle, dann kann ich dir mein Gesamtbild zur Bestätigung zeigen.

1. **Gleiches Rezept zweimal.** Ihr kocht diese Woche zweimal Lasagne und setzt sie zweimal auf die Liste.
   a) Die Mengen addieren sich, beim Eintrag steht „Lasagne (2×)“. „Rezept rausnehmen“ nimmt sie einmal raus. (Empfehlung)
   b) Das zweite Hinzufügen wird verhindert („ist schon auf der Liste“)

2. **Schon gekaufte Sachen.** Zwei Fälle:
   - Mehl ist schon abgehakt, also gekauft. Dann setzt Anna die Pfannkuchen drauf, die auch Mehl brauchen. Mein Vorschlag: Das Mehl kommt als neuer, offener Eintrag dazu und wird nicht in den abgehakten Eintrag gerechnet, sonst würde es übersehen.
   - Ben hat das Hackfleisch schon gekauft, dann heißt es „Lasagne doch nicht“. Mein Vorschlag: Beim Rausnehmen werden nur offene Einträge weniger oder verschwinden. Abgehakte bleiben, wie sie sind, denn die Sachen liegen ja schon im Kühlschrank.
   Passt beides?

3. **Einzelne Einträge ändern.** Kann man einzelne Einträge von Hand löschen, zum Beispiel „Zwiebeln, haben wir doch“?
   a) Jeder Eintrag lässt sich löschen. Die Menge ändern geht nur bei eigenen Einträgen. Wer mehr Mehl will, schreibt „500 g Mehl“ als eigenen Eintrag dazu, und der wird dann automatisch zusammengefasst. (Empfehlung: bleibt einfach und verträgt sich mit „Rezept rausnehmen“)
   b) Jeder Eintrag lässt sich löschen und in der Menge ändern

4. **Kleinere Dinge, die ich so entscheiden würde.** Sag Bescheid, wenn dir etwas nicht passt:
   - Ein eigener Eintrag „Mehl, 500 g“ wird genauso mit Rezept-Mehl zusammengefasst (gleicher Name und gleiche Einheit). Als Herkunft steht dann „eigener Eintrag“.
   - Zutaten ohne Menge („Salz nach Geschmack“) kommen ohne Menge auf die Liste.
   - Wird ein Rezept später geändert oder gelöscht, bleibt die Liste so, wie sie beim Hinzufügen war.
   - Jedes Haushaltsmitglied darf alles auf der Liste: hinzufügen, abhaken, Rezepte rausnehmen, aufräumen.
   - Sortieren nach Abteilungen im Laden: Soll ich das als „später“ vormerken, oder brauchst du das gar nicht?

Stakeholder:
1. a) passt.

2. Ja, beides passt so.

3. a) passt.

4. Erste drei passen so. Aber Abteilungen sortieren brauch ich schon, nicht nur "später" vormerken – will ich wirklich haben. Reicht ne feste Liste von Abteilungen wie Obst & Gemüse, Kühlregal, Backwaren, Tiefkühl, Sonstiges.

Groomer:
Alles klar, die Sortierung nach Abteilungen kommt mit in diesen Umfang. Dazu habe ich noch drei Fragen und eine Rückfrage:

1. **Die Abteilungen genau festlegen.** „wie“ klingt nach Beispielen. Ist das die endgültige Liste, in genau dieser Reihenfolge von oben nach unten: Obst & Gemüse, Kühlregal, Backwaren, Tiefkühl, Sonstiges? Oder willst du noch welche dazunehmen? Naheliegend wären zum Beispiel Fleisch & Wurst, Nudeln/Mehl/Konserven, Getränke, Drogerie (da gehört Klopapier hin). Die Reihenfolge ist dann fest und nicht einstellbar, okay?

2. **Wie bekommt ein Eintrag seine Abteilung?** Zutaten in euren Rezepten haben bisher keine Abteilung.
   a) Die App merkt sich die Abteilung pro Zutatenname für den ganzen Haushalt. Was sie noch nicht kennt, landet unter „Sonstiges“. Ein Tipp verschiebt es, zum Beispiel „Zucchini → Obst & Gemüse“, und ab dann landet Zucchini immer dort, bei allen. (Empfehlung: wenig Aufwand und lernt schnell)
   b) Wie a), aber die App kennt von Anfang an gängige Lebensmittel und ordnet die schon selbst zu
   c) Man ordnet bei jedem Eintrag jedes Mal von Hand zu

3. **Abgehakte Einträge.** Sollen die gesammelt ganz unten in einem Bereich „Erledigt“ stehen (Empfehlung: die offenen Abteilungen bleiben übersichtlich)? Oder jeweils unten in ihrer Abteilung?

4. **Rückfrage zu den Rechten.** Beim letzten Mal hattest du die ersten drei Punkte bestätigt, der vierte ist offen geblieben: Darf jedes Haushaltsmitglied alles auf der Liste, also hinzufügen, abhaken, löschen, Rezepte rausnehmen und aufräumen?

Stakeholder:
1. Ja, passt so, feste Reihenfolge ist ok. Und die zusätzlichen Kategorien wie Fleisch & Wurst, Nudeln/Mehl/Konserven, Getränke, Drogerie nehmen wir mit dazu.

2. a) passt.

3. Gesammelt unten in "Erledigt", das reicht.

4. Ja, jeder im Haushalt darf alles – hinzufügen, abhaken, löschen, Rezepte rausnehmen, aufräumen.

Groomer:
Danke, ich glaube, ich hab's jetzt komplett. Bevor ich etwas aufschreibe, gehe ich mein Verständnis in kurzen Häppchen mit dir durch. Bitte jeweils nur „passt“ oder eine Korrektur.

**Teil 1 von 5: Ziel und Nutzer**
Die Einkaufsliste ist eine Erweiterung eurer bestehenden Rezepte-App, kein eigenes Produkt. Ziel: Wer kochen will, bringt die Zutaten eines Rezepts mit einem Handgriff auf eine Liste, und im Laden hat der ganze Haushalt dieselbe, aktuelle Liste auf dem Handy. Nutzer sind dieselben 2–4 Haushaltsmitglieder wie bisher, und alle dürfen alles. Es gibt genau eine Liste pro Haushalt, keine persönlichen und keine mehreren Listen.

Passt das?

Stakeholder:
passt

Groomer:
**Teil 2 von 5: Die Hauptabläufe**
- *Rezept draufsetzen:* Anna öffnet die Lasagne und stellt 6 Portionen ein. Sie tippt auf „Auf die Einkaufsliste“ und sieht alle Zutaten mit den Mengen für 6 Portionen, alle vorausgewählt. Salz und Öl haben sie da, also wählt sie die beiden ab und bestätigt. Der Rest landet auf der Liste.
- *Eigener Eintrag:* Sie schreibt „Klopapier“ dazu, auf Wunsch mit Menge („2 Pakete“).
- *Im Laden:* Ben öffnet die Liste. Sie ist nach Abteilungen gruppiert, innerhalb einer Abteilung in der Reihenfolge des Hinzufügens. Bei jedem Eintrag steht, woher er kommt („Lasagne, Pfannkuchen“ oder „eigener Eintrag“). Was er abhakt, wandert durchgestrichen nach unten in „Erledigt“. Ein erneuter Tipp macht das Abhaken rückgängig. Das alles klappt auch ohne Netz. Sobald wieder Verbindung da ist, sehen alle den gleichen Stand, und nichts geht verloren.
- *Aufräumen:* „Erledigte entfernen“ löscht alle abgehakten Einträge auf einmal.
- *Rezept rausnehmen:* Auf der Liste sieht man, welche Rezepte gerade drauf sind. „Lasagne doch nicht“ nimmt ihre noch offenen Zutaten weg oder verringert die Mengen.

Passt das?

Stakeholder:
passt

Groomer:
**Teil 3 von 5: Regeln und Randfälle**
- *Zusammenfassen:* Nur bei exakt gleichem Namen und gleicher Einheit, also 300 g + 200 g Mehl = 500 g Mehl. „2 EL Mehl“ oder „Weizenmehl“ bleiben eigene Einträge, umgerechnet wird nichts. Eigene Einträge werden genauso mit Rezept-Zutaten zusammengefasst. Zutaten ohne Menge („Salz nach Geschmack“) kommen ohne Menge drauf.
- *Gleiches Rezept zweimal:* Die Mengen addieren sich, es steht „Lasagne (2×)“ da, und Rausnehmen nimmt es einmal raus.
- *Schon Gekauftes:* Neues Mehl wird nie in einen abgehakten Mehl-Eintrag gerechnet, sondern kommt als neuer offener Eintrag dazu. Beim Rausnehmen eines Rezepts bleiben abgehakte Einträge unverändert.
- *Ändern:* Jeder Eintrag lässt sich löschen. Die Menge ändern geht nur bei eigenen Einträgen. Wird ein Rezept später geändert oder gelöscht, bleibt die Liste so, wie sie beim Hinzufügen war.
- *Abteilungen,* in dieser festen Reihenfolge. Die fünf von dir habe ich in deiner Reihenfolge gelassen und die neuen sinnvoll dazwischen gesetzt: **Obst & Gemüse, Fleisch & Wurst, Kühlregal, Backwaren, Nudeln/Mehl/Konserven, Getränke, Drogerie, Tiefkühl, Sonstiges.** Die App merkt sich die Abteilung pro Zutatenname für den ganzen Haushalt. Was sie noch nicht kennt, landet unter „Sonstiges“. Verschiebt jemand einen Eintrag, gilt das ab sofort für diesen Namen, auch für gleichnamige Einträge, die schon auf der Liste stehen.

Passt das, auch die Reihenfolge der Abteilungen?

Stakeholder:
passt

Groomer:
**Teil 4 von 5: Umfang**
- *Drin:* alles aus Teil 2 und 3, also Rezept mit Abwählen übernehmen, eigene Einträge, gemeinsame Live-Liste mit Offline-Nutzung, Abhaken und Aufräumen, Rezept rausnehmen, Sortierung nach Abteilungen.
- *Bewusst nicht drin:* Vorratsverwaltung, Umrechnen von Einheiten, mehrere oder persönliche Listen, eine einstellbare Reihenfolge der Abteilungen, eine App, die Lebensmittel schon ab Werk einer Abteilung zuordnet, das Ändern der Mengen bei Rezept-Einträgen.
- *Für später vorgemerkt:* nichts Neues. Der Wochenplan steht ja schon aus dem ersten Umfang auf „später“.

Soll etwas von „bewusst nicht drin“ lieber auf „später“? Oder passt das so?

Stakeholder:
passt so

Groomer:
**Teil 5 von 5: Was ich selbst entschieden habe oder annehme.** Das ist der letzte Teil.
- „Alle sehen sofort“ heißt bei mir: Mit Netz erscheint eine Änderung bei den anderen innerhalb von ein paar Sekunden, ohne dass jemand neu laden muss.
- Ohne Netz geht auf der Liste alles, also abhaken, eigene Einträge, löschen, aufräumen. Auch ein Rezept lässt sich offline draufsetzen, sofern es auf dem Handy schon verfügbar ist, wie im Kochmodus heute.
- Wählt man beim Übernehmen alle Zutaten ab, passiert nichts, und das Rezept gilt nicht als „auf der Liste“. Sind nach dem Aufräumen alle Einträge eines Rezepts weg, verschwindet es auch aus „Rezepte auf der Liste“.
- Eine leere Liste zeigt einen kurzen Hinweis, wie man Rezepte oder eigene Einträge hinzufügt.
- Firebase gebe ich dem Architekten als deine feste Vorgabe mit. Technisch entscheide ich da nichts weiter.

Damit ist alles, was du gesagt hast, untergebracht: im Umfang, bewusst ausgeschlossen oder als technische Vorgabe. Passt das so? Dann schreibe ich es auf.

Stakeholder:
passt, schreib's auf

Groomer:
Fertig. Die Anforderungen liegen in `docs/requirements/002-shopping-list.md`, und `docs/product.md` ist ergänzt. Alles ist bereit für den Architekten.

Vier Kleinigkeiten habe ich ohne Nachfrage so entschieden, weil sie aus deinen Antworten folgen:
- Bei einem Eintrag, der teils aus einem Rezept und teils von Hand kommt, lässt sich die Menge nicht ändern.
- Wer etwas wieder aufhakt, bekommt es mit einem gleichen offenen Eintrag zusammengefasst.
- „Erledigt“ ist nach dem Zeitpunkt des Abhakens sortiert.
- Löscht jemand einen Eintrag, während ein anderer ihn offline ändert, bleibt er gelöscht.

Wenn dir davon etwas nicht passt, sag Bescheid.
