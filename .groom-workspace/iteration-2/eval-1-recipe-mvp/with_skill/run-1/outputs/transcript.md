# Transcript: eval-1-recipe-mvp (with_skill, run-1)

**Stakeholder:**
Ich will eine App für meine Rezepte bauen. Ich hab die grad als Markdown Files in nem Git Repo, das nervt. Man soll die mit der Familie teilen können und beim Kochen gut benutzen. Soll in Kotlin gebaut werden. Irgendwann wär auch ein Wochenplan cool.

**Groomer:**
So hab ich dich verstanden: Deine Rezepte liegen heute als Markdown-Dateien in einem Git-Repo. Für dich ist das umständlich, und deine Familie kommt praktisch gar nicht ran. Du willst eine eigene Rezept-App, in der die Rezepte gut aufgehoben sind, die Familie sie auch sieht und man sie direkt beim Kochen benutzen kann. Ein Wochenplan wäre schön, klingt aber nach "später". Kotlin notiere ich als Vorgabe für die Technik.

Meine ersten Fragen:

1. **Was nervt konkret am Git-Repo?** Ist es das Finden, das Anschauen am Handy, das Bearbeiten oder dass andere nicht rankommen? Und wo liegt das Repo? Dann schau ich mir die Rezepte selbst an, statt dass du sie beschreiben musst.
2. **Wer ist "die Familie"?** Nur dein Haushalt oder auch Eltern und Geschwister woanders? Sollen die nur lesen oder auch eigene Rezepte anlegen und deine ändern?
3. **Beschreib mal einen typischen Kochabend mit der App.** Wo steht das Gerät, was machst du damit, was stört dich heute dabei?
4. **Woran merkst du ein paar Wochen nach dem Start, dass die App funktioniert?**

**Stakeholder:**
1. Vor allem dass ich am Handy nix vernünftig anschauen kann und meine Frau gar nicht rankommt weil's ein Git Repo ist. Liegen unter /Users/vicokuras/IdeaProjects/rezepte.
2. Nur mein Haushalt, ich und meine Frau, später vielleicht die Kids. Alle sollen alles sehen, aber nur der der's angelegt hat soll's ändern können.
3. Handy oder Tablet steht bei mir in der Küche, WiFi da ist mies. Nervt dass ich grad nix hab, muss immer erst das Repo aufmachen am Laptop.
4. Wenn ich das Git Repo nicht mehr anfass und meine Frau die App wirklich benutzt.

**Groomer:**
Danke, ich hab mir deine 8 Rezepte angeschaut. Mir ist aufgefallen: Die Ordner sind im Grunde Kategorien (Hauptgerichte, Beilagen, Soßen). Jedes Rezept hat Zutaten und Schritte, manche Schritte sind in Abschnitte gegliedert (Pute: Füllung, Würzen, Braten). Mengen fehlen oft, Portionsangaben gibt's nirgends, beim Gulasch steht ein YouTube-Link als Quelle.

Das Erfolgskriterium hab ich notiert, außerdem: nur euer Haushalt, jeder sieht alles, ändern darf nur, wer's angelegt hat.

Nächste Runde:

1. **Beim Kochen:** Handy steht in der Küche, das Rezept ist offen. Was soll die App dir dann bieten, außer dass du das Rezept lesen kannst? Oder reicht das Lesen erstmal?
2. **Rezept anlegen:** Wie stellst du dir vor, dass du oder deine Frau ein neues Rezept reinbekommt? Auf welchem Gerät, und was gehört außer Titel, Zutaten und Schritten noch dazu (Kategorie, Quelle, Foto, Portionen …)?
3. **Deine 8 bestehenden Rezepte:** Sollen die beim Start schon in der App sein? Oder ist es okay, sie selbst neu einzutippen?
4. **Schlechtes WLAN:** Was muss ohne Verbindung klappen? Nur Rezepte anschauen, die schon mal geladen waren, oder auch neue anlegen und ändern?

**Stakeholder:**
1. Groß und lesbar halt, schritt für schritt, und der screen darf nicht dauernd ausgehen während ich koche. Sonst reicht lesen.
2. Wär gut wenn ich's am handy oder laptop machen kann, ist mir eig egal welches gerät. Titel, kategorie, zutaten, schritte, portionsangabe brauch ich. Foto wär nice to have. Quelle brauch ich nicht.
3. Die 15 sollen schon drin sein, einmalig importiert. Neu eintippen will ich nicht.
4. Rezepte die ich schon offen hatte müssen auch ohne wlan gehen, is ja in der küche eh mies. Neu anlegen ohne wlan brauch ich nicht unbedingt.

**Groomer:**
Passt, das meiste ist klar. Einen Widerspruch muss ich aber ansprechen:

1. **15 vs. 8 Rezepte:** Unter `/Users/vicokuras/IdeaProjects/rezepte` finde ich nur 8 (Short Ribs, Entenbrust, Pute, Schweinebauch, Tortellini, Brauhausgulasch, Kartoffelklöße, Serviettenknödel). Auch in anderen Branches und in der Git-Historie liegt nichts weiter. Liegen die anderen 7 woanders? Wenn ja, wo?
2. **"Schritt für Schritt":** Wie stellst du dir das vor? Siehst du immer nur einen Schritt groß auf dem Bildschirm und wischst oder tippst zum nächsten? Oder alle Schritte groß untereinander, und du scrollst?
3. **Portionen:** Soll die App nur anzeigen "für 4 Personen", oder willst du auch auf z.B. 6 Personen umstellen und die Mengen rechnen sich um? Du hast "sonst reicht lesen" gesagt, deshalb frag ich lieber nach.
4. **Foto und Kategorien:** Soll das Foto schon in die erste Version oder später? Und bei den Kategorien: feste Liste (Hauptgerichte, Beilagen, Soßen) oder dürft ihr neue anlegen? Mein Vorschlag wäre, dass ihr neue anlegen dürft, weil z.B. "Desserts" sonst keinen Platz hätte.

**Stakeholder:**
1. Ah stimmt, dann sind's halt nur die 8, hab mich vertan mit der Zahl.
2. Immer ein Schritt groß, dann tippen für den nächsten.
3. Doch, will umstellen können z.B. auf 6 Personen und die Mengen sollen sich automatisch anpassen.
4. Foto gleich in der ersten Version, ja. Und bei Kategorien passt dein Vorschlag, dürfen gern neue anlegen können.

**Groomer:**
Gut, dann sind's die 8. Beim Kochen also immer ein Schritt groß, tippen zum nächsten, und die Portionen lassen sich umstellen.

Das Umrechnen kollidiert aber mit deinen bestehenden Rezepten. Da steht nirgends eine Portionsangabe, und viele Zutaten haben keine Menge ("Pute", "Zwiebeln", "Salz").

1. **Portionen bei importierten Rezepten:** Mein Vorschlag: Die 8 kommen ohne Portionsangabe rein, und umrechnen geht erst, wenn du die Portionen einmal nachgetragen hast. Bis dahin sieht man das Rezept ganz normal. Alternativ trägst du die Portionen gleich beim Import ein. Was ist dir lieber?
2. **Rezepte finden:** Mein Vorschlag: eine Liste nach Kategorien gruppiert, dazu eine Suche nach dem Rezeptnamen. Suche nach Zutaten ("was mach ich mit Hackfleisch") würde ich weglassen. Passt das, oder fehlt dir was?
3. **Was willst du auf keinen Fall?** Gibt's Sachen, die typische Rezept-Apps haben und die dich nerven würden? Zum Beispiel Bewertungen, Kommentare, Nährwerte, Einkaufsliste, öffentliches Teilen, Werbung …
4. **Später:** Wochenplan und die Kids als eigene Nutzer parke ich als "später". Also nicht in der ersten Version, aber sie sollen irgendwann kommen. Richtig so?

**Stakeholder:**
1. Nachtragen wenn ich Zeit hab ist mir lieber, muss nicht alles gleich beim Import machen.
2. Passt so.
3. Nährwerte, Bewertungen, Kommentare will ich nicht. Einkaufsliste später vielleicht mal, aber nicht jetzt. Werbung sowieso nicht, öffentlich teilen auch nicht.
4. Ja passt.

**Groomer:**
Danke, jetzt hab ich ein klares Bild. Bevor ich was aufschreibe, gehe ich es in 5 kurzen Häppchen mit dir durch. Bitte jeweils nur "passt" oder eine Korrektur.

**Häppchen 1 von 5: Ziel und Nutzer**
Die App ersetzt dein Git-Repo als Zuhause für eure Rezepte. Du und deine Frau könnt sie am Handy, Tablet oder Laptop anschauen, und in der Küche klappt das auch bei schlechtem WLAN. Nutzer sind nur ihr zwei als Haushalt, jeder mit eigenem Zugang. Du lädst deine Frau ein, niemand außerhalb sieht etwas. Erfolg heißt: Du fasst das Git-Repo nicht mehr an, und deine Frau benutzt die App wirklich. Bewusst nicht dabei sind Nährwerte, Bewertungen, Kommentare, Werbung und öffentliches Teilen.

Passt das so?

**Stakeholder:**
passt

**Groomer:**
**Häppchen 2 von 5: Die Hauptabläufe**
- **Finden:** Du öffnest die App und siehst eure Rezepte nach Kategorien gruppiert, oben eine Suche nach dem Rezeptnamen.
- **Kochen:** Im Rezept siehst du Foto, Zutaten und Portionen. Stellst du z.B. auf 6 Personen um, rechnen sich die Mengen um. Das gilt nur für deine Ansicht, das gespeicherte Rezept bleibt gleich. Dann startest du den Kochmodus: immer ein Schritt groß auf dem Bildschirm, tippen zum nächsten oder zurück, und der Bildschirm geht dabei nicht aus.
- **Anlegen:** Am Handy oder Laptop legst du ein Rezept an: Titel, Kategorie (bestehende wählen oder neue eintippen), Portionen, Zutaten mit Mengen, Schritte, optional ein Foto. Deine Frau sieht es sofort, ändern oder löschen kannst nur du.

Passt das?

**Stakeholder:**
passt

**Groomer:**
**Häppchen 3 von 5: Regeln und Sonderfälle**
- **Umrechnen:** Zutaten ohne Menge (Salz, "Pute") bleiben unverändert. Mengen, die im Schritt-Text stehen (z.B. "0,5 l Wasser" bei den Klößen), werden nicht umgerechnet, nur die Zutatenliste. Gerundet wird sinnvoll, höchstens eine Nachkommastelle, also z.B. "1,5 Eier".
- **Ohne WLAN:** Rezepte, die du schon mal offen hattest, gehen komplett ohne Verbindung, also mit Kochmodus und Umrechnen. Anlegen und Ändern braucht Verbindung. Speicherst du ohne Verbindung, sagt dir die App das, und deine Eingabe bleibt erhalten, damit du es nochmal versuchen kannst.
- **Löschen:** Nur der Ersteller kann ein Rezept löschen, und die App fragt vorher nach.
- **Kategorien:** Jedes Rezept hat genau eine Kategorie. Eine Kategorie ohne Rezepte verschwindet einfach aus der Liste.

Passt das?

**Stakeholder:**
passt

**Groomer:**
**Häppchen 4 von 5: Umfang**
- **Erste Version:** Haushalt mit dir und deiner Frau, Rezepte anschauen, suchen, anlegen, ändern und löschen, Foto, Portionen umrechnen, Kochmodus, Offline-Lesen und der einmalige Import deiner 8 Rezepte.
- **Später:** Wochenplan, Einkaufsliste, die Kids als eigene Nutzer.
- **Nicht gewollt:** Nährwerte, Bewertungen, Kommentare, Werbung, öffentliches Teilen, ein Quellen-Feld, Suche nach Zutaten, Anlegen ohne WLAN.
- **Technik:** Kotlin geht als deine feste Vorgabe an den Architekten, alles andere entscheidet er.

Passt das?

**Stakeholder:**
passt

**Groomer:**
**Häppchen 5 von 5: Was ich selbst entschieden habe**
Das hier habe ich festgelegt, ohne dass wir drüber gesprochen haben. Bitte kurz drüberschauen:
- **Import:** Die 8 Rezepte kommen 1:1 rein, Tippfehler inklusive, und gehören dir. Portionen sind leer, bis du sie nachträgst, und bis dahin geht kein Umrechnen. Mengen, die schon in der Zutat stehen ("250g Hackfleisch", "Kartoffeln (900g)"), werden als Mengen erkannt.
- **Kategorien beim Import:** Die Ordnernamen werden zu Kategorien. Short Ribs liegt in keinem Ordner und kommt zu "Hauptgerichte".
- **Quellen-Link:** Der YouTube-Link beim Gulasch geht beim Import verloren, weil es kein Quellen-Feld gibt. Okay, oder soll er erhalten bleiben?
- **Abschnitte:** Schritte können in Abschnitte gegliedert sein, wie bei der Pute (Füllung, Würzen, Braten). Der Kochmodus zeigt den Abschnittsnamen mit an.
- **Sonst:** höchstens ein Foto pro Rezept, und die App ist auf Deutsch.

Passt das?

**Stakeholder:**
passt, YouTube link kann weg

**Groomer:**
Ich hab alles abgeglichen: Jede deiner Aussagen ist entweder in der ersten Version, als "später" geparkt oder mit dir zusammen gestrichen. Offene Fragen gibt es keine mehr.

Das Dokument ist fertig und geht jetzt an den Architekten. Lesen musst du es nicht.
- `docs/requirements/001-recipe-app-mvp.md`
- `docs/product.md`
