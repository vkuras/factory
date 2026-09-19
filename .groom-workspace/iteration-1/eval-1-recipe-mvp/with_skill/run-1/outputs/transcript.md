Stakeholder:
Ich will eine App für meine Rezepte bauen. Ich hab die grad als Markdown Files in nem Git Repo, das nervt. Man soll die mit der Familie teilen können und beim Kochen gut benutzen. Soll in Kotlin gebaut werden. Irgendwann wär auch ein Wochenplan cool.

Groomer:
So verstehe ich es bisher: Deine Rezepte liegen gerade als Markdown-Dateien in einem Git-Repo. Das ist umständlich, vor allem für deine Familie und in der Küche. Die App soll deine Rezeptsammlung werden: Die Familie kommt ohne Git an die Rezepte ran, und beim Kochen ist sie ein angenehmer Begleiter. Kotlin ist als Technik gesetzt. Ein Wochenplan wäre schön, gehört aber vermutlich nicht in die erste Version.

Erste Fragen:

1. **Was nervt dich am meisten an der aktuellen Lösung?** Das Bearbeiten, das Lesen auf dem Handy in der Küche, dass die Familie nicht rankommt, oder etwas anderes? Daran sehe ich, was die erste Version unbedingt lösen muss.

2. **Familie konkret:** Stell dir vor, deine Partnerin oder dein Kind öffnet die App zum ersten Mal. Sollen sie a) nur deine Rezepte lesen, b) auch eigene Rezepte anlegen, oder c) auch deine Rezepte ändern dürfen? Und wie viele Leute sind das ungefähr, und wohnen alle in einem Haushalt?
   (Mein Vorschlag: b). Alle lesen und legen an, ändern darf nur, wer das Rezept angelegt hat. Das ist einfach und es gibt keinen Streit.)

3. **Deine bestehenden Rezepte:** Wie viele Markdown-Dateien sind es ungefähr? Sollen die beim Start automatisch in die App übernommen werden, oder tippst du sie neu ab? Falls übernommen: Haben die Dateien eine einheitliche Struktur (z. B. Überschrift „Zutaten“, dann „Zubereitung“)?

4. **Wochenplan:** Ist der für dich wirklich „später“, also nicht in der ersten Version? (Empfehlung: ja, erst mal parken. Rezepte teilen und damit kochen ist schon eine runde erste Version.)

Stakeholder:
1. am meisten nervt: dass die familie ohne git nicht rankommt, und lesen aufm handy in der küche ist auch nervig.
2. b) passt, so wie du's vorschlägst. sind wir 2-4 leute (ich, meine frau, später die kids), alle ein haushalt.
3. so 15 files, sollen automatisch übernommen werden beim start, einmalig reicht. struktur ist einheitlich, ja.
4. ja, wochenplan erst mal später.

Groomer:
Danke, notiert: Alle im Haushalt lesen und legen Rezepte an, ändern darf nur, wer das Rezept angelegt hat. Deine 15 Dateien werden einmal übernommen, der Wochenplan ist geparkt.

Nächste Runde:

1. **Beim Kochen:** Du stehst am Herd, das Handy lehnt an der Wand. Was davon brauchst du in der ersten Version?
   a) Bildschirm bleibt an, solange das Rezept offen ist
   b) Große, gut lesbare Schrift
   c) Portionen umrechnen (z. B. Rezept für 4, du kochst für 2, Mengen passen sich an)
   d) Zutaten oder Schritte abhaken
   e) Schritt-für-Schritt-Ansicht, ein Schritt pro Bildschirm
   (Empfehlung: a, b, c. Das ist der Kern für die Küche. d und e würde ich eher parken.)
   Und: Soll ein Rezept auch ohne Internet lesbar sein, etwa bei schlechtem Empfang in der Küche?

2. **Wie kommt deine Frau rein?** Z. B. du lädst sie ein (Link oder Code) und sie sieht danach sofort alle Rezepte. Oder hast du dir etwas anderes vorgestellt? Nutzt ihr Handys, und wenn ja: Android, iPhone oder gemischt?

3. **Eine Beispieldatei:** Kannst du mir den Inhalt einer typischen Rezeptdatei hier reinkopieren? Dann sehe ich, was ein Rezept bei dir enthält (Portionen? Tags? Bilder? Zeiten?) und was genau übernommen werden muss.

4. **Nach der Übernahme:** Ist das Git-Repo dann erledigt und die App die einzige Quelle? Oder willst du weiter in Markdown schreiben?
   (Empfehlung: App ist danach die einzige Quelle. Ein Abgleich in beide Richtungen wäre viel Aufwand für wenig Nutzen.)

Stakeholder:
1. a, b, c passt genau. d und e brauch ich nicht. und ja, offline lesen muss gehen, wifi in der küche ist mies.
2. ja, einladen per link oder code reicht, dann sieht sie alles. wir haben beide iPhones.
3. les ich nicht bzw schreib ich jetzt nicht ab, sag mir kurz was du wissen willst – ist halt titel, portionen, zutaten, zubereitung, kategorie. bild optional.
4. ja, App ist danach die einzige quelle, will nicht mehr in markdown schreiben.

Groomer:
Passt, dann brauche ich die Datei nicht. Notiert: Bildschirm bleibt an, große Schrift, Portionen umrechnen, offline lesbar, Einladung per Link oder Code, die App ist danach die einzige Quelle.

Nächste Runde:

1. **Portionen umrechnen, konkret:** Das Rezept ist für 4, du stellst auf 2.
   - „3 Eier“ wird zu 1,5 Eier. Soll das so angezeigt werden, oder soll die App sinnvoll runden (z. B. „1–2 Eier“)? (Empfehlung: ehrlich 1,5 anzeigen, das ist einfach und nachvollziehbar.)
   - „1 Prise Salz“ oder „etwas Pfeffer“ bleiben unverändert. Okay?
   - Die Umstellung gilt nur für dieses Mal und ändert das gespeicherte Rezept nicht. Okay?

2. **Rezepte finden:** Reicht in der ersten Version eine Liste, die man nach Kategorie filtern und nach Titel durchsuchen kann? Oder willst du auch nach Zutat suchen („was kann ich mit Zucchini machen“)? Und die Kategorien: eine pro Rezept, frei vergeben (z. B. „Pasta“, „Kuchen“)?

3. **Offline:** Lesen muss offline gehen, das ist klar. Muss auch **Anlegen oder Bearbeiten** ohne Internet gehen? Dann würde es übertragen, sobald wieder Netz da ist. Oder reicht es, dass das nur mit Netz klappt?
   (Empfehlung: Bearbeiten nur mit Netz. Offline gibt es sonst schnell verwirrende Konflikte.)

4. **Geräte und Bilder:** Soll die erste Version nur fürs iPhone sein, oder muss auch etwas anderes gehen, etwa ein Android-Handy für die Kids später oder der Browser am Laptop? Und liegen in deinem Git-Repo Bilder, die mit übernommen werden sollen? Sollen neue Bilder direkt mit der Handykamera aufgenommen werden können?

Stakeholder:
1. ja, ehrlich 1,5 anzeigen passt. prise salz/etwas pfeffer bleibt unverändert, passt. und ja nur für den moment, gespeichertes rezept bleibt gleich.
2. keine freien kategorien, ich hab schon feste: hauptgerichte, beilagen, soßen. suche nach zutat brauch ich nicht, suche nach titel reicht.
3. bearbeiten nur mit netz reicht, passt.
4. erstmal reicht iphone, android für die kids kommt später falls überhaupt. bilder liegen aktuell keine im repo, aber neue fotos direkt mit der handykamera aufnehmen wäre cool.

Groomer:
Notiert: 1,5 anzeigen, „Prise“ und „etwas“ bleiben unverändert, die Umrechnung gilt nur für den Moment. Feste Kategorien, Suche nach Titel, Bearbeiten nur mit Netz, erst mal nur iPhone, Android vielleicht später.

Fast durch. Noch eine Runde:

1. **Kategorien:** Hat jedes Rezept genau eine der drei (Hauptgerichte, Beilagen, Soßen), und muss eine gewählt werden? Bleibt die Liste fest, oder willst du in der App später selbst eine hinzufügen können (z. B. „Desserts“)?
   (Empfehlung: genau eine Pflicht-Kategorie. Die Liste bleibt in der ersten Version fest.)

2. **Foto:** Soll das Foto schon in der ersten Version drin sein, oder später? Wenn drin: ein Foto pro Rezept, aufgenommen mit der Kamera **oder** aus den vorhandenen Fotos gewählt, und nur der Ersteller darf es ändern?
   (Empfehlung: in die erste Version, ein Foto, Kamera oder Fotos-App. Das ist wenig Aufwand, macht aber viel aus.)

3. **Haushalt verwalten:** Wer darf einladen, nur du oder jedes Mitglied? Brauchst du die Möglichkeit, jemanden wieder zu entfernen? Und haben die Kids später genau dieselben Rechte wie ihr (lesen, eigene anlegen, eigene ändern)?
   (Empfehlung: jeder darf einladen, alle haben dieselben Rechte. Entfernen darf nur du. Das kann man aber auch parken.)

4. **Löschen:** Der Ersteller darf sein Rezept löschen, nach einer Sicherheitsabfrage, und dann ist es für alle weg. Passt das, oder soll es einen Papierkorb geben?
   (Empfehlung: Sicherheitsabfrage reicht, kein Papierkorb.)

Stakeholder:
1. ja, genau eine pflicht-kategorie, liste bleibt erstmal fest.
2. ja, foto gleich in der ersten version, kamera oder aus fotos wählen, nur ersteller darf's ändern.
3. passt, jeder darf einladen, alle gleiche rechte. entfernen darf nur ich. kids später gleiche rechte wie wir.
4. passt so, sicherheitsabfrage reicht, kein papierkorb.

Groomer:
Danke, das Bild ist jetzt rund. Bevor ich etwas aufschreibe, gehe ich mein Verständnis in 5 kurzen Häppchen mit dir durch. Bitte sag jeweils „passt“ oder korrigier mich.

**Häppchen 1 von 5: Ziel und Nutzer**
Die App ist die gemeinsame Rezeptsammlung eures Haushalts und ersetzt dein Git-Repo komplett. Sie löst zwei Probleme: Deine Frau (und später die Kids) kommen ohne Git an die Rezepte, und man kann am Herd auf dem iPhone gut mitlesen. Nutzer sind 2–4 Personen aus einem Haushalt, alle mit denselben Rechten. Nur du hast eine Sonderrolle: Du darfst Mitglieder entfernen. Bewusst **nicht** dabei: Sammlungen mehrerer Haushalte, öffentliches Teilen, Android oder Browser sowie Wochenplanung.

Passt das?

Stakeholder:
passt

Groomer:
**Häppchen 2 von 5: Die Abläufe**

- **Start:** Du richtest die App ein, und deine 15 Rezepte werden einmalig übernommen. Sie gehören danach dir, das heißt, nur du darfst sie ändern.
- **Einladen:** Du schickst deiner Frau einen Link oder Code. Sie tritt bei und sieht sofort alle Rezepte. Später lädt einer von euch die Kids genauso ein.
- **Finden:** Die Liste ist alphabetisch sortiert, lässt sich nach Kategorie filtern und nach Titel durchsuchen.
- **Kochen:** Du öffnest ein Rezept, die Schrift ist groß und der Bildschirm bleibt an. Du stellst von 4 auf 2 Portionen, und die Mengen rechnen sich um. Das Gespeicherte ändert sich dabei nicht. Das alles geht auch ohne Internet.
- **Anlegen:** Titel, Portionen, Kategorie, Zutaten, Zubereitung und optional ein Foto (Kamera oder Fotos-App). Anlegen, Ändern und Löschen gehen nur mit Netz. Löschen gibt es nur für den Ersteller, mit Sicherheitsabfrage.

Passt das?

Stakeholder:
passt

Groomer:
**Häppchen 3 von 5: Regeln und Sonderfälle**
Hier stecken ein paar Kleinigkeiten, die ich selbst entschieden habe (markiert mit ✎). Widersprich, wenn dir etwas nicht passt.

- ✎ **Pflichtfelder:** Titel, Portionen (ganze Zahl ab 1), Kategorie, mindestens eine Zutat und die Zubereitung. Das Foto ist optional. Gleiche Titel sind erlaubt.
- **Umrechnen:** Nur Zutaten mit einer Zahl werden umgerechnet, auch Brüche wie „1/2“. Das Ergebnis wird ehrlich angezeigt, also etwa „1,5 Eier“. ✎ Es wird auf höchstens zwei Nachkommastellen gerundet. Zutaten ohne Zahl bleiben, wie sie sind.
- ✎ **Ohne Netz:** Alle Rezepte inklusive Fotos sind lesbar. Wer ohne Netz etwas speichern will, bekommt einen klaren Hinweis, und die Eingabe bleibt stehen, bis er es erneut versucht.
- ✎ **Übernahme:** Kann eine Datei nicht gelesen werden, zeigt die App, welche. Der Rest wird trotzdem übernommen.
- ✎ **Einladung:** Ein Link oder Code gilt einmal und ist 7 Tage gültig. Am Rezept steht, wer es angelegt hat.

**Eine offene Frage:** Du entfernst jemanden aus dem Haushalt. Was passiert mit den Rezepten, die diese Person angelegt hat?
a) Sie bleiben und gehen auf dich über, du darfst sie dann ändern und löschen (Empfehlung: nichts geht verloren).
b) Sie werden mit gelöscht.

Stakeholder:
passt so weit. bei der offenen frage: a) - bleibt alles da und geht auf mich über.

Groomer:
**Häppchen 4 von 5: Umfang**

- **Drin:** Übernahme der 15 Rezepte, Einladen, Mitglieder entfernen (nur du), Liste mit Kategorie-Filter und Titelsuche, Kochansicht (große Schrift, Bildschirm bleibt an, Portionen umrechnen, offline lesbar), Anlegen/Ändern/Löschen mit Foto.
- **Später:** Wochenplan, Android für die Kids, eigene Kategorien hinzufügen.
- **Bewusst raus:** Zutaten oder Schritte abhaken, Schritt-für-Schritt-Ansicht, Suche nach Zutat, Papierkorb, Bearbeiten ohne Netz, Browser-Version, Weiterschreiben in Markdown.

Passt das so?

Stakeholder:
passt

Groomer:
**Häppchen 5 von 5: Annahmen und Übergabe**

- **Kotlin** gebe ich dem Architekten wörtlich als Vorgabe mit, zusammen mit dem Hinweis „iPhone zuerst, Android vielleicht später“. Wie Kotlin aufs iPhone kommt, entscheidet er.
- **Annahme 1:** Die App-Oberfläche ist auf Deutsch.
- **Annahme 2:** Jede deiner 15 Dateien hat eine Kategorie, die zu Hauptgerichte, Beilagen oder Soßen passt. Wenn nicht, zählt die Datei als „nicht lesbar“ und wird gemeldet.
- **Annahme 3:** Jedes Mitglied erscheint mit seinem Namen, damit man am Rezept sieht, wer es angelegt hat.

Alles, was du gesagt hast, ist damit untergebracht: entweder in der ersten Version, geparkt oder bewusst weggelassen. Passen die drei Annahmen?

Stakeholder:
passt, schreib's auf

Groomer:
Ich hab alles aufgeschrieben, und es ist bereit für den Architekten:
- `docs/product.md`: die Produktbeschreibung (Vision, Nutzer, Begriffe)
- `docs/requirements/001-household-recipes-mvp.md`: die erste Version, mit 12 Stories, Regeln und dem abgesprochenen Umfang

Der Wochenplan, Android und eigene Kategorien sind dort als „später“ geparkt.
