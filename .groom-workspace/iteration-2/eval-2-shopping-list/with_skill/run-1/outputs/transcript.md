Stakeholder:
Ich brauch ne Einkaufsliste. Ich will aus Rezepten die Zutaten auf ne Liste packen. Vielleicht kann man auch Vorräte abhaken, weiß nicht. Sync am besten über Firebase.

Groomer:
Ich hab mir das bestehende Rezeptbuch angeschaut (Haushalt mit 2–4 Leuten, Portionen umrechnen, Kochmodus). So hab ich dich verstanden:

**Heute** schreibt ihr die Zutaten von Hand ab, wenn ihr aus euren Rezepten kochen wollt. **Künftig** wählst du im Rezeptbuch ein oder mehrere Rezepte aus, und die Zutaten landen automatisch auf einer Einkaufsliste, die du im Laden abarbeitest. Vielleicht kannst du vorher noch abhaken, was ihr schon daheim habt, damit es gar nicht erst auf der Liste steht.

Den Punkt mit Firebase notiere ich wörtlich als Vorgabe für den Architekten. Ich will aber verstehen, was du damit fürs Produkt erreichen willst. Daher meine ersten Fragen:

1. **Erzähl mal einen typischen Einkauf, so wie du ihn dir vorstellst.** Wann kommen die Rezepte auf die Liste (z. B. einmal pro Woche mehrere, oder spontan eins)? Und wer geht dann einkaufen?
2. **Eine Liste für den ganzen Haushalt oder jeder seine eigene?** Beispiel: Du stehst im Supermarkt, und deine Partnerin fügt zu Hause noch ein Rezept hinzu. Soll das bei dir auf der Liste auftauchen? Und wenn du im Laden „Milch“ abhakst, soll sie das sehen?
3. **Was meinst du mit „Vorräte abhaken“?** Ich sehe zwei Möglichkeiten:
   a) Beim Erstellen der Liste streichst du einfach, was schon da ist (Salz, Mehl …), und die App merkt sich nichts.
   b) Die App kennt eure Vorräte dauerhaft (z. B. „Salz haben wir immer“) und lässt das automatisch weg.
   Oder meinst du etwas ganz anderes?
4. **Kommen auch Sachen auf die Liste, die in keinem Rezept stehen**, also Klopapier oder Kaffee? Oder nur Rezeptzutaten?

Stakeholder:
1. Meist so einmal die Woche, dass ich mehrere Rezepte reinpacke, manchmal spontan eins zwischendurch. Einkaufen geht meist ich, manchmal meine Frau.

2. Eine Liste fürs ganze Haus. Wenn sie zuhause was hinzufügt, während ich im Laden bin, soll das bei mir auftauchen. Und wenn ich Milch abhake, soll sie das auch sehen.

3. b) nee, kein Vorratsmanagement, nur beim Hinzufügen wegklicken.

4. Ja klar, Klopapier, Kaffee, sowas will ich auch draufpacken können.

Groomer:
Danke, das ist klar. Zusammengefasst: **eine gemeinsame Liste für den Haushalt**. Jeder kann Rezepte und freie Einträge (Klopapier, Kaffee) draufpacken, und Änderungen sehen die anderen sofort. „Vorräte“ heißt nur: Beim Hinzufügen eines Rezepts klickst du weg, was schon da ist. Die App merkt sich keine Vorräte. (Dein „b) nee“ lese ich als „nicht b, also a“. Sag Bescheid, falls ich falsch liege.)

Nächste Runde:

1. **Gleiche Zutaten aus mehreren Rezepten.** Rezept A braucht 2 Zwiebeln, Rezept B 1 Zwiebel. Was willst du im Laden sehen? Und was, wenn die Einheiten nicht zusammenpassen, z. B. „200 g Mehl“ und „2 EL Mehl“?
2. **Portionen.** Ein Rezept ist für 4 Portionen angelegt, ihr kocht aber für 2. Wie stellst du dir vor, wo du das beim Hinzufügen einstellst?
3. **Nach dem Einkauf.** Was soll mit den abgehakten Sachen passieren? Und mit dem, was du im Laden nicht bekommen hast? Fängst du nächste Woche mit einer leeren Liste an oder läuft die Liste einfach weiter?
4. **Empfang im Laden.** Viele Supermärkte haben kaum Netz. Muss die Liste dort trotzdem funktionieren (anzeigen und abhaken), auch wenn die Änderungen erst später bei deiner Frau ankommen?

Stakeholder:
1. Zwiebeln zusammenrechnen, also 3 Zwiebeln. Bei unterschiedlichen Einheiten wie 200g Mehl und 2 EL Mehl bleiben das zwei separate Zeilen.

2. Beim Hinzufügen von nem Rezept kann ich halt Portionen einstellen, und die Liste nimmt dann die Menge für die gewählte Anzahl.

3. Abgehakte Sachen wandern nach unten. Mit "Einkauf abschließen" verschwinden die abgehakten Sachen, was nicht abgehakt ist bleibt einfach stehen für nächstes Mal.

4. Das soll der Architekt entscheiden.

Groomer:
Passt, das ist konkret. Zusammenrechnen nur bei gleicher Einheit, Portionen wählst du beim Hinzufügen, Abgehaktes rutscht nach unten, und „Einkauf abschließen“ räumt das Abgehakte weg. Der Rest bleibt stehen.

Zu 4 eine kurze Einordnung. *Wie* das technisch gelöst wird, entscheidet natürlich der Architekt. *Ob* die Liste im Funkloch funktionieren muss, merkt aber nur der, der im Laden steht, und das muss er vorher wissen. **Mein Vorschlag:** Die Liste lässt sich im Laden auch ohne Netz anzeigen und abhaken. Sobald wieder Netz da ist, sieht deine Frau die Änderungen. Hinzufügen ohne Netz muss nicht gehen. Passt das?

Und noch drei Fragen:

1. **Rezept wieder runternehmen.** Du packst am Sonntag 4 Rezepte drauf, und am Montag fällt eins weg. Willst du dieses Rezept als Ganzes von der Liste nehmen können, oder reicht es dir, einzelne Zeilen zu löschen? Willst du im Laden sehen, für welches Rezept eine Zutat ist?
2. **Freie Einträge.** Reicht bei Klopapier und Kaffee ein einfacher Text, auch mal „2x Milch“? Oder willst du Menge und Einheit getrennt angeben, damit „Milch“ mit der Milch aus einem Rezept zusammengerechnet wird?
3. **Reihenfolge.** Reicht dir die Reihenfolge, in der die Sachen hinzugefügt wurden (Abgehaktes unten)? Oder brauchst du im Laden eine Sortierung, z. B. nach Gemüse, Kühlregal usw.?

Stakeholder:
Ja passt, so wie du das mit Netz vorgeschlagen hast.

1. Ganzes Rezept entfernen wäre schon praktisch, einzelne Zeilen löschen reicht aber notfalls auch. Im Laden muss ich nicht sehen, von welchem Rezept was ist, brauch ich nicht.

2. Einfacher Text reicht, muss nicht mit der Milch vom Rezept zusammengerechnet werden.

3. Doch, brauch ich schon, sortiert nach Bereich wie Obst & Gemüse, Kühlregal, Backwaren, Tiefkühl, Sonstiges.

Groomer:
Gut, Netz ist damit geklärt. Freie Einträge sind einfacher Text, und die Herkunft wird im Laden nicht angezeigt.

Die Sortierung nach Bereich ist neu und wirft die größte Frage auf:

1. **Woher kennt die App den Bereich?** Eure Rezepte haben bisher nur Menge, Einheit und Name, also z. B. „2 Zwiebeln“ ohne „Obst & Gemüse“. Wie stellst du dir das vor, wenn eine Zutat oder „Klopapier“ auf die Liste kommt? Wer oder was legt fest, in welchem Bereich sie landet? Und was passiert, wenn es falsch einsortiert ist?
2. **Welche Bereiche?** Du hast geschrieben „wie Obst & Gemüse, Kühlregal, Backwaren, Tiefkühl, Sonstiges“. Sollen es genau diese fünf sein, in dieser Reihenfolge im Laden angezeigt? Oder fehlt dir noch einer (z. B. Getränke, Drogerie)? **Mein Vorschlag:** eine feste Liste, die ihr in der App nicht selbst bearbeitet. Das hält es einfach.
3. **Ganzes Rezept entfernen: jetzt oder später?** Eine Folge solltest du kennen: Wenn die Zwiebeln schon zusammengerechnet sind (3 Stück) und du Rezept B wieder entfernst, würde die Zeile auf 2 Zwiebeln zurückgehen. Soll das in diese erste Version, oder parken wir es für später und du löschst erst mal einzelne Zeilen?

Stakeholder:
1. Die App soll das automatisch zuordnen, keine Ahnung wie genau, aber wenn's falsch einsortiert ist, sollte man es zur Not händisch verschieben können.

2. Ja, feste Liste passt, nicht selber bearbeiten müssen. Aber Getränke fehlt mir noch, das würd ich noch dazu nehmen.

3. Das können wir für später parken, erstmal reicht einzelne Zeilen löschen.

Groomer:
Gut: Die App ordnet automatisch zu, du kannst von Hand verschieben, es gibt sechs feste Bereiche mit Getränken, und „ganzes Rezept entfernen“ ist für später geparkt.

Eine letzte Frage dazu:

**Von Hand verschieben: einmalig oder merken?** Die App steckt „Hefe“ unter Sonstiges, und du schiebst sie ins Kühlregal. Soll Hefe beim nächsten Mal automatisch im Kühlregal landen, oder gilt die Korrektur nur für diese eine Zeile?

Danach bin ich eigentlich durch. Ich fange schon mal an, dir mein Verständnis stückweise zurückzuspielen. Bitte jeweils kurz „passt“ oder korrigieren.

**Teil 1 von 5, Ziel und Nutzer:** Die Einkaufsliste ist ein neuer Teil eures bestehenden Rezeptbuchs. Sie soll euch das Abschreiben von Zutaten ersparen, damit ihr im Laden nichts vergesst. Es gibt genau **eine gemeinsame Liste pro Haushalt**, und alle Haushaltsmitglieder dürfen darauf alles gleich: hinzufügen, abhaken, löschen, Einkauf abschließen. Das ist anders als bei Rezepten, wo nur der Ersteller bearbeiten darf. Meistens kaufst du ein, manchmal deine Frau. Änderungen des einen sieht der andere sofort.

Stakeholder:
Merken wär gut, sonst nervt's ja jede Woche.

Passt.

Groomer:
Gut, die App merkt sich die Korrektur.

**Teil 2 von 5, die Abläufe:**
- **Rezept hinzufügen:** Du öffnest im Rezeptbuch z. B. „Linsencurry“ und tippst „Auf die Einkaufsliste“. Dann siehst du die Portionen, vorbelegt mit der Portionszahl des Rezepts, und darunter alle Zutaten mit angepassten Mengen, alle angehakt. Du klickst weg, was ihr schon daheim habt, und bestätigst. Nur die übrigen Zutaten kommen auf die Liste.
- **Freier Eintrag:** Auf der Liste tippst du einen Text ein, z. B. „Klopapier“ oder „2x Milch“. Er wird automatisch einem Bereich zugeordnet.
- **Im Laden:** Die Liste ist nach Bereichen gruppiert: Obst & Gemüse, Kühlregal, Backwaren, Tiefkühl, Getränke, Sonstiges. Du tippst eine Zeile an, sie ist abgehakt und rutscht nach unten. Nochmal antippen macht das Abhaken rückgängig. Eine falsch einsortierte Zeile kannst du in einen anderen Bereich schieben, und die App merkt sich das. Einzelne Zeilen kannst du löschen.
- **Einkauf abschließen:** Nach einer Rückfrage verschwinden alle abgehakten Zeilen. Der Rest bleibt stehen, und die Liste läuft einfach weiter.

Passt das so?

Stakeholder:
Passt.

Groomer:
**Teil 3 von 5, Regeln und Sonderfälle:**
- **Zusammenrechnen:** Zwei Rezeptzutaten werden nur zusammengerechnet, wenn Name und Einheit gleich sind, z. B. 2 + 1 Zwiebeln = 3 Zwiebeln. „200 g Mehl“ und „2 EL Mehl“ bleiben zwei Zeilen. Freie Texte werden nie zusammengerechnet, auch nicht „Milch“ mit der Milch aus einem Rezept. Kommt dasselbe Rezept zweimal drauf, addieren sich die Mengen genauso.
- **Schon abgehakt:** Liegen 2 Zwiebeln schon abgehakt im Wagen und du fügst ein neues Rezept mit 1 Zwiebel hinzu, entsteht eine neue offene Zeile „1 Zwiebel“. Die Menge wird nicht auf die abgehakte Zeile addiert, damit nichts untergeht.
- **Ohne Netz im Laden:** Die Liste lässt sich anzeigen und abhaken. Die Änderungen kommen bei deiner Frau an, sobald wieder Netz da ist. Hinzufügen ohne Netz muss nicht gehen.
- **Rezept später geändert oder gelöscht:** Was schon auf der Liste steht, bleibt unverändert.
- **Leere Liste:** Es erscheint ein kurzer Hinweis, wie man etwas hinzufügt.

Passt das?

Stakeholder:
Passt.

Groomer:
**Teil 4 von 5, Umfang:**
- **Drin:** die gemeinsame Liste; Rezepte mit Portionswahl und Wegklicken hinzufügen; freie Einträge; automatische Bereiche mit Verschieben und Merken; abhaken und wieder aufheben; Zeilen löschen; Einkauf abschließen; abhaken ohne Netz.
- **Später:** ein ganzes Rezept wieder von der Liste nehmen.
- **Bewusst nicht:** Vorratsverwaltung; anzeigen, von welchem Rezept eine Zutat stammt; Bereiche selbst anlegen oder umbenennen; freie Einträge mit Rezeptzutaten zusammenrechnen; mehrere Listen, z. B. eine pro Laden. Das Letzte ist mein Vorschlag, weil du immer von *einer* Liste gesprochen hast.

Der Wochenplan aus dem Rezeptbuch bleibt wie bisher „später“ und gehört nicht zu diesem Teil.

Passt das?

Stakeholder:
Passt.

Groomer:
**Teil 5 von 5, was ich selbst entschieden habe.** Bitte widersprich, wo es nicht passt:
1. **Gleicher Name** heißt: gleiche Schreibweise, Groß/Klein egal. Ob „Zwiebel“ und „Zwiebeln“ zusammengerechnet werden, ist nicht garantiert.
2. **Zutaten ohne Menge** wie „Salz nach Geschmack“ erscheinen als eine Zeile ohne Menge. Steht die Zeile schon offen auf der Liste, kommt keine zweite dazu.
3. **Portionen umrechnen** funktioniert genauso wie heute im Rezept.
4. **Gemerkte Bereichs-Korrekturen** gelten für den ganzen Haushalt und für alles mit diesem Namen, egal ob Rezeptzutat oder freier Eintrag.
5. **Wenn die App unsicher ist**, landet die Zeile unter „Sonstiges“. Die Bereiche erscheinen immer in dieser Reihenfolge: Obst & Gemüse, Kühlregal, Backwaren, Tiefkühl, Getränke, Sonstiges. Innerhalb eines Bereichs gilt die Reihenfolge des Hinzufügens.
6. **Zeilen bearbeiten** geht nicht. Du löschst die Zeile und legst sie neu an. Löschen geht ohne Rückfrage, nur „Einkauf abschließen“ fragt nach.
7. **Firebase** gebe ich dem Architekten wörtlich als deine Vorgabe mit.

Damit ist alles, was du gesagt hast, untergebracht: in der Liste, bei „später“ oder bei „bewusst nicht“. Passt das so?

Stakeholder:
Passt, schreib's auf.

Groomer:
Fertig. Die Anforderungen stehen in `docs/requirements/002-shopping-list.md`, und `docs/product.md` ist ergänzt. Firebase ist als deine Vorgabe vermerkt. Alles ist bereit für den Architekten, du musst nichts mehr lesen.
